import { useState, useRef, useCallback, TouchEvent } from "react";

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

interface PullToRefreshHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

export const usePullToRefresh = (config: PullToRefreshConfig): PullToRefreshState & PullToRefreshHandlers => {
  const { onRefresh, threshold = 80, maxPull = 120 } = config;
  
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    startY.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance to pull
      const resistance = 0.5;
      const pull = Math.min(diff * resistance, maxPull);
      setPullDistance(pull);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
    currentY.current = 0;
  }, [isPulling, pullDistance, threshold, onRefresh]);

  return {
    isPulling,
    isRefreshing,
    pullDistance,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
