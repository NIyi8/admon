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

def _script_to_wav(wav_out: Path) -> bool:
    """Write FULL_SCRIPT to a wav file. Returns True on success."""
    script_file = OUTPUT_DIR / "_tts_script.txt"
    script_file.write_text(FULL_SCRIPT.replace("'", "'").replace("—", "..."))

    # 1. espeak-ng CLI (most reliable in restricted environments)
    if require("espeak-ng"):
        try:
            subprocess.run(
                [
                    "espeak-ng", "-v", "en-gb-x-rp",
                    "-s", "195", "-p", "48", "-g", "2",
                    "-f", str(script_file),
                    "-w", str(wav_out),
                ],
                check=True, capture_output=True,
            )
            if wav_out.exists() and wav_out.stat().st_size > 1000:
                return True
        except Exception as e:
            print(f"  espeak-ng failed: {e}")

    # 2. pyttsx3 (wraps espeak-ng or platform TTS)
    try:
        pip(["pyttsx3"])
        import pyttsx3  # type: ignore
        engine = pyttsx3.init()
        engine.setProperty("rate", 170)
        engine.setProperty("volume", 1.0)
        engine.save_to_file(FULL_SCRIPT, str(wav_out))
        engine.runAndWait()
        if wav_out.exists() and wav_out.stat().st_size > 1000:
            return True
    except Exception as e:
        print(f"  pyttsx3 failed: {e}")

    return False


def generate_voiceover() -> bool:
    """Generates voiceover MP3 timed to match the 52-second video."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    VIDEO_DURATION = 52.05  # seconds — must match durationInFrames/fps in Root.tsx

    # 1. Try gTTS (Google, needs internet)
    try:
        from gtts import gTTS  # type: ignore
        print("\n[2/4] Generating voiceover with gTTS …")
        tts = gTTS(text=FULL_SCRIPT, lang="en", tld="co.uk", slow=False)
        tts.save(str(VOICEOVER_PATH))
        print(f"  ✓ Voiceover saved to {VOICEOVER_PATH}")
        return True
    except Exception as e:
        print(f"  gTTS failed: {e}")

    # 2. Local TTS (espeak-ng / pyttsx3)
    print("\n[2/4] Generating voiceover with local TTS …")
    raw_wav = OUTPUT_DIR / "voiceover_raw.wav"
    timed_wav = OUTPUT_DIR / "voiceover_timed.wav"

    if not _script_to_wav(raw_wav):
        print(
            "\n  WARNING: No TTS engine worked. Video will render without voiceover.\n"
            "  Open voiceover_script.txt and paste into ElevenLabs for a quality voiceover."
        )
        return False

    raw_dur = float(
        subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(raw_wav)],
        ).decode().strip()
    )
    print(f"  Raw TTS duration: {raw_dur:.1f}s  → target: {VIDEO_DURATION}s")

    if require("ffmpeg") and abs(raw_dur - VIDEO_DURATION) > 1.0:
        tempo = raw_dur / VIDEO_DURATION
        tempo = max(0.5, min(2.0, tempo))  # ffmpeg atempo clamps 0.5–2.0
        subprocess.run(
            [
                "ffmpeg", "-y", "-i", str(raw_wav),
                "-filter:a", f"atempo={tempo:.4f}",
                "-t", str(VIDEO_DURATION),
                str(timed_wav),
            ],
            check=True, capture_output=True,
        )
        source_wav = timed_wav
        print(f"  Speed-adjusted at atempo={tempo:.3f}")
    else:
        source_wav = raw_wav

    if require("ffmpeg"):
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(source_wav),
             "-ar", "44100", "-ab", "192k", str(VOICEOVER_PATH)],
            check=True, capture_output=True,
        )
        print(f"  ✓ Voiceover saved to {VOICEOVER_PATH}")
    else:
        source_wav.rename(VOICEOVER_PATH.with_suffix(".wav"))
        print(f"  ✓ Voiceover saved as WAV (ffmpeg unavailable for mp3 conversion)")
    return True


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

    # Locate Chrome / headless shell — check env var, then well-known paths
    chrome_candidates = [
        os.environ.get("REMOTION_CHROME_EXECUTABLE", ""),
        "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
        "/opt/pw-browsers/chromium",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
    ]
    chrome_exe = next((p for p in chrome_candidates if p and Path(p).exists()), None)

    cmd = [
        npx, "remotion", "render",
        "src/index.ts",
        "NesraWellness",
        str(RAW_VIDEO_PATH),
        "--codec=h264",
    ]
    if chrome_exe:
        cmd += [f"--browser-executable={chrome_exe}"]
        print(f"  Using Chrome: {chrome_exe}")
    else:
        print("  WARNING: No Chrome binary found — Remotion will try to download one.")

    try:
        run(cmd, cwd=SCRIPT_DIR)
        print(f"  ✓ Raw video saved to {RAW_VIDEO_PATH}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ERROR: Remotion render failed (exit code {e.returncode})")
        return False


# ── Step 4 — Mix audio into video ─────────────────────────────────────────────

def mix_audio(has_voiceover: bool) -> None:
    print("\n[4/4] Mixing audio …")

    ffmpeg_bin = shutil.which("ffmpeg") or "/usr/bin/ffmpeg"
    has_ffmpeg = Path(ffmpeg_bin).exists()

    if not has_ffmpeg:
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

    # Accept .mp3 or .wav voiceover
    vo_path = VOICEOVER_PATH if VOICEOVER_PATH.exists() else VOICEOVER_PATH.with_suffix(".wav")
    if not has_voiceover or not vo_path.exists():
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
            ffmpeg_bin, "-y",
            "-i", str(RAW_VIDEO_PATH),
            "-i", str(vo_path),
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
            ffmpeg_bin, "-y",
            "-i", str(RAW_VIDEO_PATH),
            "-i", str(vo_path),
            "-map", "0:v:0",   # video from rendered file
            "-map", "1:a:0",   # audio from voiceover (not Remotion's silent track)
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
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
