import React, { useEffect, useState } from 'react';
import { UrineDrop } from './UrineDrop';

interface PissSplashAnimationProps {
  show: boolean;
  title: string;
  subtitle?: string;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  delay: number;
  duration: number;
}

export const PissSplashAnimation: React.FC<PissSplashAnimationProps> = ({
  show,
  title,
  subtitle,
  onComplete
}) => {
  const [visible, setVisible] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (show) {
      setVisible(true);

      // Generate 20 randomized golden droplet trajectory particles
      const newParticles: Particle[] = Array.from({ length: 22 }).map((_, i) => {
        const angle = (i / 22) * 2 * Math.PI + (Math.random() * 0.4 - 0.2);
        const distance = 90 + Math.random() * 160;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40, // slight upward bias
          scale: 0.8 + Math.random() * 0.9,
          rotation: Math.random() * 360,
          delay: Math.random() * 0.15,
          duration: 0.9 + Math.random() * 0.4
        };
      });
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      
      {/* Golden Shockwave ring */}
      <div className="absolute w-44 h-44 rounded-full border-4 border-amber-400 animate-ping opacity-70 duration-1000" />
      
      {/* Flying Golden Droplets */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transition-transform ease-out"
          style={{
            animation: `piss-fly ${p.duration}s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
            animationDelay: `${p.delay}s`,
            ['--tx' as string]: `${p.x}px`,
            ['--ty' as string]: `${p.y}px`,
            ['--rot' as string]: `${p.rotation}deg`,
            ['--sc' as string]: p.scale
          }}
        >
          <UrineDrop size="md" />
        </div>
      ))}

      {/* Center Celebratory Badge */}
      <div 
        className="relative bg-[#fde047] border-2 border-black rounded-3xl p-5 shadow-2xl text-center space-y-1 transform transition-all duration-300"
        style={{
          animation: 'piss-badge-pop 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        <div className="flex items-center justify-center gap-1.5 text-3xl mb-1">
          <UrineDrop size="lg" />
          <span className="text-2xl font-black">⚡</span>
          <UrineDrop size="lg" />
        </div>
        <h3 className="font-black text-lg text-black tracking-tight leading-tight uppercase">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs font-bold text-slate-800">
            {subtitle}
          </p>
        )}
      </div>

      <style>{`
        @keyframes piss-fly {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.2) rotate(0deg);
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 0.9;
            transform: translate(var(--tx), var(--ty)) scale(var(--sc)) rotate(var(--rot));
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), calc(var(--ty) + 40px)) scale(calc(var(--sc) * 0.7)) rotate(calc(var(--rot) + 45deg));
          }
        }

        @keyframes piss-badge-pop {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(20px);
          }
          18% {
            opacity: 1;
            transform: scale(1.08) translateY(-4px);
          }
          30% {
            transform: scale(1) translateY(0);
          }
          82% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.85) translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
};
