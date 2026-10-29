#!/usr/bin/env python3
"""Install and smoke-test the release APK on the running Android emulator."""

from __future__ import annotations

import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path("qa-output")
APK = Path("Kalinga-Rescuer-emulator.apk")
UI_DEVICE_PATH = "/sdcard/kalinga-ui.xml"
STARTUP_TIMEOUT_SECONDS = 120


def adb(*args: str, timeout: int = 25, check: bool = True) -> str:
    try:
        result = subprocess.run(
            ["adb", *args],
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired as error:
        raise RuntimeError(f"adb {' '.join(args)} timed out after {timeout}s") from error
    if check and result.returncode != 0:
        raise RuntimeError(f"adb {' '.join(args)} failed: {result.stdout[-2000:]}")
    return result.stdout


def capture_evidence() -> None:
    try:
        result = subprocess.run(
            ["adb", "exec-out", "screencap", "-p"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30,
            check=False,
        )
        if result.returncode == 0 and result.stdout:
            (ROOT / "startup.png").write_bytes(result.stdout)
    except subprocess.TimeoutExpired:
        print("Warning: screenshot capture timed out.", file=sys.stderr)

    (ROOT / "pid.txt").write_text(adb("shell", "pidof", "com.rescuer.mobile", check=False).strip())
    try:
        logs = adb("logcat", "-d", "-t", "5000", timeout=30, check=False)
        (ROOT / "logcat.txt").write_text(logs)
    except RuntimeError as error:
        print(f"Warning: logcat capture failed: {error}", file=sys.stderr)


def visible_text(xml_text: str) -> tuple[str, ET.Element | None]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return "", None
    labels = " ".join(
        node.attrib.get("text", "") + " " + node.attrib.get("content-desc", "")
        for node in root.iter()
    ).casefold()
    return labels, root


def dismiss_system_wait_dialog(root: ET.Element | None) -> bool:
    if root is None:
        return False
    for node in root.iter("node"):
        if node.attrib.get("resource-id") != "android:id/aerr_wait":
            continue
        bounds = node.attrib.get("bounds", "")
        try:
            left_top, right_bottom = bounds.strip("[]").split("][")
            left, top = (int(value) for value in left_top.split(","))
            right, bottom = (int(value) for value in right_bottom.split(","))
        except (ValueError, TypeError):
            return False
        x, y = (left + right) // 2, (top + bottom) // 2
        adb("shell", "input", "tap", str(x), str(y), timeout=15, check=False)
        print("Dismissed Android's temporary system wait prompt; continuing startup check.")
        return True
    return False


def main() -> int:
    ROOT.mkdir(parents=True, exist_ok=True)
    if not APK.is_file():
        print(f"Missing emulator APK: {APK}", file=sys.stderr)
        return 2

    try:
        print("Installing x86_64 release APK.")
        adb("install", "-r", str(APK), timeout=600)
        adb("shell", "pm", "clear", "com.rescuer.mobile", timeout=45)
        adb("logcat", "-c", timeout=20, check=False)
        adb("shell", "am", "start", "-n", "com.rescuer.mobile/.MainActivity", timeout=45)
    except RuntimeError as error:
        capture_evidence()
        print(error, file=sys.stderr)
        return 1

    deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
    last_xml = ""
    while time.monotonic() < deadline:
        try:
            adb("shell", "rm", "-f", UI_DEVICE_PATH, timeout=15, check=False)
            adb("shell", "uiautomator", "dump", UI_DEVICE_PATH, timeout=25, check=False)
            last_xml = adb("exec-out", "cat", UI_DEVICE_PATH, timeout=15, check=False)
            (ROOT / "ui.xml").write_text(last_xml)
        except RuntimeError as error:
            print(f"Startup probe will retry: {error}", file=sys.stderr)
            time.sleep(4)
            continue

        labels, root = visible_text(last_xml)
        if all(label in labels for label in ("sign in", "email", "password")):
            capture_evidence()
            result = subprocess.run(
                [sys.executable, "scripts/verify_android_startup.py",
                 str(ROOT / "ui.xml"), str(ROOT / "logcat.txt"), str(ROOT / "pid.txt")],
                check=False,
            )
            return result.returncode

        if dismiss_system_wait_dialog(root):
            time.sleep(4)
            continue

        if "process system isn't responding" in labels:
            print("Android is still initializing its system UI; waiting for the prompt to clear.")
        else:
            print("Waiting for the app sign-in controls to render.")
        time.sleep(4)

    capture_evidence()
    labels, _ = visible_text(last_xml)
    print(
        "Android startup did not reach the sign-in screen within "
        f"{STARTUP_TIMEOUT_SECONDS}s. Last visible text: {labels[:500]}",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
