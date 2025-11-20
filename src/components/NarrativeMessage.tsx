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
      className={`mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
        role === "assistant" ? "pr-12" : "pl-12"
      }`}
    >
      <div className="relative">
        <div
          className={`relative p-6 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-300 ${
            role === "user"
              ? "bg-primary/10 border border-primary/20 ml-auto max-w-[85%]"
              : "bg-card/80 border border-border/50 mr-auto max-w-[90%]"
          }`}
        >
          <div className="flex items-start gap-3">
            {role === "assistant" && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <span className="text-primary font-bold text-lg">🎲</span>
              </div>
            )}
            {role === "user" && characterName && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border">
                <span className="text-foreground font-semibold text-sm">
                  {characterName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              {role === "user" && characterName && (
                <div className="mb-1 text-xs font-semibold text-muted-foreground">
                  {characterName}
                </div>
              )}
              <p className="text-foreground leading-relaxed whitespace-pre-wrap text-base">
                {content}
              </p>
            </div>
          </div>
        </div>

        {/* Botão de narração visível apenas para mensagens do assistente */}
        {role === "assistant" && (
          <div className="mt-3 flex justify-start">
            <Button
              onClick={handleSpeak}
              variant="outline"
              size="sm"
              disabled={isLoadingAudio}
              className="gap-2 text-sm"
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando áudio...
                </>
              ) : isSpeaking ? (
                <>
                  <VolumeX className="h-4 w-4" />
                  Pausar Narração
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4" />
                  🔊 Ouvir Narração
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
