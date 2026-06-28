import { useState, useCallback } from 'react';

export default function AiOrb() {
  const [ripple, setRipple] = useState(false);

  const handleClick = useCallback(() => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  }, []);

  return (
    <div className="fixed bottom-20 right-6 z-40">
      {/* Particles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-primary/60"
          style={{
            animation: `orbParticle ${3 + i * 0.5}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full blur-[20px] opacity-40 animate-breathe"
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          width: '60px',
          height: '60px',
        }}
      />

      {/* Ripple effect */}
      {ripple && (
        <div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          style={{
            width: '60px',
            height: '60px',
            animation: 'ripple 600ms ease-out forwards',
          }}
        />
      )}

      {/* Main orb */}
      <button
        onClick={handleClick}
        className="
          relative w-[60px] h-[60px] rounded-full
          flex items-center justify-center cursor-pointer
          transition-all duration-300
          hover:scale-110 hover:shadow-[0_0_30px_rgba(79,140,255,0.4)]
          active:scale-95
        "
        style={{
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          boxShadow: '0 0 20px rgba(79, 140, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)',
        }}
        title="AI Orb — Coming in v0.2.0"
      >
        {/* Inner shine */}
        <div
          className="absolute w-8 h-8 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            top: '8px',
            left: '10px',
          }}
        />

        {/* Rotating border */}
        <div
          className="absolute inset-[-2px] rounded-full opacity-60"
          style={{
            background: `conic-gradient(
              from 0deg,
              var(--color-primary),
              var(--color-accent),
              var(--color-primary)
            )`,
            animation: 'rotateGradient 4s linear infinite',
            mask: 'radial-gradient(circle, transparent 27px, black 28px)',
            WebkitMask: 'radial-gradient(circle, transparent 27px, black 28px)',
          }}
        />

        {/* AI icon */}
        <span className="relative text-lg select-none">✦</span>
      </button>
    </div>
  );
}
