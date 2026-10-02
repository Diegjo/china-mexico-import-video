"""Synthesized score + SFX for the film. numpy only, fully deterministic (seeded).

    python3 audio/score.py [out/cues.json] [out/score.wav]

Music: 120 BPM house groove in A minor (Am7 – Fmaj7 – Cmaj7 – G6, one chord per bar).
Arrangement follows the scene map (bar = 2 s). SFX come from the cue list the scenes declare
(window.CUES → out/cues.json, written by tools/render.mjs or tools/cues.mjs), so picture and
sound share one timeline.
"""
import json
import sys
import wave

import numpy as np

SR = 48_000
BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4
DUR = 60.0
N = int(DUR * SR)

rng = np.random.default_rng(2026)


# ---------------------------------------------------------------- dsp helpers
def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def lowpass_kernel(fc, taps=255):
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(2 * fc / SR * n) * np.blackman(taps)
    return h / h.sum()


def fir(x, kernel):
    return np.convolve(x, kernel, mode="same")


def lowpass(x, fc, taps=255):
    return fir(x, lowpass_kernel(fc, taps))


def highpass(x, fc, taps=255):
    return x - lowpass(x, fc, taps)


def bandpass(x, f1, f2, taps=255):
    return lowpass(x, f2, taps) - lowpass(x, f1, taps)


def fft_convolve(x, h):
    n = 1 << int(np.ceil(np.log2(len(x) + len(h))))
    y = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(h, n), n)
    return y[: len(x)]


def noise(sec):
    return rng.uniform(-1, 1, int(sec * SR))


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


class Bus:
    def __init__(self):
        self.l = np.zeros(N + SR * 3)
        self.r = np.zeros(N + SR * 3)

    def add(self, t, sig, gain=1.0, pan=0.0):
        i = int(round(t * SR))
        if i < 0 or i >= N:
            return
        sig = np.asarray(sig) * gain
        j = min(len(self.l), i + len(sig))
        gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.l[i:j] += sig[: j - i] * gl
        self.r[i:j] += sig[: j - i] * gr

    def stereo(self):
        return np.stack([self.l[:N], self.r[:N]])


# ---------------------------------------------------------------- instruments
def kick():
    t = t_axis(0.45)
    phase = 2 * np.pi * (44 * t + 120 * (1 - np.exp(-t * 32)) / 32)
    body = np.sin(phase) * np.exp(-t * 7.5)
    click = highpass(noise(0.45), 3000, 63) * np.exp(-t * 400) * 0.35
    return np.tanh(1.6 * (body + click)) * 0.95


def clap():
    t = t_axis(0.35)
    env = np.zeros_like(t)
    for k, d in enumerate([0.0, 0.011, 0.023]):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) * (220 if k < 2 else 26))
    return bandpass(noise(0.35), 900, 3200, 127) * env * 0.9


def hat(open_=False):
    sec = 0.32 if open_ else 0.07
    t = t_axis(sec)
    return highpass(noise(sec), 7200, 63) * np.exp(-t * (11 if open_ else 70)) * (0.5 if open_ else 0.6)


def shaker():
    t = t_axis(0.09)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 45)
    return bandpass(noise(0.09), 4200, 9000, 63) * env * 0.5


def bass_note(f, sec):
    t = t_axis(sec + 0.05)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 2.2) * np.clip((sec + 0.05 - t) / 0.05, 0, 1)
    sig = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    return np.tanh(1.4 * sig * env) * 0.8


def ep_note(f, sec, bright=1.0):
    """Soft electric piano: a few decaying partials + slow tremolo, detuned for width."""
    t = t_axis(sec)
    env = np.minimum(1, t / 0.004) * np.exp(-t * 1.6)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 5.2 * t)
    out = []
    for det in (-0.7, 0.7):
        ff = f * 2 ** (det / 1200)
        s = (np.sin(2 * np.pi * ff * t)
             + 0.35 * bright * np.sin(2 * np.pi * 2 * ff * t) * np.exp(-t * 4)
             + 0.12 * bright * np.sin(2 * np.pi * 3 * ff * t) * np.exp(-t * 9))
        out.append(s * env * trem)
    return out


def pluck(f, sec=0.5):
    t = t_axis(sec)
    mod = 1.8 * np.exp(-t * 14) * np.sin(2 * np.pi * 2 * f * t)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 7) * np.minimum(1, t / 0.002) * 0.6


def impact():
    t = t_axis(1.6)
    boom = np.sin(2 * np.pi * (52 * t - 14 * t * t)) * np.exp(-t * 2.8)
    hit = lowpass(noise(1.6), 2500, 127) * np.exp(-t * 9) * 0.5
    return np.tanh(1.3 * (boom + hit)) * 0.9


