/**
 * AI OS — AI Orb
 *
 * Visual indicator of AI state. Connected to chatStore.aiStatus.
 * Click opens the Chat panel.
 *
 * States:
 *   ready    — calm breathe animation, blue gradient
 *   thinking — fast pulse, faster rotation, brighter glow
 *   error    — red-tinted gradient, shake animation
 */

import { useState, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAppStore } from '../stores/appStore';

export default function AiOrb() {
  const aiStatus = useChatStore((s) => s.aiStatus);
  const openApp = useAppStore((s) => s.openApp);
  const [ripple, setRipple] = useState(false);

  const handleClick = useCallback(() => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    openApp('chat');
  }, [openApp]);

  // ─── State-driven styles ─────────────────────────────────────────

  const isThinking = aiStatus === 'thinking';
  const isError = aiStatus === 'error';

  const gradientStyle = isError
    ? 'linear-gradient(135deg, #ef4444, #b91c1c)'
    : 'linear-gradient(135deg, var(--color-primary), var(--color-accent))';

  const glowColor = isError
    ? 'rgba(239, 68, 68, 0.3)'
    : 'rgba(79, 140, 255, 0.3)';

  const glowColorHover = isError
    ? 'rgba(239, 68, 68, 0.4)'
    : 'rgba(79, 140, 255, 0.4)';

  const breatheClass = isThinking
    ? 'animate-pulse-fast'
    : 'animate-breathe';

  const rotationSpeed = isThinking ? '1.5s' : '4s';

  const orbShake = isError ? 'animate-shake' : '';

  return (
    <div className={`fixed bottom-20 right-6 z-40 ${orbShake}`}>
      {/* Particles */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${isError ? 'bg-red-400/60' : 'bg-primary/60'}`}
          style={{
            animation: `orbParticle ${3 + i * 0.5}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}

      {/* Outer glow */}
      <div
        className={`absolute inset-0 rounded-full blur-[20px] opacity-40 ${breatheClass}`}
        style={{
          background: gradientStyle,
          width: '60px',
          height: '60px',
        }}
      />

      {/* Ripple effect */}
      {ripple && (
        <div
          className={`absolute inset-0 rounded-full border-2 ${isError ? 'border-red-500/50' : 'border-primary/50'}`}
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
        className={`
          relative w-[60px] h-[60px] rounded-full
          flex items-center justify-center cursor-pointer
          transition-all duration-300
          hover:scale-110 active:scale-95
        `}
        style={{
          background: gradientStyle,
          boxShadow: `0 0 20px ${glowColor}, inset 0 0 20px rgba(255, 255, 255, 0.1)`,
          transition: 'background 0.5s ease, box-shadow 0.5s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 30px ${glowColorHover}`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${glowColor}, inset 0 0 20px rgba(255, 255, 255, 0.1)`;
        }}
        title="Open AI Chat"
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
            background: isError
              ? 'conic-gradient(from 0deg, #ef4444, #b91c1c, #ef4444)'
              : `conic-gradient(from 0deg, var(--color-primary), var(--color-accent), var(--color-primary))`,
            animation: `rotateGradient ${rotationSpeed} linear infinite`,
            mask: 'radial-gradient(circle, transparent 27px, black 28px)',
            WebkitMask: 'radial-gradient(circle, transparent 27px, black 28px)',
          }}
        />

        {/* AI icon */}
        <span className="relative text-lg select-none">
          {isThinking ? '⟳' : '✦'}
        </span>
      </button>
    </div>
  );
}
