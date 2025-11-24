import { useEffect, useState } from "react";

interface AtmosphereEffectProps {
  campaignType: string;
}

export const AtmosphereEffect = ({ campaignType }: AtmosphereEffectProps) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Generate particles for rain/snow effects
    if (campaignType === 'fantasy' || campaignType === 'horror') {
      setParticles(Array.from({ length: 50 }, (_, i) => i));
    }
  }, [campaignType]);

  if (campaignType === 'fantasy') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Rain effect */}
        {particles.map((i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-primary/20 animate-rain"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              height: `${20 + Math.random() * 30}px`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${0.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10" />
      </div>
    );
  }

  if (campaignType === 'cyberpunk') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Neon grid */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,hsl(var(--accent)/0.03)_50%,transparent_100%)] bg-[length:100px_100%] animate-neon-scan" />
        
        {/* Flickering neon lights */}
        <div className="absolute top-0 left-1/4 w-1 h-20 bg-accent/40 animate-neon-flicker shadow-[0_0_20px_hsl(var(--accent))]" />
        <div className="absolute top-10 right-1/3 w-1 h-16 bg-destructive/40 animate-neon-flicker-delayed shadow-[0_0_20px_hsl(var(--destructive))]" style={{ animationDelay: '0.3s' }} />
        <div className="absolute top-5 left-2/3 w-1 h-24 bg-primary/40 animate-neon-flicker shadow-[0_0_20px_hsl(var(--primary))]" style={{ animationDelay: '0.6s' }} />
        
        {/* Ambient cyberpunk glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-destructive/5" />
        
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_0%,hsl(var(--foreground)/0.02)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanlines" />
      </div>
    );
  }

  if (campaignType === 'horror') {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Fog effect */}
        <div className="absolute inset-0 animate-fog">
          <div className="absolute inset-0 bg-gradient-radial from-muted/30 via-muted/10 to-transparent blur-3xl" 
               style={{ transform: 'scale(1.5)' }} />
        </div>
        <div className="absolute inset-0 animate-fog-delayed">
          <div className="absolute inset-0 bg-gradient-radial from-muted/20 via-muted/5 to-transparent blur-3xl" 
               style={{ transform: 'scale(1.8) translateX(20%)' }} />
        </div>
        
        {/* Vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background))_100%)] opacity-60" />
        
        {/* Subtle particle drift */}
        {particles.slice(0, 20).map((i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-muted/30 rounded-full animate-drift blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default - no special atmosphere
  return null;
};
