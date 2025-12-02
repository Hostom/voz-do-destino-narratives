import { cn } from "@/lib/utils";

interface SwipeIndicatorProps {
  totalTabs: number;
  activeIndex: number;
  className?: string;
}

export const SwipeIndicator = ({ totalTabs, activeIndex, className }: SwipeIndicatorProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-1.5 py-2", className)}>
      {Array.from({ length: totalTabs }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === activeIndex
              ? "w-4 bg-primary"
              : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
};
