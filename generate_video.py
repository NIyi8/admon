#!/usr/bin/env python3
"""
Nesra mental wellness video generator.
Run from the project root: python generate_video.py

What this script does:
  1. Installs Python dependencies (gTTS, pydub)
  2. Generates a voiceover MP3 using gTTS (falls back to pyttsx3, then silent)
  3. Installs Node.js dependencies and renders the Remotion composition
  4. Merges voiceover (+ optional background music) into the rendered video
  5. Writes final_video.mp4 to the output/ folder

Requirements:
  - Python 3.8+
  - Node.js 18+ and npm in PATH
  - ffmpeg in PATH (for audio merge; skipped if absent)
"""

import os
import sys
import subprocess
import shutil
import json
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR / "output"
VOICEOVER_PATH = OUTPUT_DIR / "voiceover.mp3"
RAW_VIDEO_PATH = OUTPUT_DIR / "video_no_audio.mp4"
FINAL_VIDEO_PATH = OUTPUT_DIR / "final_video.mp4"

FULL_SCRIPT = (
    "5 signs you're mentally exhausted... that nobody talks about. "
    "Number one. You're tired no matter how much you sleep. "
    "Eight hours. Nine hours. Still exhausted. "
    "That's not laziness. That's your mind running on empty. "
    "Number two. Small decisions feel impossible. "
    "What to eat. What to wear. What to reply. "
    "When your brain is burnt out, even tiny choices feel overwhelming. "
    "Number three. You've stopped enjoying things you used to love. "
    "Not sad exactly. Just numb. "
    "That's emotional exhaustion, not depression. There's a difference. "
    "Number four. You're irritable for no reason. "
    "Snapping at people who don't deserve it. "
    "Feeling on edge constantly. Your nervous system is overloaded. "
    "Number five. You keep saying you're fine. "
    "But you're not fine. You're just tired of explaining it. "
    "If any of these hit, your mind needs attention, not just rest. "
    "Start small. Check in with yourself daily. "
    "Even five minutes of journaling changes things more than you'd think. "
    "Nesra is a free app that helps you do exactly that. Link in bio."
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def run(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess:
    print(f"  $ {' '.join(str(c) for c in cmd)}")
    return subprocess.run(cmd, cwd=cwd, check=check, capture_output=False)


def pip(packages: list[str]) -> None:
    for pkg in packages:
        try:
            subprocess.run(
                [sys.executable, "-m", "pip", "install", "--quiet", pkg],
                check=True,
            )
            print(f"  ✓ {pkg}")
        except subprocess.CalledProcessError:
            print(f"  ✗ {pkg} — install failed (continuing)")


def require(tool: str) -> bool:
    return shutil.which(tool) is not None


# ── Step 1 — Install Python deps ───────────────────────────────────────────────

def install_python_deps() -> None:
    print("\n[1/4] Installing Python dependencies …")
    pip(["gtts", "pydub"])


# ── Step 2 — Generate voiceover ────────────────────────────────────────────────

def generate_voiceover() -> bool:
    """Returns True if audio was generated successfully."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Try gTTS first
    try:
        from gtts import gTTS  # type: ignore
        print("\n[2/4] Generating voiceover with gTTS …")
        tts = gTTS(text=FULL_SCRIPT, lang="en", tld="co.uk", slow=False)
        tts.save(str(VOICEOVER_PATH))
        print(f"  ✓ Voiceover saved to {VOICEOVER_PATH}")
        return True
    except Exception as e:
        print(f"  gTTS failed: {e}")

    # Fallback: pyttsx3
    try:
        pip(["pyttsx3"])
        import pyttsx3  # type: ignore
        print("\n[2/4] Generating voiceover with pyttsx3 …")
        engine = pyttsx3.init()
        engine.setProperty("rate", 155)
        engine.setProperty("volume", 1.0)
        wav_path = OUTPUT_DIR / "voiceover.wav"
        engine.save_to_file(FULL_SCRIPT, str(wav_path))
        engine.runAndWait()
        # Convert to mp3 if ffmpeg available
        if require("ffmpeg"):
            subprocess.run(
                ["ffmpeg", "-y", "-i", str(wav_path), str(VOICEOVER_PATH)],
                check=True, capture_output=True,
            )
            wav_path.unlink(missing_ok=True)
        else:
            VOICEOVER_PATH = wav_path  # use wav directly
        print(f"  ✓ Voiceover saved to {VOICEOVER_PATH}")
        return True
    except Exception as e:
        print(f"  pyttsx3 failed: {e}")

    print(
        "\n  WARNING: No TTS engine worked. Video will render without voiceover.\n"
        "  Use voiceover_script.txt with ElevenLabs to generate audio separately."
    )
    return False


# ── Step 3 — Render Remotion composition ──────────────────────────────────────

def render_video() -> bool:
    print("\n[3/4] Rendering Remotion composition …")

    # Install Node deps if needed
    if not (SCRIPT_DIR / "node_modules").exists():
        print("  Installing Node.js dependencies …")
        run(["npm", "install"], cwd=SCRIPT_DIR)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Detect npx
    npx = shutil.which("npx")
    if not npx:
        print("  ERROR: npx not found. Install Node.js 18+ and re-run.")
        return False

    try:
        run(
            [
                npx, "remotion", "render",
                "src/index.ts",
                "NesraWellness",
                str(RAW_VIDEO_PATH),
                "--codec=h264",
                "--log=verbose",
            ],
            cwd=SCRIPT_DIR,
        )
        print(f"  ✓ Raw video saved to {RAW_VIDEO_PATH}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: Remotion render failed (exit code {e.returncode})")
        return False


# ── Step 4 — Mix audio into video ─────────────────────────────────────────────

def mix_audio(has_voiceover: bool) -> None:
    print("\n[4/4] Mixing audio …")

    if not require("ffmpeg"):
        print("  ffmpeg not found — skipping audio mix.")
        if RAW_VIDEO_PATH.exists():
            shutil.copy(RAW_VIDEO_PATH, FINAL_VIDEO_PATH)
            print(f"  Copied raw video to {FINAL_VIDEO_PATH} (no audio).")
        print(
            "  To add audio manually:\n"
            f"    ffmpeg -i {RAW_VIDEO_PATH} -i {VOICEOVER_PATH} "
            "-c:v copy -c:a aac -shortest output/final_video.mp4"
        )
        return

    if not RAW_VIDEO_PATH.exists():
        print("  Raw video not found — cannot mix audio.")
        return

    if not has_voiceover or not VOICEOVER_PATH.exists():
        shutil.copy(RAW_VIDEO_PATH, FINAL_VIDEO_PATH)
        print(f"  No voiceover — copying raw video to {FINAL_VIDEO_PATH}.")
        return

    # Check for optional background music file
    music_candidates = [
        SCRIPT_DIR / "background_music.mp3",
        SCRIPT_DIR / "background_music.wav",
        SCRIPT_DIR / "lofi.mp3",
    ]
    music_file = next((p for p in music_candidates if p.exists()), None)

    if music_file:
        print(f"  Background music found: {music_file}")
        filter_complex = (
            "[1:a]volume=1.0[vo];"
            "[2:a]volume=0.1,aloop=loop=-1:size=2e+09[bg];"
            "[vo][bg]amix=inputs=2:duration=first[audio]"
        )
        cmd = [
            "ffmpeg", "-y",
            "-i", str(RAW_VIDEO_PATH),
            "-i", str(VOICEOVER_PATH),
            "-i", str(music_file),
            "-filter_complex", filter_complex,
            "-map", "0:v",
            "-map", "[audio]",
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(FINAL_VIDEO_PATH),
        ]
    else:
        print("  No background_music.mp3 found — merging voiceover only.")
        print("  (Place a royalty-free lofi track at background_music.mp3 and re-run for music.)")
        cmd = [
            "ffmpeg", "-y",
            "-i", str(RAW_VIDEO_PATH),
            "-i", str(VOICEOVER_PATH),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-shortest",
            str(FINAL_VIDEO_PATH),
        ]

    try:
        subprocess.run(cmd, check=True)
        print(f"  ✓ Final video saved to {FINAL_VIDEO_PATH}")
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: ffmpeg mix failed (exit code {e.returncode})")
        shutil.copy(RAW_VIDEO_PATH, FINAL_VIDEO_PATH)
        print(f"  Falling back — raw video copied to {FINAL_VIDEO_PATH}.")


# ── Summary ────────────────────────────────────────────────────────────────────

def print_summary(video_ok: bool, audio_ok: bool) -> None:
    print("\n" + "━" * 60)
    print("DONE")
    print("━" * 60)

    files = {
        "output/final_video.mp4": FINAL_VIDEO_PATH,
        "output/video_no_audio.mp4": RAW_VIDEO_PATH,
        "output/voiceover.mp3": VOICEOVER_PATH,
        "voiceover_script.txt": SCRIPT_DIR / "voiceover_script.txt",
        "caption_file.srt": SCRIPT_DIR / "caption_file.srt",
        "tiktok_caption.txt": SCRIPT_DIR / "tiktok_caption.txt",
    }
    for label, path in files.items():
        status = "✓" if path.exists() else "✗"
        print(f"  {status} {label}")

    if not audio_ok:
        print(
            "\n  Audio note: voiceover not generated automatically.\n"
            "  Open voiceover_script.txt and paste into ElevenLabs for a\n"
            "  high-quality voiceover, then run:\n"
            "    ffmpeg -i output/video_no_audio.mp4 -i <your_audio.mp3> \\\n"
            "      -c:v copy -c:a aac -shortest output/final_video.mp4"
        )
    if not video_ok:
        print(
            "\n  Video note: Remotion render failed.\n"
            "  Check Node.js is installed (node --version) and re-run."
        )
    print()


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("Nesra Mental Wellness — Video Generator")
    print("=" * 60)

    install_python_deps()
    audio_ok = generate_voiceover()
    video_ok = render_video()
    mix_audio(audio_ok)
    print_summary(video_ok, audio_ok)


if __name__ == "__main__":
    main()
