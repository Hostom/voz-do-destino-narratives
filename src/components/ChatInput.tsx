import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mic, MicOff } from "lucide-react";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import { useToast } from "@/components/ui/use-toast";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleVoiceClick = async () => {
    if (isRecording) {
      try {
        const transcription = await stopRecording();
        setInput(transcription);
        toast({
          title: "Áudio transcrito",
          description: "Você pode revisar e editar antes de enviar",
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
    } else {
      await startRecording();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-2">
      <div className="flex gap-1.5">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva sua ação ou fale com o mestre..."
          className="flex-1 min-h-[48px] resize-none bg-background border-border focus:border-primary transition-colors rounded-lg text-sm touch-manipulation"
          disabled={disabled || isRecording || isProcessing}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleVoiceClick}
          disabled={disabled || isProcessing}
          className={`h-9 w-9 shrink-0 rounded-lg shadow-md transition-all ${
            isRecording 
              ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground animate-pulse' 
              : 'bg-accent hover:bg-accent/80 text-accent-foreground hover:shadow-lg hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled || isRecording || isProcessing}
          className="h-9 w-9 shrink-0 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all hover:shadow-lg hover:scale-105"
        >
          {disabled ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground hidden sm:block px-1">
        Enter para enviar · Shift+Enter para nova linha
      </p>
    </form>
  );
};
