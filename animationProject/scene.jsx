// scene.jsx -- NerdMinerORG project evolution: image-based crossfade morph

// ── Projects config ───────────────────────────────────────────────────────
// Each slot has { src, name, subtitle }. Fill in as more SVGs arrive.
// If src is null, we render an outlined placeholder box.
// Hashrate stored in KH/s for precision. Formatter handles unit display.
// Hashrate values stored in H/s (raw) for precision.
// Display formatter auto-selects KH/s, MH/s, GH/s, TH/s.
const PROJECTS = [
  {
    src: 'assets/nerdminer.svg',
    name: 'NerdMiner V2',
    subtitle: 'Open-source Bitcoin solo-miner',
    hashrateFrom: 0,
    hashrateTo: 250e3,          // 250 KH/s
    scale: 0.70,
  },
  {
    src: 'assets/nerdaxe.svg',
    name: 'NerdAxe',
    subtitle: 'First-gen ASIC miner',
    hashrateFrom: 250e3,
    hashrateTo: 1.2e12,         // 1.2 TH/s
  },
  {
    src: 'assets/nerdqaxe.svg',
    name: 'NerdQaxe',
    subtitle: 'Quad-ASIC evolution',
    hashrateFrom: 1.2e12,
    hashrateTo: 4.8e12,         // 4.8 TH/s
  },
  {
    src: 'assets/octaxe.svg',
    name: 'OctAxe',
    subtitle: 'Eight-ASIC powerhouse',
    hashrateFrom: 4.8e12,
    hashrateTo: 12e12,          // 12 TH/s
  },
  { src: null, name: 'Build your own', subtitle: 'Nerd* Project', isCTA: true,
    hashrateFrom: 12e12, hashrateTo: 12e12 },
];

// ── Tweakable defaults ────────────────────────────────────────────────────
const TWEAKS = /*EDITMODE-BEGIN*/{
  "objectColor": "#8c8c8c",
  "textColor": "#e8e8e8",
  "accentColor": "#ff7a1a",
  "holdSeconds": 2.8,
  "morphSeconds": 1.6,
  "showLabels": true,
  "showGrid": true,
  "effect": "particles"
}/*EDITMODE-END*/;
// effect: "glitch" | "particles"

// ── Helpers ────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Build a CSS filter chain that re-colors a black silhouette SVG into `color`
// and adds a neon glow. Works by: invert to white → sepia to tint-able → hue-rotate.
function neonFilter(color, intensity = 1) {
  const { r, g, b } = hexToRgb(color);
  // No glow, just re-color to neon. Use hue-rotate chain after invert+sepia.
  // invert: black→white. Then we tint white to `color` by overlaying via `mix-blend` on parent.
  // Simpler: use an SVG feColorMatrix, but for a filter chain: invert+brightness keeps it clean with no glow.
  return 'invert(1) brightness(0.95) contrast(1.1)';
}

// ── Hashrate formatter ────────────────────────────────────────────────────
function formatHashrate(hs) {
  if (hs >= 1e12) return (hs / 1e12).toFixed(hs >= 10e12 ? 1 : 2) + ' TH/s';
  if (hs >= 1e9)  return (hs / 1e9).toFixed(2) + ' GH/s';
  if (hs >= 1e6)  return (hs / 1e6).toFixed(1) + ' MH/s';
  if (hs >= 1e3)  return (hs / 1e3).toFixed(0) + ' KH/s';
  return hs.toFixed(0) + ' H/s';
}
function lerpLog(a, b, t) {
  if (a <= 0) return b * t;
  if (b <= 0) return a;
  return Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);
}