def riser(sec):
    t = t_axis(sec)
    p = t / sec
    lo = lowpass(noise(sec), 900, 127)
    hi = bandpass(noise(sec), 2500, 9000, 127)
    tone = np.sin(2 * np.pi * (220 * t + 330 * t * p)) * 0.12
    return (lo * (1 - p) + hi * p + tone) * p ** 2.2 * 0.55


# ---------------------------------------------------------------- sfx (from cues)
def sfx_whoosh():
    sec = 0.42
    t = t_axis(sec)
    p = t / sec
    env = np.sin(np.pi * np.clip(p * 1.15, 0, 1)) ** 1.5
    lo = bandpass(noise(sec), 250, 1400, 127)
    hi = bandpass(noise(sec), 1400, 6500, 127)
    mix = lo * (1 - np.sin(np.pi * p)) + hi * np.sin(np.pi * p)
    return mix * env * 0.8


def sfx_pop():
    t = t_axis(0.09)
    f = 520 + 900 * np.minimum(1, t / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.55


def sfx_tick():
    t = t_axis(0.03)
    return (np.sin(2 * np.pi * 2100 * t) * 0.6 + highpass(noise(0.03), 4000, 31) * 0.3) * np.exp(-t * 180) * 0.8


def sfx_click():
    a = sfx_tick()
    out = np.zeros(int(0.05 * SR))
    out[: len(a)] += a
    j = int(0.016 * SR)
    t = t_axis(0.03)
    b = np.sin(2 * np.pi * 1500 * t) * np.exp(-t * 200) * 0.4
    out[j:j + len(b)] += b
    return out


def sfx_thump():
    t = t_axis(0.5)
    body = np.sin(2 * np.pi * (95 * t - 40 * t * t)) * np.exp(-t * 9)
    click = highpass(noise(0.5), 2500, 63) * np.exp(-t * 300) * 0.3
    return np.tanh(1.5 * (body + click)) * 0.85


def sfx_roll():
    sec = 0.5
    out = np.zeros(int(sec * SR))
    k, tt = 0, 0.0
    while tt < sec - 0.03:
        t = t_axis(0.02)
        f = 1700 + 500 * ((k * 7919) % 13) / 13
        s = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) * (1 - 0.6 * tt / sec) * 0.6
        i = int(tt * SR)
        out[i:i + len(s)] += s
        tt += 0.022 + 0.05 * (tt / sec) ** 2
        k += 1
    return out


def sfx_swish():
    sec = 0.22
    t = t_axis(sec)
    return bandpass(noise(sec), 3000, 10000, 63) * np.sin(np.pi * t / sec) ** 2 * 0.5


SFX = {
    "whoosh": sfx_whoosh, "pop": sfx_pop, "tick": sfx_tick, "click": sfx_click,
    "thump": sfx_thump, "roll": sfx_roll, "swish": sfx_swish,
}

# ---------------------------------------------------------------- arrangement
# One chord per bar: Am7, Fmaj7, Cmaj7, G6 (MIDI). Bass roots an octave+ below.
CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 60, 64], [55, 59, 62, 64]]
ROOTS = [33, 29, 36, 31]
MOTIF = [(0.0, 76), (0.75, 79), (1.0, 81), (1.75, 79), (2.5, 76), (3.0, 74), (3.5, 76)]  # beats, MIDI


def section(bar):
    """bar is 0-based; returns the active layer set for that bar."""
    s = set()
    if bar < 2:                       # hook
        s |= {"kick", "bass", "chords"}
    elif bar < 6:                     # proveedor
        s |= {"kick", "bass", "chords", "hats", "clap"}
    elif bar < 11:                    # incoterms
        s |= {"kick", "bass", "chords", "hats", "clap", "pluck", "openhat"}
    elif bar < 17:                    # flete
        s |= {"kick", "bass", "chords", "hats", "clap", "pluck", "shaker", "openhat"}
    elif bar < 23:                    # aduana
        s |= {"kick", "bass", "chords", "hats", "clap", "openhat"}
    elif bar < 27:                    # costo total
        s |= {"kick", "bass", "chords", "hats", "clap", "pluck", "shaker", "openhat"}
    elif bar < 29:                    # cierre
        s |= {"kick", "bass", "chords", "hats", "clap"}
    return s


