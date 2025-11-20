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
  characterName?: string;
}

export const NarrativeMessage = ({ role, content, onSpeak, isSpeaking, characterName }: NarrativeMessageProps) => {
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
      className={`mb-3 md:mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        role === "assistant" ? "pr-2 md:pr-12" : "pl-2 md:pl-12"
      }`}
    >
      <div 
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setTimeout(() => setIsHovered(false), 2000)}
      >
        <div
          className={`relative p-3 md:p-6 rounded-xl md:rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 active:scale-[0.98] md:active:scale-100 ${
            role === "user"
              ? "bg-primary/10 border border-primary/20 ml-auto max-w-[95%] md:max-w-[85%]"
              : "bg-card/80 border border-border/50 mr-auto max-w-[95%] md:max-w-[90%]"
          }`}
        >
          <div className="flex items-start gap-2 md:gap-3">
            {role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="text-primary font-bold text-base md:text-lg">🎲</span>
              </div>
            )}
            {role === "user" && characterName && (
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
                <span className="text-foreground font-semibold text-xs md:text-sm">
                  {characterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              {role === "user" && characterName && (
                <div className="mb-1 text-xs font-semibold text-muted-foreground truncate">
                  {characterName}
                </div>
              )}
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-sm md:text-base break-words">
                {content}
              </p>
            </div>
          </div>
        </div>

        {/* Botão de narração visível apenas para mensagens do assistente */}
        {role === "assistant" && (
          <div className="mt-2 md:mt-3 flex justify-start">
            <Button
              onClick={handleSpeak}
              variant="outline"
              size="sm"
              disabled={isLoadingAudio}
              className="gap-1.5 md:gap-2 text-xs md:text-sm h-8 md:h-9 px-2 md:px-3 touch-manipulation"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                  <span className="hidden sm:inline">Gerando áudio...</span>
                  <span className="sm:hidden">Gerando...</span>
                </>
              ) : isSpeaking ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Pausar Narração</span>
                  <span className="sm:hidden">Pausar</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">🔊 Ouvir Narração</span>
                  <span className="sm:hidden">🔊 Ouvir</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
