import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <div className="border-t border-border/50 backdrop-blur-epic bg-card/30 p-3 md:p-6">
      <form onSubmit={handleSubmit} className="container mx-auto max-w-4xl">
        <div className="flex gap-2 md:gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Descreva sua ação ou fale com o mestre..."
            className="min-h-[60px] md:min-h-[80px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors text-sm md:text-base"
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || disabled}
            className="h-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-epic px-3 md:px-4"
          >
            {disabled ? (
              <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </form>
    </div>
  );
};
