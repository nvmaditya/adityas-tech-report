"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const RATES = [0.85, 1, 1.15, 1.35];

function scoreVoice(v) {
  const name = `${v.name} ${v.lang}`.toLowerCase();
  let n = 0;
  if (/^en[-_]/i.test(v.lang) || /english/i.test(name)) n += 8;
  if (/en-in|english \(india\)/i.test(name)) n += 3;
  if (/en-gb|en-us/i.test(name)) n += 2;
  if (/google|microsoft|neural|natural|premium|enhanced|samantha|daniel|aria|jenny|guy|sonia|ravi|heera/i.test(name)) n += 6;
  if (/compact|eloquence|espeak|android/i.test(name)) n -= 4;
  return n;
}

function pickVoice(voices) {
  const ranked = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
  return ranked[0] || null;
}

function cleanText(raw) {
  return String(raw || "")
    .replace(/\u00a0/g, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^Tag:\s*/i, "")
    .replace(/^Why it matters\.\s*/i, "Why it matters: ")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function collectCues(root, title, lede) {
  const cues = [];
  if (title) cues.push({ id: "title", text: title, el: null });
  if (lede) cues.push({ id: "lede", text: lede, el: null });
  if (!root) return cues;
  const nodes = root.querySelectorAll("h2, h3, p");
  let i = 0;
  for (const el of nodes) {
    if (el.closest("figure") || el.querySelector("img, figure")) continue;
    const text = cleanText(el.textContent);
    if (!text) continue;
    if (/^sources:/i.test(text)) continue;
    if (/^tag:\s*$/i.test(text)) continue;
    cues.push({ id: `c${i++}`, text, el });
  }
  return cues;
}

export default function ListenBar({ title, lede, audioSrc }) {
  const [voices, setVoices] = useState([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState(audioSrc ? "studio" : "live");
  const [progress, setProgress] = useState(0);
  const [cues, setCues] = useState([]);
  const [err, setErr] = useState("");
  const audioRef = useRef(null);
  const idxRef = useRef(0);
  const playingRef = useRef(false);
  const voiceRef = useRef(null);
  const rateRef = useRef(1);

  useEffect(() => {
    const root = document.querySelector("article.prose");
    setCues(collectCues(root, title, lede));
  }, [title, lede]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      const best = pickVoice(list);
      if (best) {
        setVoiceURI(best.voiceURI);
        voiceRef.current = best;
      }
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    voiceRef.current = voices.find((v) => v.voiceURI === voiceURI) || pickVoice(voices);
  }, [voiceURI, voices]);

  useEffect(() => {
    rateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    return () => {
      playingRef.current = false;
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const voiceOptions = useMemo(() => {
    const en = voices.filter((v) => /^en/i.test(v.lang) || /english/i.test(v.name));
    const pool = en.length ? en : voices;
    return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a)).slice(0, 12);
  }, [voices]);

  function mark(el) {
    document.querySelectorAll(".tts-now").forEach((n) => n.classList.remove("tts-now"));
    if (el) {
      el.classList.add("tts-now");
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function speakFrom(start) {
    if (!window.speechSynthesis) {
      setErr("This browser has no speech engine.");
      return;
    }
    window.speechSynthesis.cancel();
    idxRef.current = start;
    setIndex(start);
    playingRef.current = true;
    setPlaying(true);
    setErr("");

    const run = (i) => {
      if (!playingRef.current) return;
      if (i >= cues.length) {
        playingRef.current = false;
        setPlaying(false);
        setIndex(0);
        mark(null);
        return;
      }
      idxRef.current = i;
      setIndex(i);
      const cue = cues[i];
      mark(cue.el);
      const u = new SpeechSynthesisUtterance(cue.text);
      u.voice = voiceRef.current;
      u.rate = rateRef.current;
      u.pitch = 0.98;
      u.lang = voiceRef.current?.lang || "en-US";
      u.onend = () => {
        if (playingRef.current) run(i + 1);
      };
      u.onerror = () => {
        if (playingRef.current) run(i + 1);
      };
      window.speechSynthesis.speak(u);
    };
    run(start);
  }

  function stopLive() {
    playingRef.current = false;
    setPlaying(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    mark(null);
  }

  function toggle() {
    if (mode === "studio" && audioRef.current) {
      const a = audioRef.current;
      if (a.paused) {
        a.playbackRate = rate;
        a.play().then(() => setPlaying(true)).catch(() => {
          setErr("Studio track failed. Switching to live voice.");
          setMode("live");
          speakFrom(idxRef.current);
        });
      } else {
        a.pause();
        setPlaying(false);
      }
      return;
    }
    if (playingRef.current) stopLive();
    else speakFrom(idxRef.current);
  }

  function skip(delta) {
    if (mode === "studio" && audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + delta * 15);
      return;
    }
    const next = Math.max(0, Math.min(cues.length - 1, idxRef.current + delta));
    if (playingRef.current) speakFrom(next);
    else {
      idxRef.current = next;
      setIndex(next);
    }
  }

  const label =
    mode === "studio"
      ? playing
        ? "Studio narration"
        : "Listen \u2014 studio track"
      : cues[index]?.text
        ? cues[index].text.slice(0, 88)
        : "Listen to this briefing";

  const supported = typeof window === "undefined" || "speechSynthesis" in window || Boolean(audioSrc);

  return (
    <div className="listen" role="region" aria-label="Listen to this briefing">
      {audioSrc ? (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="none"
          onTimeUpdate={(e) => {
            const a = e.currentTarget;
            if (a.duration) setProgress(a.currentTime / a.duration);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
        />
      ) : null}
      <div className="listen-row">
        <button type="button" className="listen-play" onClick={toggle} disabled={!supported} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "Pause" : "Listen"}
        </button>
        <button type="button" className="listen-skip" onClick={() => skip(-1)} aria-label="Previous section">
          Prev
        </button>
        <button type="button" className="listen-skip" onClick={() => skip(1)} aria-label="Next section">
          Next
        </button>
        <div className="listen-meta">
          <strong>{mode === "studio" ? "Studio" : "Live voice"}</strong>
          <span>{label}</span>
        </div>
      </div>
      <div className="listen-tools">
        <label>
          Speed
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r.toFixed(2).replace(/0$/, "")}\u00d7
              </option>
            ))}
          </select>
        </label>
        {mode === "live" ? (
          <label>
            Voice
            <select value={voiceURI} onChange={(e) => setVoiceURI(e.target.value)}>
              {voiceOptions.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <button type="button" className="listen-alt" onClick={() => { stopLive(); setMode("live"); }}>
            Use live voice
          </button>
        )}
        {audioSrc && mode === "live" ? (
          <button type="button" className="listen-alt" onClick={() => { stopLive(); setMode("studio"); }}>
            Use studio track
          </button>
        ) : null}
      </div>
      <div className="listen-bar" aria-hidden="true">
        <i style={{ width: `${Math.round((mode === "studio" ? progress : cues.length ? index / cues.length : 0) * 100)}%` }} />
      </div>
      {err ? <p className="listen-err">{err}</p> : null}
    </div>
  );
}
