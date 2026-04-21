import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

const DARK = '#001a47';
const MID = '#003087';
const ACCENT = '#41B6E6';
const WHITE = '#FFFFFF';
const GLASS = 'rgba(255,255,255,0.07)';
const GLASS_BORDER = 'rgba(65,182,230,0.3)';

function useSp(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ fps, frame: frame - delay, config: { damping: 18, stiffness: 80 }, from: 0, to: 1 });
}

function clamp(frame: number, a: number, b: number, va = 0, vb = 1) {
  return interpolate(frame, [a, b], [va, vb], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
}

// ─── Background gradient shared across scenes ────────────────────────────────
const Bg: React.FC<{ flip?: boolean }> = ({ flip }) => (
  <AbsoluteFill
    style={{
      background: flip
        ? `linear-gradient(135deg, ${MID} 0%, ${DARK} 100%)`
        : `linear-gradient(135deg, ${DARK} 0%, ${MID} 100%)`,
    }}
  />
);

// ─── Decorative circle rings ─────────────────────────────────────────────────
const Rings: React.FC = () => {
  const frame = useCurrentFrame();
  const slow = frame / 180;
  const pulse = 1 + 0.04 * Math.sin(slow * Math.PI * 2);
  return (
    <>
      {[600, 800, 1040].map((size, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `1px solid rgba(65,182,230,${0.12 - i * 0.03})`,
            transform: `translate(-50%, -50%) scale(${i % 2 === 0 ? pulse : 1 / pulse})`,
          }}
        />
      ))}
    </>
  );
};

