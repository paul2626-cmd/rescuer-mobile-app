#!/usr/bin/env python3
"""Fail the Android smoke test if startup is blank or reports a fatal JS error."""

import sys
import xml.etree.ElementTree as ET
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: verify_android_startup.py UI_XML LOGCAT", file=sys.stderr)
        return 2

    ui_path = Path(sys.argv[1])
    log_path = Path(sys.argv[2])

    try:
        root = ET.parse(ui_path).getroot()
    except (ET.ParseError, OSError) as error:
        print(f"Could not read Android UI hierarchy: {error}", file=sys.stderr)
        return 1

    visible_text = " ".join(
        (node.attrib.get("text", "") + " " + node.attrib.get("content-desc", ""))
        for node in root.iter()
    ).casefold()
    missing = [label for label in ("sign in", "email", "password") if label not in visible_text]
    if missing:
        print(f"Sign-in screen is missing visible controls: {', '.join(missing)}", file=sys.stderr)
        return 1

    try:
        logcat = log_path.read_text(errors="replace")
    except OSError as error:
        print(f"Could not read Android logcat: {error}", file=sys.stderr)
        return 1

    fatal_markers = (
        "FATAL EXCEPTION",
        "Unable to load script",
        "Attempted to navigate before mounting the Root Layout",
        "ReactNativeJS: Error",
        "ReferenceError:",
    )
    found = [marker for marker in fatal_markers if marker.casefold() in logcat.casefold()]
    if found:
        print(f"App startup logged a fatal error: {', '.join(found)}", file=sys.stderr)
        return 1

    print("Android startup smoke test passed: sign-in controls are visible and no fatal startup error was logged.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