// ── Hashrate counter ──────────────────────────────────────────────────────
// Counting happens DURING the morph (from current.hashrateTo → next.hashrateTo).
// During hold the value is static (= current project's hashrateTo).
// First hold (index=0) counts from 0 → hashrateTo on arrival.
function HashRateCounter({ state, textColor, accentColor }) {
  const { index, phase, blend } = state;
  const N = PROJECTS.length;
  const current = PROJECTS[index];
  const next = PROJECTS[(index + 1) % N];
  const maxVal = PROJECTS.filter(p => !p.isCTA).slice(-1)[0].hashrateTo;

  // Initial count-up for the very first project
  const [initProgress, setInitProgress] = React.useState(0);
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const start = performance.now();
    let raf;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / 1600);
      setInitProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // CTA explosion state
  const [ctaScale, setCtaScale] = React.useState(1);
  const [showInfinity, setShowInfinity] = React.useState(false);
  const ctaStarted = React.useRef(false);
  React.useEffect(() => {
    if (next.isCTA && phase === 'morph' && !ctaStarted.current) {
      ctaStarted.current = true;
      setShowInfinity(false);
      const start = performance.now();
      let raf;
      const tick = () => {
        const p = Math.min(1, (performance.now() - start) / 1600);
        setCtaScale(1 + Math.pow(p, 3) * 200); // fast number, no size change
        if (p >= 0.88) setShowInfinity(true);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    if (phase === 'hold') ctaStarted.current = false;
  }, [phase, index]);

  // Compute display value
  let displayValue = current.hashrateTo || 0;
  let displayScale = 1;
  let isInfinity = false;

  if (index === 0 && phase === 'hold') {
    // Initial count-up
    const to = current.hashrateTo || 0;
    displayValue = to <= 0 ? 0 : lerpLog(Math.max(1, to * 0.001), to, initProgress);
  } else if (phase === 'morph') {
    if (next.isCTA) {
      // CTA: exponential explosion
      displayValue = current.hashrateTo * ctaScale;
      isInfinity = showInfinity;
    } else {
      // Normal morph: count up from current.hashrateTo → next.hashrateTo
      const eased = blend < 0.5 ? 2*blend*blend : 1 - Math.pow(-2*blend+2, 2)/2;
      displayValue = lerpLog(
        Math.max(current.hashrateTo || 1, 1),
        Math.max(next.hashrateTo || 1, 1),
        eased
      );
    }
  } else if (current.isCTA) {
    isInfinity = true;
  }
  // else: hold for non-first project → static current.hashrateTo (displayValue already set)

  // Log-scale bar progress
  const barPct = (() => {
    if (isInfinity || current.isCTA) return 100;
    const v = Math.max(displayValue, 1);
    return Math.min(100, Math.max(0, Math.log(v) / Math.log(maxVal) * 100));
  })();

  return (
    <div style={{
      position: 'absolute', top: 800, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      zIndex: 6,
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 13, letterSpacing: '0.28em', textTransform: 'uppercase',
        color: `${textColor}66`,
      }}>Compute Power</div>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 56, fontWeight: 700, letterSpacing: '0.04em',
        color: accentColor,
        fontVariantNumeric: 'tabular-nums',
        minWidth: 340, textAlign: 'center',
        lineHeight: 1,
      }}>
        {isInfinity ? '∞' : formatHashrate(displayValue)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
        <div style={{ position: 'relative', width: 520, height: 3, background: `${textColor}18`, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${barPct}%`,
            background: `linear-gradient(to right, ${accentColor}66, ${accentColor})`,
            borderRadius: 2,
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Background chrome ──────────────────────────────────────────────────────
function GridBackground({ show, neonColor }) {
  if (!show) return null;
  const { r, g, b } = hexToRgb(neonColor);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(rgba(${r},${g},${b},0.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(${r},${g},${b},0.045) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 40%, transparent 85%)',
      WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 50%, black 40%, transparent 85%)',
    }} />
  );
}

function Corners({ neonColor }) {
  const { r, g, b } = hexToRgb(neonColor);
  const stroke = `rgba(${r},${g},${b},0.55)`;
  const L = 44, T = 3;
  const corner = (pos) => {
    const s = { position: 'absolute', width: L, height: L };
    const h = { position: 'absolute', background: stroke };
    if (pos === 'tl') return (
      <div style={{ ...s, top: 40, left: 40 }}>
        <div style={{ ...h, top: 0, left: 0, width: L, height: T }} />
        <div style={{ ...h, top: 0, left: 0, width: T, height: L }} />
      </div>
    );
    if (pos === 'tr') return (
      <div style={{ ...s, top: 40, right: 40 }}>
        <div style={{ ...h, top: 0, right: 0, width: L, height: T }} />
        <div style={{ ...h, top: 0, right: 0, width: T, height: L }} />
      </div>
    );
    if (pos === 'bl') return (
      <div style={{ ...s, bottom: 40, left: 40 }}>
        <div style={{ ...h, bottom: 0, left: 0, width: L, height: T }} />
        <div style={{ ...h, bottom: 0, left: 0, width: T, height: L }} />
      </div>
    );
    return (
      <div style={{ ...s, bottom: 40, right: 40 }}>
        <div style={{ ...h, bottom: 0, right: 0, width: L, height: T }} />
        <div style={{ ...h, bottom: 0, right: 0, width: T, height: L }} />
      </div>
    );
  };
  return <>{corner('tl')}{corner('tr')}{corner('bl')}{corner('br')}</>;
}

function Header({ textColor, accentColor }) {
  return (
    <div style={{
      position: 'absolute', top: 100, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      zIndex: 5,
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 18, letterSpacing: '0.3em',
        color: `${textColor}88`, textTransform: 'uppercase',
      }}>
        ∎ &nbsp;Project Evolution&nbsp; ∎
      </div>
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 62, fontWeight: 700, letterSpacing: '-0.02em',
        color: textColor,
      }}>
        NerdMiner<span style={{ color: accentColor }}>ORG</span>
      </div>
    </div>
  );
}

function Footer({ index, total, project, textColor, accentColor, showLabels, labelOpacity }) {
  if (!showLabels) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 130, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
      zIndex: 5,
      opacity: labelOpacity,
    }}>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 14, letterSpacing: '0.32em',
        color: `${textColor}66`,
      }}>
        {String(index + 1).padStart(2, '0')} &nbsp;/&nbsp; {String(total).padStart(2, '0')}
      </div>
      <div style={{
        fontFamily: 'Orbitron, sans-serif',
        fontSize: 54, fontWeight: 600, letterSpacing: '-0.01em',
        color: textColor,
      }}>
        {project.name}
      </div>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 17, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: `${textColor}66`,
      }}>
        {project.subtitle}
      </div>
      {/* progress dots */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: i === index ? 28 : 8, height: 8, borderRadius: 4,
            background: i === index ? accentColor : `${textColor}22`,
            transition: 'all 400ms ease',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── The morph-stage: dispatches to the selected effect ────────────────────
function MorphStage({ projects, activeIndex, blend, phase, neonColor, accentColor, effect }) {
  const total = projects.length;
  const nextIndex = (activeIndex + 1) % total;
  const isMorphing = phase === 'morph';
  const t = isMorphing ? blend : 0;

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: 40,
      zIndex: 3,
    }}>
      <div style={{
        position: 'relative',
        width: 728, height: 728,
      }}>
        {effect === 'glitch' && (
          <GlitchEffect
            outProject={projects[activeIndex]}
            inProject={projects[nextIndex]}
            t={t} isMorphing={isMorphing}
            neonColor={neonColor} accentColor={accentColor}
            outScale={projects[activeIndex].scale || 1}
            inScale={projects[nextIndex].scale || 1}
          />
        )}
        {effect === 'particles' && (
          <ParticlesEffect
            outProject={projects[activeIndex]}
            inProject={projects[nextIndex]}
            t={t} isMorphing={isMorphing}
            neonColor={neonColor}
            outScale={projects[activeIndex].scale || 1}
            inScale={projects[nextIndex].scale || 1}
          />
        )}
        {effect === 'shards' && (
          <ShardsEffect
            outProject={projects[activeIndex]}
            inProject={projects[nextIndex]}
            t={t}
            isMorphing={isMorphing}
            neonColor={neonColor}
          />
        )}
      </div>
    </div>
  );
}

// ── Effect 1: GLITCH / RGB SPLIT ──────────────────────────────────────────
function GlitchEffect({ outProject, inProject, t, isMorphing, neonColor, accentColor, outScale = 1, inScale = 1 }) {
  // Clean silhouette by default; RGB split appears only as momentary glitch pulses,
  // not as a constant halo. This avoids the "glow" look the user wanted removed.
  const outOpacity = t < 0.5 ? 1 : Math.max(0, 1 - (t - 0.5) * 4);
  const inOpacity = t < 0.5 ? 0 : Math.min(1, (t - 0.5) * 2);

  // Glitch intensity is pulsed, not a smooth arc — creates bursts of split/rest
  const base = Math.sin(t * Math.PI); // 0 → 1 → 0
  // stepped pulses — high-frequency gate
  const gate = isMorphing && base > 0.25 && (Math.sin(t * 55) > 0.3 || Math.sin(t * 33) > 0.5) ? 1 : 0;
  const glitchAmp = base * gate;

  const offsetR = glitchAmp * 22 * (Math.sin(t * 40) > 0 ? 1 : -1);
  const offsetB = glitchAmp * -22 * (Math.cos(t * 35) > 0 ? 1 : -1);
  const sliceY = Math.floor(base * 100);

  // Slice bars that cut horizontally — only during gate pulses
  const slices = isMorphing && glitchAmp > 0.15 ? [
    { top: (sliceY * 1.3) % 100, h: 8, dx: glitchAmp * 50 },
    { top: ((sliceY + 30) * 1.1) % 100, h: 14, dx: -glitchAmp * 40 },
    { top: ((sliceY + 60) * 0.7) % 100, h: 4, dx: glitchAmp * 70 },
  ] : [];

  return (
    <>
      {/* Outgoing — clean silhouette always; RGB split layers only appear during gate */}
      <div style={{ position: 'absolute', inset: 0, opacity: outOpacity, transform: `scale(${outScale})`, transformOrigin: 'center' }}>
        {glitchAmp > 0 && (
          <>
            <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${offsetR}px)`, opacity: glitchAmp }}>
              <TintedSvg src={outProject.src} color="#ff2020" project={outProject} />
            </div>
            <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${offsetB}px)`, opacity: glitchAmp }}>
              <TintedSvg src={outProject.src} color="#2080ff" project={outProject} />
            </div>
          </>
        )}
        <div style={{ position: 'absolute', inset: 0 }}>
          <TintedSvg src={outProject.src} color={neonColor} project={outProject} />
        </div>
      </div>

      {/* Incoming — same pattern */}
      {isMorphing && t > 0.35 && (
        <div style={{ position: 'absolute', inset: 0, opacity: inOpacity, transform: `scale(${inScale})`, transformOrigin: 'center' }}>
          {glitchAmp > 0 && (
            <>
              <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${offsetR * 0.5}px)`, opacity: glitchAmp * 0.7 }}>
                <TintedSvg src={inProject.src} color="#ff2020" project={inProject} />
              </div>
              <div style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', transform: `translateX(${offsetB * 0.5}px)`, opacity: glitchAmp * 0.7 }}>
                <TintedSvg src={inProject.src} color="#2080ff" project={inProject} />
              </div>
            </>
          )}
          <TintedSvg src={inProject.src} color={neonColor} project={inProject} />
        </div>
      )}

      {/* Horizontal slice bars — only during gate */}
      {slices.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `${s.top}%`, height: s.h,
          background: `linear-gradient(to bottom, transparent, rgba(255,180,100,0.25), transparent)`,
          transform: `translateX(${s.dx}px)`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Scanline overlay during glitch pulse only */}
      {isMorphing && glitchAmp > 0.3 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, transparent 1px, transparent 2px, rgba(255,255,255,0.04) 3px)`,
          opacity: glitchAmp * 0.6,
          pointerEvents: 'none',
        }} />
      )}
    </>
  );
}

// ── Effect 2: PARTICLE DISSOLVE ───────────────────────────────────────────
// Uses a radial-gradient CSS mask per cell. The gradient carries a "dissolve threshold"
// that sweeps top-left → bottom-right, so cells at small r dissolve first.
// Incoming rebuilds with the opposite direction (bottom-right → top-left).
function ParticlesEffect({ outProject, inProject, t, isMorphing, neonColor, outScale = 1, inScale = 1 }) {
  // We fake per-cell timing with a big radial mask + noise-like directional gradient.
  // Simpler approach: use opacity on a CSS conic/linear gradient mask that progresses with t.
  // We layer many small radial holes whose radius grows with t.

  // Build a grid of "holes" as WebKit mask composite
  const N = 16;
  const cells = React.useMemo(() => {
    const arr = [];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        arr.push({
          cx: (x + 0.5) / N * 100,
          cy: (y + 0.5) / N * 100,
          // diagonal wave: cells near top-left dissolve first, bottom-right last
          delay: ((x + y) / (2 * N)) * 0.6 + Math.random() * 0.15,
        });
      }
    }
    return arr;
  }, []);

  // Out mask: each cell is black (hidden) once t > delay, gradual via radial gradient hole size.
  // We compose: base is white, then punch black holes with growing radius.
  const outMaskLayers = cells.map(c => {
    const localT = isMorphing ? Math.max(0, Math.min(1, (t - c.delay) / 0.35)) : 0;
    const r = localT * 3.2; // percent
    if (r <= 0) return null;
    return `radial-gradient(circle at ${c.cx}% ${c.cy}%, transparent 0, transparent ${r * 0.8}%, black ${r}%)`;
  }).filter(Boolean);

  const inMaskLayers = cells.map(c => {
    // Incoming: inverse diagonal, reveals later cells first? No — reveals after delay passes
    const localT = isMorphing ? Math.max(0, Math.min(1, (t - c.delay - 0.15) / 0.35)) : 0;
    const r = localT * 3.5;
    if (r <= 0) return null;
    return `radial-gradient(circle at ${c.cx}% ${c.cy}%, white 0, white ${r * 0.7}%, transparent ${r}%)`;
  }).filter(Boolean);

  const outMaskStyle = outMaskLayers.length > 0 ? {
    WebkitMaskImage: outMaskLayers.join(', '),
    maskImage: outMaskLayers.join(', '),
    WebkitMaskComposite: 'source-in',
    maskComposite: 'intersect',
  } : {};

  const inMaskStyle = inMaskLayers.length > 0 ? {
    WebkitMaskImage: inMaskLayers.join(', '),
    maskImage: inMaskLayers.join(', '),
  } : { opacity: 0 };

  return (
    <>
      {/* Outgoing — fades via opacity (simpler & reliable) + slight scale blur */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: isMorphing ? Math.max(0, 1 - t * 1.4) : 1,
        filter: isMorphing ? `blur(${t * 3}px)` : 'none',
        transform: `scale(${outScale})`,
      }}>
        <TintedSvg src={outProject.src} color={neonColor} project={outProject} />
      </div>

      {/* Incoming — fades in from the other side */}
      {isMorphing && (
        <div style={{
          position: 'absolute', inset: 0,
          opacity: Math.max(0, (t - 0.3) * 1.6),
          filter: `blur(${Math.max(0, (1 - t) * 3)}px)`,
          transform: `scale(${inScale})`,
        }}>
          <TintedSvg src={inProject.src} color={neonColor} project={inProject} />
        </div>
      )}

      {/* Flying particles — the actual "dissolve" visual */}
      {isMorphing && (
        <svg width="728" height="728" viewBox="0 0 728 728" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {cells.map((c, i) => {
            const localT = Math.max(0, Math.min(1, (t - c.delay) / 0.6));
            if (localT <= 0 || localT >= 1) return null;
            // Fly outward + upward
            const angle = ((c.cx + c.cy * 0.3) / 50 - 1) * Math.PI;
            const dist = localT * 70;
            const cx = (c.cx / 100) * 728 + Math.cos(angle) * dist;
            const cy = (c.cy / 100) * 728 + Math.sin(angle) * dist - localT * 30;
            const opacity = Math.sin(localT * Math.PI);
            const r = 1.5 + (1 - localT) * 1;
            return <circle key={i} cx={cx} cy={cy} r={r} fill={neonColor} opacity={opacity * 0.7} />;
          })}
        </svg>
      )}
    </>
  );
}

// ── Effect 3: SHARDS EXPLOSION ────────────────────────────────────────────
// Slice the image into vertical bars. Outgoing bars fly outward; incoming bars fly in from outside.
function ShardsEffect({ outProject, inProject, t, isMorphing, neonColor }) {
  const N = 14;
  const bars = React.useMemo(() => {
    return Array.from({ length: N }).map((_, i) => ({
      delay: (Math.random() * 0.3),
      dir: (i % 2 === 0 ? 1 : -1) * (1 + Math.random() * 0.5),
      rot: (Math.random() - 0.5) * 30,
    }));
  }, []);

  return (
    <>
      {/* Outgoing shards */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {bars.map((b, i) => {
          const localT = isMorphing ? Math.max(0, Math.min(1, (t - b.delay) / 0.6)) : 0;
          const translateX = localT * b.dir * 200;
          const translateY = localT * ((i % 3) - 1) * 120;
          const rotate = localT * b.rot;
          const opacity = 1 - localT;
          const left = (i / N) * 100;
          const width = 100 / N;
          return (
            <div key={i} style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: `${left}%`, width: `${width}%`,
              overflow: 'hidden',
              transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
              opacity,
              transformOrigin: 'center center',
            }}>
              <div style={{
                position: 'absolute',
                top: 0, bottom: 0,
                left: `-${left}%`,
                width: `${N * 100}%`,
              }}>
                <TintedSvg src={outProject.src} color={neonColor} project={outProject} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Incoming shards (fly in from outside) */}
      {isMorphing && bars.map((b, i) => {
        const localT = Math.max(0, Math.min(1, (t - 0.3 - b.delay * 0.3) / 0.6));
        if (localT <= 0) return null;
        const inv = 1 - localT;
        const translateX = inv * b.dir * -220;
        const translateY = inv * ((i % 3) - 1) * -140;
        const rotate = inv * -b.rot;
        const opacity = localT;
        const left = (i / N) * 100;
        const width = 100 / N;
        return (
          <div key={i} style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${left}%`, width: `${width}%`,
            overflow: 'hidden',
            transform: `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
            opacity,
            transformOrigin: 'center center',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: `-${left}%`,
              width: `${N * 100}%`,
            }}>
              <TintedSvg src={inProject.src} color={neonColor} project={inProject} />
            </div>
          </div>
        );
      })}
    </>
  );
}

// Uses the SVG itself as a CSS mask, painted with the neon color. No glow.
// Global synchronous cache so swapping projects doesn't cause a frame of null
// render (which was causing a visible flash back to the previous project).
const SVG_CACHE = {};
const SVG_LOADING = {};

function preloadSvg(src) {
  if (!src || SVG_CACHE[src] || SVG_LOADING[src]) return;
  SVG_LOADING[src] = fetch(src)
    .then(r => r.text())
    .then(text => {
      SVG_CACHE[src] = text
        .replace(/fill="#000000"/g, 'fill="currentColor"')
        .replace(/fill="#000"/g, 'fill="currentColor"')
        .replace(/fill="black"/gi, 'fill="currentColor"');
      delete SVG_LOADING[src];
    });
}

// Eager preload at module load
PROJECTS.forEach(p => { if (p.src) preloadSvg(p.src); });

function TintedSvg({ src, color, project }) {
  // Force a re-render when any pending SVG finishes loading
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    if (src && !SVG_CACHE[src]) {
      preloadSvg(src);
      SVG_LOADING[src]?.then(() => forceUpdate());
    }
  }, [src]);

  // Fallback: if no src, render CTA card or placeholder tinted by color
  if (!src) {
    if (project && project.isCTA) return <CTACard neonColor={color} />;
    return <PlaceholderBox neonColor={color} label={project?.name || ''} />;
  }

  const svgContent = SVG_CACHE[src];
  if (!svgContent) return null;

  return (
    <div
      style={{
        width: '100%', height: '100%',
        color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// The glowing scanning bar between outgoing and incoming
function ScanBar({ scan, neonColor, accentColor }) {
  const { r, g, b } = hexToRgb(neonColor);
  const { r: ar, g: ag, b: ab } = hexToRgb(accentColor);
  return (
    <>
      {/* Bright center line */}
      <div style={{
        position: 'absolute',
        left: -30, right: -30,
        top: `calc(${scan * 100}% - 1px)`,
        height: 2,
        background: `linear-gradient(to right, transparent, ${accentColor} 15%, #fff 50%, ${accentColor} 85%, transparent)`,
        boxShadow: `0 0 14px ${neonColor}, 0 0 28px ${neonColor}, 0 0 60px rgba(${r},${g},${b},0.6)`,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }} />
      {/* Soft halo band */}
      <div style={{
        position: 'absolute',
        left: -40, right: -40,
        top: `calc(${scan * 100}% - 22px)`,
        height: 44,
        background: `linear-gradient(to bottom, transparent, rgba(${r},${g},${b},0.22), transparent)`,
        pointerEvents: 'none',
      }} />
      {/* Faint stripe lines trailing behind */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          left: 0, right: 0,
          top: `calc(${scan * 100}% + ${(i + 1) * 7}px)`,
          height: 1,
          background: `rgba(${ar},${ag},${ab},${0.18 - i * 0.05})`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

function CTACard({ neonColor }) {
  const { r, g, b } = hexToRgb(neonColor);
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28,
    }}>
      {/* Brackets */}
      <svg width="360" height="360" viewBox="0 0 360 360" style={{
        filter: `drop-shadow(0 0 6px ${neonColor})`,
      }}>
        <g fill="none" stroke={neonColor} strokeWidth="3" strokeLinecap="round">
          {/* Corner brackets */}
          <path d="M 30 90 L 30 30 L 90 30" />
          <path d="M 270 30 L 330 30 L 330 90" />
          <path d="M 330 270 L 330 330 L 270 330" />
          <path d="M 90 330 L 30 330 L 30 270" />
          {/* Central plus / target */}
          <circle cx="180" cy="180" r="48" opacity="0.4" />
          <circle cx="180" cy="180" r="70" opacity="0.2" />
          <path d="M 180 140 L 180 220 M 140 180 L 220 180" strokeWidth="2" />
          {/* Crosshair tick marks */}
          <path d="M 180 110 L 180 125 M 180 235 L 180 250 M 110 180 L 125 180 M 235 180 L 250 180" />
          {/* Diagonal guides */}
          <path d="M 60 60 L 120 120 M 300 60 L 240 120 M 60 300 L 120 240 M 300 300 L 240 240" strokeDasharray="4 6" opacity="0.35" />
        </g>
      </svg>
      <div style={{
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 15, letterSpacing: '0.35em',
        color: `rgba(${r},${g},${b},0.85)`,
        textTransform: 'uppercase',
        textShadow: `0 0 10px ${neonColor}`,
      }}>
        &gt; awaiting_your_project
      </div>
    </div>
  );
}

