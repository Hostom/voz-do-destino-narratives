import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  
  const COOLDOWN_MS = 70000; // 70 second cooldown to respect OpenAI free tier rate limits

  const handleSpeak = async () => {
    if (isSpeaking || isLoadingAudio) {
      onSpeak?.(content);
      return;
    }

    // Check cooldown - strict throttling to respect API limits
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastRequest) / 1000);
      toast({
        title: "Narração temporariamente indisponível",
        description: `Para respeitar os limites da API, aguarde ${remainingSeconds} segundos antes de solicitar outra narração por voz.`,
        variant: "destructive",
      });
      console.log(`[TTS Throttle] Blocked request. ${remainingSeconds}s remaining in cooldown.`);
      return;
    }

    console.log('[TTS] Starting audio generation request...');

    setIsLoadingAudio(true);
    setLastRequestTime(now);
    
    console.log('[TTS] Cooldown timer started. Next narration available in 70 seconds.');
    
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text: content },
      });

      if (error) {
        console.error("TTS Error:", error);
        const errorMessage = typeof error === 'string' ? error : error.message || "Unknown error";
        
        if (errorMessage.includes("rate limit") || errorMessage.includes("Rate limit")) {
          toast({
            title: "Limite da API atingido",
            description: "Você atingiu o limite de narrações. O plano gratuito da OpenAI permite poucas requisições. Aguarde 70 segundos.",
            variant: "destructive",
          });
          console.error('[TTS] OpenAI rate limit hit:', errorMessage);
        } else {
          toast({
            title: "Erro na narração",
            description: "Não foi possível gerar o áudio. A narração textual continua disponível.",
            variant: "destructive",
          });
          console.error('[TTS] Error:', errorMessage);
        }
        throw error;
      }

      if (!data?.audioContent) {
        throw new Error("No audio content received");
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
      console.log('[TTS] Audio playback started successfully.');
    } catch (error) {
      console.error("[TTS] Error generating speech:", error);
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
            title="Clique para ouvir esta narração (limitado a 1 vez por minuto)"
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
