import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from 'remotion';

// ── Brand colours ──────────────────────────────────────────────────────────────
const BG = '#0c0c0f';
const TEXT = '#f0eef8';
const MUTED = '#8886a0';
const TEAL = '#2adf9e';
const FADE = 9; // 0.3 s × 30 fps

// ── Opacity helper: fade in at [start] and out at [end] ───────────────────────
function op(frame: number, start: number, end: number): number {
  return interpolate(
    frame,
    [start, start + FADE, end - FADE, end],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
}

// ── Animated film grain ────────────────────────────────────────────────────────
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        zIndex: 90,
        opacity: 0.04,
        mixBlendMode: 'overlay' as const,
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={`g${seed}`}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves="4"
              seed={seed}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ── Vignette ───────────────────────────────────────────────────────────────────
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      zIndex: 91,
      background:
        'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.72) 100%)',
    }}
  />
);

// ── Card 1 — Hook ──────────────────────────────────────────────────────────────
const CardHook: React.FC<{ o: number }> = ({ o }) => (
  <AbsoluteFill
    style={{
      opacity: o,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 24,
    }}
  >
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
        fontSize: 84,
        fontWeight: 900,
        color: TEXT,
        textAlign: 'center',
        lineHeight: 1.1,
        letterSpacing: '-0.01em',
      }}
    >
      5 signs you&apos;re mentally exhausted
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 40,
        fontWeight: 400,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 1.4,
      }}
    >
      that nobody talks about
    </div>
  </AbsoluteFill>
);

// ── Point card (01–05) ─────────────────────────────────────────────────────────
interface PointProps {
  o: number;
  num: string;
  main: string;
  sub: string;
}
const CardPoint: React.FC<PointProps> = ({ o, num, main, sub }) => (
  <AbsoluteFill
    style={{
      opacity: o,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 32,
    }}
  >
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 148,
        fontWeight: 900,
        color: TEAL,
        lineHeight: 1,
        letterSpacing: '-0.04em',
        opacity: 0.9,
      }}
    >
      {num}
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
        fontSize: 58,
        fontWeight: 800,
        color: TEXT,
        textAlign: 'center',
        lineHeight: 1.2,
        letterSpacing: '-0.01em',
      }}
    >
      {main}
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 32,
        fontWeight: 400,
        color: MUTED,
        textAlign: 'center',
        lineHeight: 1.5,
      }}
    >
      {sub}
    </div>
  </AbsoluteFill>
);

// ── Card 7 — Outro message ─────────────────────────────────────────────────────
const CardOutro: React.FC<{ o: number }> = ({ o }) => (
  <AbsoluteFill
    style={{
      opacity: o,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 80px',
      gap: 20,
    }}
  >
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
        fontSize: 68,
        fontWeight: 800,
        color: TEXT,
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      Your mind needs attention
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 40,
        fontWeight: 400,
        color: MUTED,
        textAlign: 'center',
      }}
    >
      not just rest
    </div>
  </AbsoluteFill>
);

// ── Card 8 — CTA ───────────────────────────────────────────────────────────────
const CardCTA: React.FC<{ o: number }> = ({ o }) => (
  <AbsoluteFill
    style={{
      opacity: o,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}
  >
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, "Helvetica Neue", sans-serif',
        fontSize: 130,
        fontWeight: 900,
        color: TEAL,
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      Nesra
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 40,
        fontWeight: 700,
        color: TEXT,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
      }}
    >
      Free download
    </div>
    <div
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 32,
        fontWeight: 400,
        color: MUTED,
      }}
    >
      Link in bio
    </div>
  </AbsoluteFill>
);

// ── Caption system ─────────────────────────────────────────────────────────────
interface Word {
  w: string;
  s: number; // start frame
  e: number; // end frame
}

