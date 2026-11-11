import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const STARS = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: (index * 53) % 100,
  top: (index * 29) % 62,
  size: index % 6 === 0 ? 2.4 : 1.4,
  delay: `${(index % 8) * 0.35}s`,
}));

const DROPS = Array.from({ length: 64 }, (_, index) => ({
  id: index,
  left: (index * 37) % 100,
  delay: `${-((index * 0.17) % 2.5)}s`,
  duration: `${0.9 + (index % 7) * 0.12}s`,
  height: 14 + (index % 5) * 5,
  opacity: 0.3 + (index % 4) * 0.12,
  drift: `${(index % 2 === 0 ? -1 : 1) * (12 + (index % 5) * 4)}px`,
}));

const CLOUDS = [
  { id: 'a', top: '18%', left: '6%', scale: 1, duration: '96s' },
  { id: 'b', top: '8%', left: '62%', scale: 0.72, duration: '120s' },
  { id: 'c', top: '62%', left: '18%', scale: 1.2, duration: '140s' },
];

function Jet() {
  const windows = Array.from({ length: 16 }, (_, index) => 292 + index * 22);

  return (
    <svg className="jet-svg" viewBox="0 0 800 420" aria-hidden="true">
      <ellipse className="jet-shadow" cx="430" cy="300" rx="210" ry="22" />
      <path className="jet-wing" d="M360 200 L470 190 L418 32 L388 54 Z" />
      <path className="jet-wing" d="M360 220 L470 230 L418 388 L388 366 Z" />
      <ellipse className="jet-engine" cx="412" cy="118" rx="22" ry="7" />
      <ellipse className="jet-intake" cx="430" cy="118" rx="4" ry="4" />
      <ellipse className="jet-engine" cx="408" cy="74" rx="16" ry="5.5" />
      <ellipse className="jet-intake" cx="421" cy="74" rx="3.2" ry="3.2" />
      <ellipse className="jet-engine" cx="412" cy="302" rx="22" ry="7" />
      <ellipse className="jet-intake" cx="430" cy="302" rx="4" ry="4" />
      <ellipse className="jet-engine" cx="408" cy="346" rx="16" ry="5.5" />
      <ellipse className="jet-intake" cx="421" cy="346" rx="3.2" ry="3.2" />
      <path className="jet-wing" d="M176 204 L246 196 L228 184 L170 192 Z" />
      <path className="jet-wing" d="M176 216 L246 224 L228 236 L170 228 Z" />
      <path className="jet-fin" d="M198 198 L252 200 L234 52 L210 54 Z" />
      <circle className="jet-light-glow port" cx="416" cy="30" r="8" />
      <circle className="jet-light port" cx="416" cy="30" r="3.4" />
      <circle className="jet-light-glow starboard" cx="416" cy="390" r="8" />
      <circle className="jet-light starboard" cx="416" cy="390" r="3.4" />
      <circle className="jet-light-glow tail" cx="220" cy="58" r="6" />
      <circle className="jet-light tail" cx="220" cy="58" r="2.6" />
      <path className="jet-body" d="M188 210 C188 192 280 180 430 178 L668 184 C730 188 770 200 776 210 C770 220 730 232 668 236 L430 242 C280 240 188 228 188 210 Z" />
      <path className="jet-belly" d="M230 214 C310 232 560 236 748 214 L748 222 C620 240 300 238 210 220 Z" />
      <path className="jet-line" d="M250 210 H700" />
      {windows.map((cx) => (
        <circle key={cx} className="jet-window" cx={cx} cy="198" r="3.1" />
      ))}
      <path className="jet-cockpit" d="M708 198 C736 202 758 208 764 210 C752 216 728 218 706 210 Z" />
      <circle className="jet-gear" cx="360" cy="236" r="5" />
      <circle className="jet-gear" cx="520" cy="240" r="4.5" />
      <circle className="jet-gear" cx="250" cy="228" r="4" />
    </svg>
  );
}

