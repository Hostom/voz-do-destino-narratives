import { useEffect, useState } from "react";

interface VoiceFlameProps {
  userId: string;
  isSpeaking: boolean;
}

export const VoiceFlame = ({ userId, isSpeaking }: VoiceFlameProps) => {
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (isSpeaking) {
      // Randomize intensity for natural flame effect
      const interval = setInterval(() => {
        setIntensity(0.7 + Math.random() * 0.3);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setIntensity(0);
    }
  }, [isSpeaking]);

  if (!isSpeaking) return null;

  return (
    <div className="relative w-6 h-6 flex-shrink-0">
      {/* Core flame */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 animate-flame-pulse"
        style={{
          transform: `scale(${0.8 + intensity * 0.4})`,
          opacity: 0.9 + intensity * 0.1,
          filter: `blur(${2 + intensity}px)`,
          boxShadow: `0 0 ${10 + intensity * 15}px ${5 + intensity * 10}px rgba(255, 138, 0, ${0.4 + intensity * 0.3})`,
        }}
      />
      
      {/* Inner glow */}
      <div 
        className="absolute inset-1 rounded-full bg-gradient-to-t from-yellow-400 to-white animate-flame-flicker"
        style={{
          transform: `scale(${0.6 + intensity * 0.3})`,
          opacity: 0.7 + intensity * 0.2,
        }}
      />

      {/* Outer spark particles */}
      <div 
        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-300 animate-spark-1"
        style={{
          opacity: intensity > 0.8 ? 1 : 0,
        }}
      />
      <div 
        className="absolute -bottom-1 -left-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-spark-2"
        style={{
          opacity: intensity > 0.7 ? 1 : 0,
        }}
      />

      {/* Spiritual energy rings */}
      <div 
        className="absolute -inset-2 rounded-full border-2 border-orange-500/30 animate-energy-ring"
        style={{
          transform: `scale(${1 + intensity * 0.2})`,
          opacity: 0.4 + intensity * 0.3,
        }}
      />
    </div>
  );
};
