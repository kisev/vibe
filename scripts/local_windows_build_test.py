#!/usr/bin/env -S uv run
"""Tests for `scripts/local_windows_build.sh`.

    uv run scripts/local_windows_build_test.py

The script builds on a Windows host, so these tests replace every Windows-facing
command (`powershell.exe`, `wslpath`, `rsync`, `task`, the sidecar `bash`) with a
recording stub and assert on what the script asked them to do. No real checkout,
network or bundle is touched.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPT = REPO / "scripts" / "local_windows_build.sh"

POWERSHELL = r'''#!/bin/bash
set -euo pipefail
events="${STUB_EVENTS:?}"
case " $* " in
*" -Command "*)
    printf 'powershell-command\n' >>"$events"
    printf 'C:\\Users\\Tester\r\n'
    ;;
*" -File "*)
    printf 'build\n' >>"$events"
    file=""
    while [ "$#" -gt 0 ]; do
        if [ "$1" = "-File" ]; then
            file="$2"
        fi
        shift
    done
    mapped="$(printf '%s' "$file" | tr '\\' '/')"
    directory="${mapped%/*}"
    checkout="${STUB_UNIX_ROOT:?}/${directory##*/}"
    mkdir -p "$checkout/target/release/bundle/nsis"
    : >"$checkout/target/release/bundle/nsis/vibe_x64-setup.exe"
    ;;
*)
    printf 'powershell-command\n' >>"$events"
    ;;
esac
'''

WSLPATH = r'''#!/bin/bash
set -euo pipefail
if [ "${1:-}" = "-u" ]; then
    name="$(printf '%s' "${2:-}" | tr '\\' '/')"
    name="${name%/}"
    printf '%s/%s\n' "${STUB_UNIX_ROOT:?}" "${name##*/}"
else
    printf '%s\n' "${2:-}"
fi
'''

RSYNC = r'''#!/bin/bash
set -euo pipefail
dest="${*: -1}"
mkdir -p "$dest/desktop" "$dest/scripts/ci"
'''

BASH = r'''#!/bin/bash
printf 'bash %s\n' "$*" >>"${STUB_EVENTS:?}"
exit 0
'''

TASK = r'''#!/bin/bash
set -euo pipefail
printf 'task %s\n' "$*" >>"${STUB_EVENTS:?}"
exit "${STUB_TASK_EXIT:-0}"
'''

STUBS = {
    "powershell.exe": POWERSHELL,
    "wslpath": WSLPATH,
    "rsync": RSYNC,
    "bash": BASH,
    "task": TASK,
}

COUNTER_RELEASE = r"D:\vibe-alt"
UNC_CHECKOUT = r"\\wsl.localhost\Ubuntu\home\tester\vibe"


class LocalWindowsBuildTest(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.stubs = self.root / "bin"
        self.stubs.mkdir()
        for name, body in STUBS.items():
            stub = self.stubs / name
            stub.write_text(body, encoding="utf-8")
            stub.chmod(0o755)
        self.events = self.root / "events.log"
        self.events.write_text("", encoding="utf-8")

    def run_build(
        self, *args: str, env: dict[str, str] | None = None
    ) -> subprocess.CompletedProcess[str]:
        environment = dict(os.environ)
        environment.pop("VIBE_WIN_CHECKOUT", None)
        environment.update(
            {
                "PATH": f"{self.stubs}{os.pathsep}{environment['PATH']}",
                "STUB_EVENTS": str(self.events),
                "STUB_UNIX_ROOT": str(self.root / "windows"),
            }
        )
        if env:
            environment.update(env)
        return subprocess.run(
            ["/bin/bash", str(SCRIPT), *args],
            cwd=REPO,
            env=environment,
            capture_output=True,
            text=True,
            check=False,
        )

    def checkout(self, name: str) -> Path:
        return self.root / "windows" / name

    def event_lines(self) -> list[str]:
        return self.events.read_text(encoding="utf-8").splitlines()

    def test_a_fresh_build_stamps_the_version_and_finds_the_installer(self) -> None:
        result = self.run_build()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(r"==> checkout: C:\Users\Tester\vibe-build", result.stdout)
        match = re.search(r"==> version: (1\.0\.0-local\.\d{8}\.[0-9a-f]+)", result.stdout)
        self.assertIsNotNone(match)
        version = match.group(1)

        overlay = json.loads(
            (self.checkout("vibe-build") / "desktop" / "local-build.json").read_text(encoding="utf-8")
        )
        self.assertEqual(overlay["version"], version)
        self.assertFalse(overlay["bundle"]["createUpdaterArtifacts"])

        windows_script = (self.checkout("vibe-build") / "local-build.ps1").read_text(encoding="utf-8")
        self.assertIn("pnpm install --frozen-lockfile", windows_script)
        self.assertIn("tauri build --config local-build.json --bundles nsis", windows_script)

        self.assertIn("vibe_x64-setup.exe", result.stdout)

    def test_a_configured_checkout_path_is_used_and_the_default_untouched(self) -> None:
        result = self.run_build(env={"VIBE_WIN_CHECKOUT": COUNTER_RELEASE})

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(r"==> checkout: D:\vibe-alt", result.stdout)
        self.assertTrue(
            (self.checkout("vibe-alt") / "desktop" / "local-build.json").is_file()
        )
        self.assertFalse(self.checkout("vibe-build").exists())

    def test_verified_runs_the_gate_before_the_build(self) -> None:
        result = self.run_build("--verified")

        self.assertEqual(result.returncode, 0, result.stderr)
        events = self.event_lines()
        self.assertIn("task verify", events)
        self.assertLess(events.index("task verify"), events.index("build"))

    def test_a_failed_gate_stops_the_build(self) -> None:
        result = self.run_build("--verified", env={"STUB_TASK_EXIT": "1"})

        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("build", self.event_lines())
        self.assertFalse(self.checkout("vibe-build").exists())

    def test_nothing_is_published(self) -> None:
        text = SCRIPT.read_text(encoding="utf-8")
        for forbidden in ("git tag", "gh release", "gh upload", "curl ", "--sign"):
            self.assertNotIn(forbidden, text)

        result = self.run_build()

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([line for line in self.event_lines() if line.startswith("task ")], [])
        overlay = json.loads(
            (self.checkout("vibe-build") / "desktop" / "local-build.json").read_text(encoding="utf-8")
        )
        self.assertFalse(overlay["bundle"]["createUpdaterArtifacts"])

    def test_a_unc_checkout_is_refused(self) -> None:
        result = self.run_build(env={"VIBE_WIN_CHECKOUT": UNC_CHECKOUT})

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Windows drive path", result.stderr)
        self.assertNotIn("build", self.event_lines())


if __name__ == "__main__":
    unittest.main()