export function Sky({ raining }) {
  const stageRef = useRef(null);
  const anchorRef = useRef(null);
  const rigRef = useRef(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const anchor = anchorRef.current;
    const rig = rigRef.current;
    if (!stage || !anchor || !rig) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let start = 0;
    let end = 1;
    let span = null;
    let watching = null;

    const measure = () => {
      const runway = document.getElementById('runway');
      const gate = document.getElementById('register');
      const view = window.innerHeight;
      if (runway && gate) {
        const runwayTop = runway.getBoundingClientRect().top + window.scrollY;
        const gateTop = gate.getBoundingClientRect().top + window.scrollY;
        start = runwayTop;
        end = Math.max(gateTop - view, start + 1);
      }
      const compact = window.matchMedia('(max-width: 760px)').matches;
      const x0 = ((compact ? 58 : 64) / 100) * window.innerWidth;
      const x1 = ((compact ? 90 : 88) / 100) * window.innerWidth;
      const y0 = ((compact ? 72 : 74) / 100) * window.innerHeight;
      const y1 = ((compact ? 6 : 8) / 100) * window.innerHeight;
      span = {
        x0,
        y0,
        dx: x1 - x0,
        dy: y1 - y0,
        scale0: compact ? 0.48 : 0.62,
        scale1: compact ? 0.1 : 0.12,
      };
      rig.style.setProperty('--heading', `${(Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI}deg`);
    };

    const paint = () => {
      if (!span) return;
      const progress = Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)));
      const scale = span.scale0 + (span.scale1 - span.scale0) * progress;
      anchor.style.transform = `translate3d(${span.x0 + span.dx * progress}px, ${span.y0 + span.dy * progress}px, 0) scale(${scale})`;
      const opacity = progress >= 0.84 ? 0 : progress <= 0.62 ? 1 : (0.84 - progress) / 0.22;
      stage.style.opacity = String(opacity);
      anchor.style.setProperty('--gear', String(Math.max(0, Math.min(1, 1 - progress / 0.12))));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    };

    const onResize = () => {
      if (reduced.matches) return;
      measure();
      paint();
    };

    const engage = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      window.removeEventListener('scroll', onScroll);
      if (reduced.matches) {
        stage.style.opacity = '0';
        return;
      }
      measure();
      paint();
      window.addEventListener('scroll', onScroll, { passive: true });
    };

    engage();
    window.addEventListener('resize', onResize);
    reduced.addEventListener('change', engage);

    if (typeof ResizeObserver !== 'undefined') {
      watching = new ResizeObserver(() => {
        if (reduced.matches) return;
        measure();
        paint();
      });
      const runway = document.getElementById('runway');
      const gate = document.getElementById('register');
      if (runway) watching.observe(runway);
      if (gate) watching.observe(gate);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      reduced.removeEventListener('change', engage);
      watching?.disconnect();
    };
  }, []);

  const aircraft = (
    <div
      ref={stageRef}
      className={`flight-stage ${raining ? 'is-wet' : ''}`}
      aria-hidden="true"
    >
      <div className="flight-world">
        <div className="flight-anchor" ref={anchorRef}>
          <div className="flight-rig" ref={rigRef}>
            <Jet />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`sky ${raining ? 'is-raining' : ''}`} aria-hidden="true">
      <div className="stars">
        {STARS.map((star) => (
          <span
            key={star.id}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>
      {CLOUDS.map((cloud) => (
        <span
          key={cloud.id}
          className="cloud-drift"
          style={{ top: cloud.top, left: cloud.left, animationDuration: cloud.duration }}
        >
          <span className="cloud" style={{ transform: `scale(${cloud.scale})` }} />
        </span>
      ))}
      {raining ? (
        <div className="rain">
          {DROPS.map((drop) => (
            <span
              key={drop.id}
              className="drop"
              style={{
                left: `${drop.left}%`,
                height: drop.height,
                opacity: drop.opacity,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
                '--drift': drop.drift,
              }}
            />
          ))}
        </div>
      ) : null}
      {typeof document !== 'undefined' ? createPortal(aircraft, document.body) : null}
    </div>
  );
}