// ─── Scene 1 — Brand reveal (local 0–210) ────────────────────────────────────
const SceneIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const titleSp = useSp(8);
  const titleX = interpolate(titleSp, [0, 1], [-140, 0]);
  const titleOpacity = interpolate(titleSp, [0, 0.25], [0, 1]);

  const lineW = clamp(frame, 28, 90, 0, 560);

  const subtitleOpacity = clamp(frame, 70, 105);
  const subtitleY = clamp(frame, 70, 115, 28, 0);

  const tagOpacity = clamp(frame, 115, 148);
  const tagY = clamp(frame, 115, 155, 20, 0);

  const sceneOpacity = clamp(frame, 172, 210, 1, 0);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <Bg />
      <Rings />
      {/* Top-right glow */}
      <div style={{
        position: 'absolute', top: -220, right: -220,
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(65,182,230,0.18) 0%, transparent 70%)`,
      }} />

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Brand name */}
        <div style={{
          transform: `translateX(${titleX}px)`,
          opacity: titleOpacity,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
          fontSize: 172,
          fontWeight: 900,
          color: WHITE,
          letterSpacing: '0.12em',
          lineHeight: 1,
        }}>
          NESRA
        </div>

        {/* Accent line */}
        <div style={{
          width: lineW,
          height: 4,
          marginTop: 10,
          marginBottom: 28,
          background: `linear-gradient(90deg, ${ACCENT}, transparent)`,
        }} />

        {/* Full name */}
        <div style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 26,
          fontWeight: 300,
          color: ACCENT,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          North East Society of Regional Anaesthesia
        </div>

        {/* Descriptor */}
        <div style={{
          opacity: tagOpacity,
          transform: `translateY(${tagY}px)`,
          marginTop: 20,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 20,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: '0.04em',
          textAlign: 'center',
        }}>
          Advancing regional anaesthesia practice across Northern England
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 2 — Three pillars (local 0–240) ───────────────────────────────────
const Card: React.FC<{ icon: string; title: string; body: string; delay: number }> = ({
  icon, title, body, delay,
}) => {
  const sp = useSp(delay);
  const y = interpolate(sp, [0, 1], [64, 0]);
  const opacity = interpolate(sp, [0, 0.35], [0, 1]);

  return (
    <div style={{
      transform: `translateY(${y}px)`,
      opacity,
      background: GLASS,
      border: `1px solid ${GLASS_BORDER}`,
      borderRadius: 20,
      padding: '40px 30px',
      width: 300,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 18,
    }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>{icon}</div>
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 20,
        fontWeight: 700,
        color: WHITE,
        textAlign: 'center',
        lineHeight: 1.35,
      }}>{title}</div>
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 15,
        fontWeight: 300,
        color: 'rgba(255,255,255,0.68)',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>{body}</div>
    </div>
  );
};

const ScenePillars: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneOpacity = clamp(frame, 195, 240, 1, 0);
  const headerSp = useSp(0);
  const headerY = interpolate(headerSp, [0, 1], [-32, 0]);
  const headerOpacity = interpolate(headerSp, [0, 0.4], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <Bg />
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 52,
      }}>
        <div style={{
          transform: `translateY(${headerY}px)`,
          opacity: headerOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 42,
          fontWeight: 700,
          color: WHITE,
          letterSpacing: '0.04em',
        }}>
          What We <span style={{ color: ACCENT }}>Offer</span>
        </div>

        <div style={{ display: 'flex', gap: 36 }}>
          <Card
            icon="🩺"
            title="Professional Meetings"
            body="Regular knowledge-sharing sessions for consultants and trainees across the North East"
            delay={18}
          />
          <Card
            icon="🔬"
            title="Hands-on Workshops"
            body="Annual cadaveric & ultrasound workshops at James Cook University Hospital"
            delay={52}
          />
          <Card
            icon="🎓"
            title="Training & Education"
            body="Supporting the latest regional anaesthesia techniques for the next generation"
            delay={86}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 3 — Partners (local 0–180) ────────────────────────────────────────
const PartnerBadge: React.FC<{ icon: string; name: string; delay: number }> = ({ icon, name, delay }) => {
  const sp = useSp(delay);
  const scale = interpolate(sp, [0, 1], [0.82, 1]);
  const opacity = interpolate(sp, [0, 0.4], [0, 1]);
  return (
    <div style={{
      transform: `scale(${scale})`,
      opacity,
      background: GLASS,
      border: `1px solid ${GLASS_BORDER}`,
      borderRadius: 24,
      padding: '44px 56px',
      textAlign: 'center',
      minWidth: 260,
    }}>
      <div style={{ fontSize: 52, marginBottom: 18 }}>{icon}</div>
      <div style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 22,
        fontWeight: 700,
        color: WHITE,
        lineHeight: 1.4,
      }}
        dangerouslySetInnerHTML={{ __html: name }}
      />
    </div>
  );
};

const ScenePartners: React.FC = () => {
  const frame = useCurrentFrame();
  const sceneOpacity = clamp(frame, 148, 180, 1, 0);
  const headerSp = useSp(0);
  const headerScale = interpolate(headerSp, [0, 1], [0.88, 1]);
  const headerOpacity = interpolate(headerSp, [0, 0.4], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      <Bg flip />
      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 60,
      }}>
        <div style={{
          transform: `scale(${headerScale})`,
          opacity: headerOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 34,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          In Partnership With
        </div>

        <div style={{ display: 'flex', gap: 72, alignItems: 'center' }}>
          <PartnerBadge icon="🏥" name="James Cook<br/>University Hospital" delay={28} />
          <div style={{
            width: 2, height: 90,
            background: `linear-gradient(to bottom, transparent, ${ACCENT}, transparent)`,
          }} />
          <PartnerBadge icon="🎓" name="Durham<br/>University" delay={60} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Scene 4 — CTA (local 0–210) ─────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sceneIn = clamp(frame, 0, 22);

  const taglineSp = useSp(12);
  const taglineY = interpolate(taglineSp, [0, 1], [44, 0]);
  const taglineOpacity = interpolate(taglineSp, [0, 0.4], [0, 1]);

  const urlSp = useSp(64);
  const urlScale = interpolate(urlSp, [0, 1], [0.82, 1]);
  const urlOpacity = interpolate(urlSp, [0, 0.4], [0, 1]);

  const btnSp = useSp(96);
  const btnScale = interpolate(btnSp, [0, 1], [0.82, 1]);
  const btnOpacity = interpolate(btnSp, [0, 0.4], [0, 1]);

  const pulse = 1 + 0.035 * Math.sin((frame / 28) * Math.PI);

  // Animate the NESRA text underline
  const underlineSp = spring({ fps, frame: frame - 110, config: { damping: 20, stiffness: 100 }, from: 0, to: 1 });
  const underlineW = interpolate(underlineSp, [0, 1], [0, 100]);

  return (
    <AbsoluteFill style={{ opacity: sceneIn }}>
      <Bg />

      {/* Pulsing rings */}
      {[560, 760, 980].map((size, i) => (
        <div key={i} style={{
          position: 'absolute', top: '50%', left: '50%',
          width: size, height: size, borderRadius: '50%',
          border: `1px solid rgba(65,182,230,${0.1 - i * 0.025})`,
          transform: `translate(-50%, -50%) scale(${i % 2 === 0 ? pulse : 1 / pulse})`,
        }} />
      ))}

      <AbsoluteFill style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 36,
      }}>
        {/* Tagline */}
        <div style={{
          transform: `translateY(${taglineY}px)`,
          opacity: taglineOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 76,
          fontWeight: 900,
          color: WHITE,
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: '0.02em',
        }}>
          Connect.{' '}
          <span style={{ color: ACCENT }}>Train.</span>
          {' '}Advance.
        </div>

        {/* URL */}
        <div style={{
          transform: `scale(${urlScale})`,
          opacity: urlOpacity,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 34,
          fontWeight: 300,
          color: ACCENT,
          letterSpacing: '0.12em',
          position: 'relative',
        }}>
          nesra.co.uk
          <div style={{
            position: 'absolute',
            bottom: -6,
            left: `${(100 - underlineW) / 2}%`,
            width: `${underlineW}%`,
            height: 2,
            background: ACCENT,
            opacity: 0.6,
          }} />
        </div>

        {/* CTA button */}
        <div style={{
          transform: `scale(${btnScale})`,
          opacity: btnOpacity,
          marginTop: 8,
          background: ACCENT,
          borderRadius: 50,
          padding: '20px 52px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 22,
          fontWeight: 700,
          color: DARK,
          letterSpacing: '0.06em',
        }}>
          Join NESRA Today
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─── Root composition ─────────────────────────────────────────────────────────
export const MyComposition: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: DARK }}>
    {/* Scene 1: Intro — frames 0–210 */}
    <Sequence from={0} durationInFrames={210}>
      <SceneIntro />
    </Sequence>

    {/* Scene 2: Pillars — frames 185–425 */}
    <Sequence from={185} durationInFrames={240}>
      <ScenePillars />
    </Sequence>

    {/* Scene 3: Partners — frames 400–580 */}
    <Sequence from={400} durationInFrames={180}>
      <ScenePartners />
    </Sequence>

    {/* Scene 4: CTA — frames 555–765 */}
    <Sequence from={555} durationInFrames={210}>
      <SceneCTA />
    </Sequence>
  </AbsoluteFill>
);