function PlaceholderBox({ neonColor, label }) {
  const { r, g, b } = hexToRgb(neonColor);
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: '70%', height: '70%',
        border: `2px dashed rgba(${r},${g},${b},0.5)`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Share Tech Mono, ui-monospace, monospace',
        fontSize: 18, letterSpacing: '0.25em',
        color: `rgba(${r},${g},${b},0.7)`,
        textShadow: `0 0 12px ${neonColor}`,
      }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

// ── Scanlines overlay ─────────────────────────────────────────────────────
function Scanlines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      zIndex: 8,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
      mixBlendMode: 'overlay',
    }} />
  );
}

// ── Main app with animation loop ─────────────────────────────────────────
function App() {
  const [tweaks, setTweaks] = React.useState(TWEAKS);
  const [state, setState] = React.useState({ index: 0, blend: 0, phase: 'hold' });
  // phase: 'hold' (static on current), 'morph' (transitioning to next)

  // Edit mode protocol
  React.useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setEditMode(true);
      if (e.data.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const [editMode, setEditMode] = React.useState(false);

  const updateTweak = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
  };

  // Animation timer — drives hold + morph loop
  React.useEffect(() => {
    let raf, start = performance.now(), phaseStart = start;
    let { index, phase } = state;

    const tick = () => {
      const now = performance.now();
      const elapsed = (now - phaseStart) / 1000;

      if (phase === 'hold') {
        if (elapsed >= tweaks.holdSeconds) {
          phase = 'morph';
          phaseStart = now;
          setState({ index, blend: 0, phase });
        } else {
          setState({ index, blend: 0, phase });
        }
      } else {
        const p = Math.min(1, elapsed / tweaks.morphSeconds);
        // ease in-out cubic for the blend so lines feel fluid
        const eased = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        if (p >= 1) {
          index = (index + 1) % PROJECTS.length;
          phase = 'hold';
          phaseStart = now;
          setState({ index, blend: 0, phase });
        } else {
          setState({ index, blend: eased, phase });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tweaks.holdSeconds, tweaks.morphSeconds]);

  const project = PROJECTS[state.index];
  const labelOpacity = state.phase === 'morph'
    ? (state.blend < 0.5 ? 1 - state.blend * 2 : (state.blend - 0.5) * 2)
    : 1;
  const displayProject = state.phase === 'morph' && state.blend >= 0.5
    ? PROJECTS[(state.index + 1) % PROJECTS.length]
    : project;
  const displayIndex = state.phase === 'morph' && state.blend >= 0.5
    ? (state.index + 1) % PROJECTS.length
    : state.index;

  return (
    <div style={{
      position: 'relative',
      width: 1080, height: 1920,
      background: '#070b0f',
      overflow: 'hidden',
      fontFamily: 'Orbitron, sans-serif',
    }}>
      <MorphStage
        projects={PROJECTS}
        activeIndex={state.index}
        blend={state.phase === 'morph' ? state.blend : 0}
        phase={state.phase}
        neonColor={tweaks.objectColor}
        accentColor={tweaks.accentColor}
        effect={tweaks.effect}
      />
      <HashRateCounter
        state={state}
        textColor={tweaks.textColor}
        accentColor={tweaks.accentColor}
      />

      {editMode && <TweaksPanel tweaks={tweaks} setTweak={updateTweak} />}
    </div>
  );
}

// ── Tweaks panel ──────────────────────────────────────────────────────────
function TweaksPanel({ tweaks, setTweak }) {
  const row = { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 };
  const label = { fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontFamily: 'JetBrains Mono, monospace' };
  const input = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#fff', padding: '6px 8px', fontSize: 13, fontFamily: 'JetBrains Mono, monospace' };

  return (
    <div style={{
      position: 'absolute', bottom: 40, right: 40,
      width: 280,
      background: 'rgba(12,8,5,0.92)',
      border: '1px solid rgba(255,122,26,0.3)',
      borderRadius: 10,
      padding: 20,
      color: '#fff',
      fontFamily: 'Space Grotesk, sans-serif',
      backdropFilter: 'blur(12px)',
      zIndex: 100,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: tweaks.accentColor, marginBottom: 16 }}>
        Tweaks
      </div>

      <div style={row}>
        <div style={label}>Object color</div>
        <input type="color" value={tweaks.objectColor} onChange={e => setTweak('objectColor', e.target.value)} style={{ ...input, height: 32, padding: 0 }} />
      </div>

      <div style={row}>
        <div style={label}>Text color</div>
        <input type="color" value={tweaks.textColor} onChange={e => setTweak('textColor', e.target.value)} style={{ ...input, height: 32, padding: 0 }} />
      </div>

      <div style={row}>
        <div style={label}>Accent color</div>
        <input type="color" value={tweaks.accentColor} onChange={e => setTweak('accentColor', e.target.value)} style={{ ...input, height: 32, padding: 0 }} />
      </div>

      <div style={row}>
        <div style={label}>Hold: {tweaks.holdSeconds.toFixed(1)}s</div>
        <input type="range" min="0.5" max="5" step="0.1" value={tweaks.holdSeconds} onChange={e => setTweak('holdSeconds', parseFloat(e.target.value))} />
      </div>

      <div style={row}>
        <div style={label}>Morph: {tweaks.morphSeconds.toFixed(1)}s</div>
        <input type="range" min="0.3" max="4" step="0.1" value={tweaks.morphSeconds} onChange={e => setTweak('morphSeconds', parseFloat(e.target.value))} />
      </div>

      <div style={row}>
        <div style={label}>Effect</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['glitch', 'particles'].map(fx => (
            <button
              key={fx}
              onClick={() => setTweak('effect', fx)}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: tweaks.effect === fx ? tweaks.neonColor : 'rgba(255,255,255,0.05)',
                color: tweaks.effect === fx ? '#000' : '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 4,
                fontSize: 10,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: tweaks.effect === fx ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {fx}
            </button>
          ))}
        </div>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 8 }}>
        <input type="checkbox" checked={tweaks.showLabels} onChange={e => setTweak('showLabels', e.target.checked)} />
        <span style={label}>Show labels</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={tweaks.showGrid} onChange={e => setTweak('showGrid', e.target.checked)} />
        <span style={label}>Show grid</span>
      </label>
    </div>
  );
}

// Expose
Object.assign(window, { App });