def build_music():
    drums, music, send = Bus(), Bus(), Bus()
    K, CL = kick(), clap()
    hc, ho, sh = hat(False), hat(True), shaker()
    duck = np.ones(N + SR * 3)

    for bar in range(30):
        t0 = bar * BAR
        layers = section(bar)
        ci = bar % 4
        for b in range(4):
            tb = t0 + b * BEAT
            if "kick" in layers:
                drums.add(tb, K, 0.9)
                i = int(tb * SR)
                L = int(0.32 * SR)
                duck[i:i + L] = np.minimum(duck[i:i + L], 1 - 0.45 * np.exp(-np.arange(L) / SR * 9))
            if "clap" in layers and b in (1, 3):
                drums.add(tb, CL, 0.55, 0.05)
                send.add(tb, CL, 0.25)
            if "hats" in layers:
                vel = 0.45 + 0.25 * ((bar * 4 + b) % 3 == 0)
                drums.add(tb + BEAT / 2, hc, vel, 0.25)
                drums.add(tb, hc, 0.22, -0.2)
            if "openhat" in layers and b == 3:
                drums.add(tb + BEAT / 2, ho, 0.32, 0.3)
            if "shaker" in layers:
                for q in range(4):
                    drums.add(tb + q * BEAT / 4, sh, 0.18 + 0.12 * (q % 2), -0.35)
            if "bass" in layers:
                f = midi(ROOTS[ci] + (12 if b == 3 else 0))
                music.add(tb + BEAT / 2, bass_note(f, 0.2), 0.36)
                if b == 0:
                    music.add(tb, bass_note(midi(ROOTS[ci]), 0.16), 0.26)
        if "chords" in layers:
            for hit_t, length, g in ((0.0, 1.4, 0.055), (BEAT * 1.5, 0.9, 0.035)):
                for k, m in enumerate(CHORDS[ci]):
                    lft, rgt = ep_note(midi(m), length, bright=0.8 if bar >= 17 and bar < 23 else 1.0)
                    pan = -0.3 + 0.2 * k
                    music.add(t0 + hit_t, lft, g, pan - 0.15)
                    music.add(t0 + hit_t, rgt, g, pan + 0.15)
                    send.add(t0 + hit_t, lft, g * 0.5)
        if "pluck" in layers and bar % 2 == 0:
            for beat, m in MOTIF:
                p = pluck(midi(m + (0 if ci < 2 else -2)))
                music.add(t0 + beat * BEAT, p, 0.14, 0.35 if int(beat * 2) % 2 else -0.35)
                send.add(t0 + beat * BEAT, p, 0.22)

    # Transitions and payoffs: risers into the accent card, customs and the payoff number.
    for at in (12.0, 34.0, 50.0):
        r = riser(2.0)
        music.add(at - 2.0, r, 0.5)
        send.add(at - 2.0, r, 0.25)
    for at in (0.0, 12.0, 34.0, 50.0, 57.0):
        im = impact()
        drums.add(at, im, 0.8)
        send.add(at, im, 0.4)

    # Final chord at 58 s rings out (no kick after it).
    for k, m in enumerate([45, 57, 60, 64, 67, 71]):
        lft, rgt = ep_note(midi(m), 2.0)
        music.add(58.0, lft, 0.07, -0.4 + 0.16 * k)
        music.add(58.0, rgt, 0.07, -0.3 + 0.16 * k)
        send.add(58.0, lft, 0.15)

    music.l[: len(duck)] *= duck
    music.r[: len(duck)] *= duck
    return drums.stereo(), music.stereo(), send.stereo()


def reverb(x, sec=1.8):
    t = t_axis(sec)
    out = []
    for ch in range(2):
        ir = noise(sec) * np.exp(-t * 3.2)
        ir = lowpass(ir, 6000, 63)
        ir[: int(0.012 * SR)] = 0
        out.append(fft_convolve(x[ch], ir) * 0.06)
    return np.stack(out)


def build_sfx(cues):
    bus = Bus()
    for c in cues:
        kind = c["type"]
        if kind not in SFX:
            raise SystemExit(f"unknown SFX type {kind!r} at {c['t']} s")
        sig = SFX[kind]()
        bus.add(c["t"], sig, 0.8 * c.get("gain", 1.0), pan=0.0)
    return bus.stereo()


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x.T * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    cues_path = sys.argv[1] if len(sys.argv) > 1 else "out/cues.json"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "out/score.wav"
    with open(cues_path, encoding="utf-8") as f:
        cues = json.load(f)["cues"]

    drums, music, send = build_music()
    sfx = build_sfx(cues)
    mix = drums * 0.8 + music * 0.9 + reverb(send) + sfx * 0.7

    fade = np.ones(N)
    fade[-int(0.25 * SR):] = np.linspace(1, 0, int(0.25 * SR))
    mix *= fade
    mix /= max(1e-9, np.abs(mix).max()) / 0.95
    mix = np.tanh(1.05 * mix) / np.tanh(1.05)  # gentle peak rounding only
    write_wav(out_path, mix)
    print(f"{len(cues)} SFX cues + score → {out_path} ({DUR:.0f} s, {SR} Hz stereo)")


if __name__ == "__main__":
    main()
