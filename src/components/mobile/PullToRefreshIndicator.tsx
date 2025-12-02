import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  threshold?: number;
}

export const PullToRefreshIndicator = ({
  pullDistance,
  isRefreshing,
  threshold = 80,
}: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180;
  const scale = 0.5 + progress * 0.5;

  return (
    <motion.div
      className="absolute left-0 right-0 flex justify-center z-10 pointer-events-none"
      style={{ top: pullDistance - 40 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 text-primary transition-transform"
            style={{ transform: `rotate(${rotation}deg)` }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12l7-7 7 7" />
          </svg>
        )}
      </div>
    </motion.div>
  );
};
