import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NarrativeMessageProps {
  role: "user" | "assistant";
  content: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const NarrativeMessage = ({ role, content, onSpeak, isSpeaking }: NarrativeMessageProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        role === "assistant" ? "pr-12" : "pl-12"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`relative rounded-xl p-6 ${
          role === "assistant"
            ? "bg-gradient-to-br from-card to-card/50 border border-primary/20 shadow-epic"
            : "bg-muted/50 border border-muted"
        }`}
      >
        {role === "assistant" && (
          <div className="absolute -left-3 top-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-glow">
            <span className="text-xs font-bold text-primary-foreground">GM</span>
          </div>
        )}
        
        <div className="prose prose-invert max-w-none">
          <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>

        {role === "assistant" && onSpeak && isHovered && (
          <Button
            onClick={() => onSpeak(content)}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity"
          >
            {isSpeaking ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
