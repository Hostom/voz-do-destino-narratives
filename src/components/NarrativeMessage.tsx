import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface NarrativeMessageProps {
  role: "user" | "assistant";
  content: string;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const NarrativeMessage = ({ role, content, onSpeak, isSpeaking }: NarrativeMessageProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const { toast } = useToast();
  
  const COOLDOWN_MS = 3000; // 3 second cooldown between requests

  const handleSpeak = async () => {
    if (isSpeaking || isLoadingAudio) {
      onSpeak?.(content);
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
      toast({
        title: "Aguarde",
        description: `Aguarde ${remainingSeconds} segundos antes de solicitar outra narração.`,
      });
      return;
    }

    setIsLoadingAudio(true);
    setLastRequestTime(now);
    
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text: content },
      });

      if (error) {
        const errorMessage = error.message || "Unknown error";
        
        if (errorMessage.includes("Rate limit")) {
          toast({
            title: "Aguarde um momento",
            description: "Muitas solicitações de narração. Tente novamente em alguns segundos.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro na narração",
            description: "Não foi possível gerar o áudio. Tente novamente.",
            variant: "destructive",
          });
        }
        throw error;
      }

      const audio = new Audio(`data:audio/mpeg;base64,${data.audioContent}`);
      
      audio.onplay = () => {
        onSpeak?.(content);
      };
      
      audio.onended = () => {
        onSpeak?.("");
      };
      
      audio.onerror = () => {
        console.error("Error playing audio");
        onSpeak?.("");
        toast({
          title: "Erro ao reproduzir",
          description: "Não foi possível reproduzir o áudio.",
          variant: "destructive",
        });
      };

      await audio.play();
    } catch (error) {
      console.error("Error generating speech:", error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

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

        {role === "assistant" && onSpeak && isHovered && content && (
          <Button
            onClick={handleSpeak}
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity"
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSpeaking ? (
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
