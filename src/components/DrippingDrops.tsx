import { useEffect, useRef, useCallback } from 'react';

interface Drop {
  id: number;
  x: number;          // horizontal position in %
  startTime: number;  // when the drop started falling
  duration: number;   // 5000-7000ms
  size: number;       // drop radius 3-5px
  opacity: number;    // max opacity 0.3-0.6
  trailFading: boolean;
  trailFadeStart: number;
}

export function DrippingDrops() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const nextIdRef = useRef(0);
  const rafRef = useRef<number>(0);

  const isDark = document.documentElement.classList.contains('dark');

  const createDrop = useCallback((): Drop => {
    return {
      id: nextIdRef.current++,
      x: 5 + Math.random() * 90, // 5-95% to avoid edges
      startTime: performance.now() + Math.random() * 2000, // stagger initial spawns
      duration: 5000 + Math.random() * 2000, // 5-7 seconds
      size: 3 + Math.random() * 2,
      opacity: 0.25 + Math.random() * 0.25,
      trailFading: false,
      trailFadeStart: 0,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to container
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize with 4 drops staggered
    dropsRef.current = Array.from({ length: 4 }, () => createDrop());

    const TRAIL_FADE_DURATION = 1500; // ms for trail to fade after drop reaches bottom
    const TARGET_COUNT_MIN = 3;
    const TARGET_COUNT_MAX = 5;

    const animate = (now: number) => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const dark = document.documentElement.classList.contains('dark');

      const drops = dropsRef.current;

      // Remove fully faded trails
      dropsRef.current = drops.filter((d) => {
        if (d.trailFading) {
          return now - d.trailFadeStart < TRAIL_FADE_DURATION;
        }
        return true;
      });

      // Ensure we have enough active (non-fading) drops
      const activeCount = dropsRef.current.filter((d) => !d.trailFading).length;
      const target = TARGET_COUNT_MIN + Math.floor(Math.random() * (TARGET_COUNT_MAX - TARGET_COUNT_MIN + 1));
      for (let i = activeCount; i < target; i++) {
        const newDrop = createDrop();
        newDrop.startTime = now + Math.random() * 1500;
        dropsRef.current.push(newDrop);
      }

      // Draw each drop
      for (const drop of dropsRef.current) {
        const elapsed = now - drop.startTime;
        if (elapsed < 0) continue; // not started yet

        const progress = Math.min(elapsed / drop.duration, 1); // 0→1

        // Easing: slight acceleration (quadratic ease-in)
        const easedProgress = progress * progress * 0.3 + progress * 0.7;
        const easedY = easedProgress * (h + 40);

        // Drop color
        const dropColor = dark
          ? `rgba(250, 204, 21, ${drop.opacity * (1 - Math.max(0, progress - 0.85) / 0.15)})`
          : `rgba(202, 138, 4, ${drop.opacity * (1 - Math.max(0, progress - 0.85) / 0.15)})`;

        // Trail: faint line from top to current position
        const trailOpacity = drop.trailFading
          ? drop.opacity * 0.3 * Math.max(0, 1 - (now - drop.trailFadeStart) / TRAIL_FADE_DURATION)
          : drop.opacity * 0.3 * Math.min(1, progress * 3); // fade in quickly

        if (trailOpacity > 0.01) {
          const trailColor = dark
            ? `rgba(250, 204, 21, ${trailOpacity})`
            : `rgba(202, 138, 4, ${trailOpacity})`;
          
          const xPx = (drop.x / 100) * w;
          
          // Trail gradient - fades toward top
          const gradient = ctx.createLinearGradient(xPx, 0, xPx, Math.min(easedY, h));
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.3, trailColor);
          gradient.addColorStop(1, trailColor);

          ctx.beginPath();
          ctx.strokeStyle = gradient;
          ctx.lineWidth = drop.size * 0.5;
          ctx.lineCap = 'round';
          ctx.moveTo(xPx, Math.max(0, easedY - h * 0.1)); // trail starts slightly above spawn
          ctx.lineTo(xPx, Math.min(easedY, h));
          ctx.stroke();
        }

        // Draw the drop itself (teardrop shape) only if not trail-fading
        if (!drop.trailFading && progress < 1) {
          const xPx = (drop.x / 100) * w;
          
          ctx.save();
          ctx.translate(xPx, easedY);

          // Elongate the drop slightly as it falls
          const stretch = 1 + progress * 0.5;
          ctx.scale(1, stretch);

          // Teardrop: circle with a pointed top
          ctx.beginPath();
          const r = drop.size;
          // Main body (circle)
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = dropColor;
          ctx.fill();

          // Top point (triangle for teardrop shape)
          ctx.beginPath();
          ctx.moveTo(-r * 0.5, -r * 0.3);
          ctx.lineTo(0, -r * 2);
          ctx.lineTo(r * 0.5, -r * 0.3);
          ctx.closePath();
          ctx.fillStyle = dropColor;
          ctx.fill();

          // Highlight/shine
          ctx.beginPath();
          ctx.arc(-r * 0.3, -r * 0.2, r * 0.3, 0, Math.PI * 2);
          const shineColor = dark
            ? `rgba(255, 255, 255, ${drop.opacity * 0.3})`
            : `rgba(255, 255, 255, ${drop.opacity * 0.5})`;
          ctx.fillStyle = shineColor;
          ctx.fill();

          ctx.restore();
        }

        // When drop reaches bottom, start trail fading
        if (!drop.trailFading && progress >= 1) {
          drop.trailFading = true;
          drop.trailFadeStart = now;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [createDrop, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