function buildWords(): Word[] {
  const sections: { text: string; s: number; e: number }[] = [
    {
      text: "5 signs you're mentally exhausted that nobody talks about",
      s: 0,
      e: 90,
    },
    {
      text: "Number one You're tired no matter how much you sleep Eight hours nine hours still exhausted That's not laziness That's your mind running on empty",
      s: 90,
      e: 300,
    },
    {
      text: "Number two Small decisions feel impossible What to eat What to wear What to reply When your brain is burnt out even tiny choices feel overwhelming",
      s: 300,
      e: 540,
    },
    {
      text: "Number three You've stopped enjoying things you used to love Not sad exactly Just numb That's emotional exhaustion not depression There's a difference",
      s: 540,
      e: 780,
    },
    {
      text: "Number four You're irritable for no reason Snapping at people who don't deserve it Feeling on edge constantly Your nervous system is overloaded",
      s: 780,
      e: 1020,
    },
    {
      text: "Number five You keep saying you're fine But you're not fine You're just tired of explaining it",
      s: 1020,
      e: 1260,
    },
    {
      text: "If any of these hit your mind needs attention not just rest Start small Check in with yourself daily Even five minutes of journaling changes things more than you'd think Nesra is a free app that helps you do exactly that Link in bio",
      s: 1260,
      e: 1560,
    },
  ];

  const result: Word[] = [];
  for (const sec of sections) {
    const words = sec.text.split(' ');
    const len = sec.e - sec.s;
    const perWord = len / words.length;
    words.forEach((word, i) => {
      result.push({
        w: word,
        s: sec.s + Math.round(i * perWord),
        e: sec.s + Math.round((i + 1) * perWord),
      });
    });
  }
  return result;
}

const ALL_WORDS = buildWords();
const GROUP = 4;

const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = ALL_WORDS.findIndex((w) => frame >= w.s && frame < w.e);
  if (cur === -1) return null;

  const groupStart = Math.floor(cur / GROUP) * GROUP;
  const group = ALL_WORDS.slice(groupStart, groupStart + GROUP);

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 80px 180px',
        pointerEvents: 'none',
        zIndex: 95,
        flexWrap: 'wrap' as const,
        gap: 14,
      }}
    >
      {group.map((word, i) => {
        const idx = groupStart + i;
        const isActive = idx === cur;
        const isPast = idx < cur;
        return (
          <span
            key={`${groupStart}-${i}`}
            style={{
              fontFamily:
                'system-ui, -apple-system, "Helvetica Neue", sans-serif',
              fontSize: 42,
              fontWeight: 800,
              color: isActive
                ? TEAL
                : isPast
                ? 'rgba(240,238,248,0.75)'
                : 'rgba(240,238,248,0.4)',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}
          >
            {word.w}
          </span>
        );
      })}
    </AbsoluteFill>
  );
};

// ── Root composition ───────────────────────────────────────────────────────────
//
// Timing (30 fps):
//   Hook      0 – 90     (0 – 3 s)
//   Point 1  90 – 300    (3 – 10 s)
//   Point 2  300 – 540   (10 – 18 s)
//   Point 3  540 – 780   (18 – 26 s)
//   Point 4  780 – 1020  (26 – 34 s)
//   Point 5  1020 – 1260 (34 – 42 s)
//   Outro    1260 – 1410 (42 – 47 s)
//   CTA      1410 – 1560 (47 – 52 s)

export const NesraWellness: React.FC = () => {
  const f = useCurrentFrame();

  const o = [
    op(f, 0, 90),
    op(f, 90, 300),
    op(f, 300, 540),
    op(f, 540, 780),
    op(f, 780, 1020),
    op(f, 1020, 1260),
    op(f, 1260, 1410),
    op(f, 1410, 1560),
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <CardHook o={o[0]} />
      <CardPoint
        o={o[1]}
        num="01"
        main="Tired no matter how much you sleep"
        sub="That's your mind running on empty"
      />
      <CardPoint
        o={o[2]}
        num="02"
        main="Small decisions feel impossible"
        sub="Even tiny choices feel overwhelming"
      />
      <CardPoint
        o={o[3]}
        num="03"
        main="Stopped enjoying things you loved"
        sub="Not sad. Just numb."
      />
      <CardPoint
        o={o[4]}
        num="04"
        main="Irritable for no reason"
        sub="Your nervous system is overloaded"
      />
      <CardPoint
        o={o[5]}
        num="05"
        main="You keep saying you're fine"
        sub="But you're not fine."
      />
      <CardOutro o={o[6]} />
      <CardCTA o={o[7]} />

      <Grain />
      <Vignette />
      <Captions />
    </AbsoluteFill>
  );
};
