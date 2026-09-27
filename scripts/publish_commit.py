#!/usr/bin/env python3
"""Publish files to nvmaditya/adityas-tech-report with a locked git identity.

The GitHub Contents API (push_files / create_or_update_file) must not be used.
It has written author email aditya@users.noreply.github.com, which GitHub links
to github.com/aditya (user id 248), not nvmaditya.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

OWNER = "nvmaditya"
REPO = "adityas-tech-report"
BRANCH = "main"
AUTHOR_NAME = "Aditya Khandelwal"
AUTHOR_EMAIL = "138802256+nvmaditya@users.noreply.github.com"
EXPECTED_LOGIN = "nvmaditya"
BANNED_EMAILS = frozenset({"aditya@users.noreply.github.com"})


def run(cmd: list[str], *, cwd: str | None = None, env: dict | None = None, input_bytes: bytes | None = None) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(cmd, cwd=cwd, env=env, input=input_bytes, check=True, capture_output=True)
    except subprocess.CalledProcessError as exc:
        err = (exc.stderr or b"").decode()[-2000:]
        out = (exc.stdout or b"").decode()[-1000:]
        raise SystemExit(f"command failed ({exc.returncode}): {' '.join(cmd)}\n{out}\n{err}") from exc


def identity_error(name: str, email: str, role: str) -> str | None:
    if email in BANNED_EMAILS or (email.endswith("@users.noreply.github.com") and not email.startswith("138802256+")):
        return f"{role} email {email!r} is not the locked nvmaditya noreply"
    if name != AUTHOR_NAME or email != AUTHOR_EMAIL:
        return f"{role} is {name} <{email}>, want {AUTHOR_NAME} <{AUTHOR_EMAIL}>"
    return None


def commit_env(base: dict | None = None) -> dict:
    env = dict(base or os.environ)
    env["GIT_AUTHOR_NAME"] = AUTHOR_NAME
    env["GIT_AUTHOR_EMAIL"] = AUTHOR_EMAIL
    env["GIT_COMMITTER_NAME"] = AUTHOR_NAME
    env["GIT_COMMITTER_EMAIL"] = AUTHOR_EMAIL
    return env


def assert_head(cwd: str) -> str:
    raw = run(
        ["git", "log", "-1", "--format=%an%x00%ae%x00%cn%x00%ce%x00%H"],
        cwd=cwd,
    ).stdout.decode()
    name, email, cname, cemail, sha = raw.rstrip("\n").split("\0")
    for role, who, addr in (("author", name, email), ("committer", cname, cemail)):
        err = identity_error(who, addr, role)
        if err:
            raise SystemExit(err)
    return sha


def gh_login() -> str:
    return run(["gh", "api", "user", "--jq", ".login"]).stdout.decode().strip()


def verify_github(sha: str) -> None:
    last = None
    for _ in range(5):
        payload = json.loads(run(["gh", "api", f"repos/{OWNER}/{REPO}/commits/{sha}"]).stdout.decode())
        author = payload.get("author") or {}
        committer = payload.get("committer") or {}
        commit = payload.get("commit") or {}
        a = commit.get("author") or {}
        c = commit.get("committer") or {}
        last = {
            "author_login": author.get("login"),
            "committer_login": committer.get("login"),
            "author_email": a.get("email"),
            "committer_email": c.get("email"),
        }
        emails_ok = last["author_email"] == AUTHOR_EMAIL and last["committer_email"] == AUTHOR_EMAIL
        logins_ok = last["author_login"] == EXPECTED_LOGIN and last["committer_login"] == EXPECTED_LOGIN
        if emails_ok and logins_ok:
            return
        if emails_ok and (last["author_login"] is None or last["committer_login"] is None):
            time.sleep(1)
            continue
        break
    raise SystemExit(f"GitHub attributed {sha} incorrectly: {last}")


def publish(message: str, files: list[tuple[str, str]]) -> None:
    login = gh_login()
    if login != EXPECTED_LOGIN:
        raise SystemExit(f"refusing to publish: gh is authenticated as {login}, not {EXPECTED_LOGIN}")
    work = tempfile.mkdtemp(prefix="atr-publish-")
    try:
        run(["gh", "repo", "clone", f"{OWNER}/{REPO}", work, "--", "--branch", BRANCH])
        for src, dest in files:
            target = Path(work) / dest
            if dest.startswith("/") or ".." in Path(dest).parts:
                raise SystemExit(f"refusing repo path {dest}")
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, target)
            run(["git", "add", "--", dest], cwd=work)
        diff = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=work)
        if diff.returncode == 0:
            print("nothing to commit")
            return
        if diff.returncode != 1:
            raise SystemExit(f"git diff failed ({diff.returncode})")
        env = commit_env()
        run(["git", "config", "user.name", AUTHOR_NAME], cwd=work)
        run(["git", "config", "user.email", AUTHOR_EMAIL], cwd=work)
        run(["git", "commit", "-m", message], cwd=work, env=env)
        sha = assert_head(work)
        run(["git", "push", "origin", f"HEAD:{BRANCH}"], cwd=work)
        verify_github(sha)
        print(f"pushed {sha} as {EXPECTED_LOGIN} <{AUTHOR_EMAIL}>")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def self_test() -> None:
    work = tempfile.mkdtemp(prefix="atr-id-")
    try:
        run(["git", "init", "-b", "main"], cwd=work)
        env = commit_env()
        run(["git", "config", "user.name", AUTHOR_NAME], cwd=work)
        run(["git", "config", "user.email", AUTHOR_EMAIL], cwd=work)
        (Path(work) / "a.txt").write_text("ok\n")
        run(["git", "add", "a.txt"], cwd=work)
        run(["git", "commit", "-m", "test"], cwd=work, env=env)
        assert_head(work)
        bad = identity_error("Aditya", "aditya@users.noreply.github.com", "author")
        if not bad:
            raise SystemExit("banned email was accepted")
        short = identity_error("nvmaditya", "nvmaditya@users.noreply.github.com", "author")
        if not short:
            raise SystemExit("username-only noreply was accepted")
        print("self-test ok")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish with the locked nvmaditya commit identity.")
    parser.add_argument("--message", help="Commit message")
    parser.add_argument("--file", action="append", default=[], metavar="SRC:DEST", help="Local file and repo path")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    if not args.message or not args.file:
        parser.error("--message and at least one --file SRC:DEST are required")
    files: list[tuple[str, str]] = []
    for item in args.file:
        if ":" not in item:
            parser.error(f"--file must be SRC:DEST, got {item}")
        src, dest = item.split(":", 1)
        if not Path(src).is_file():
            raise SystemExit(f"missing file {src}")
        files.append((src, dest))
    publish(args.message, files)


if __name__ == "__main__":
    main()
