import { useState, useRef, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { NarrativeMessage } from "@/components/NarrativeMessage";
import { ChatInput } from "@/components/ChatInput";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Bem-vindo, viajante.

Eu sou a Voz do Destino, seu mestre de jogo. Juntos, criaremos uma história épica onde cada escolha molda o mundo ao seu redor.

Antes de começarmos, me conte: que tipo de aventura deseja viver?

• Uma jornada de fantasia medieval repleta de magia e dragões?
• Um mistério sombrio em uma cidade steampunk?
• Uma exploração espacial em galáxias desconhecidas?
• Ou prefere que eu crie algo único para você?

Diga-me, e deixe o destino se desenrolar...`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (message: string) => {
    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // TODO: Integrate with Lovable AI
      // For now, simulate a response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const aiResponse: Message = {
        role: "assistant",
        content: `Sua escolha ressoa através das névoas do destino...

*Os dados do universo rolam em silêncio*

Esta será uma jornada memorável. Deixe-me começar a tecer sua história...

(Nota: A integração com IA será implementada em breve para narrativas completas e dinâmicas)`,
      };

      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível conectar com o Mestre. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoll = (result: number) => {
    const rollMessage: Message = {
      role: "user",
      content: `🎲 Rolou ${result} no d20`,
    };
    setMessages((prev) => [...prev, rollMessage]);

    toast({
      title: "Dados lançados!",
      description: `Você rolou ${result}`,
    });
  };

  const handleSpeak = (text: string) => {
    // TODO: Integrate with ElevenLabs TTS
    toast({
      title: "TTS em desenvolvimento",
      description: "A narração por voz será implementada em breve",
    });
  };

  const startNewAdventure = () => {
    setMessages([
      {
        role: "assistant",
        content: `O destino te chama novamente, viajante.

Uma nova história aguarda para ser escrita. Que tipo de aventura deseja embarcar desta vez?`,
      },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <GameHeader />

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-6 py-8">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
                  <BookOpen className="h-16 w-16 mx-auto text-primary animate-pulse-slow" />
                  <h2 className="text-2xl font-cinzel text-foreground">
                    Aguardando sua primeira escolha...
                  </h2>
                  <p className="text-muted-foreground">
                    A história começa quando você der o primeiro passo
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <NarrativeMessage
                    key={idx}
                    role={msg.role}
                    content={msg.content}
                    onSpeak={msg.role === "assistant" ? handleSpeak : undefined}
                    isSpeaking={isSpeaking}
                  />
                ))}
                {messages.length > 4 && (
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={startNewAdventure}
                      variant="outline"
                      className="border-accent/50 hover:border-accent"
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Nova Aventura
                    </Button>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <ChatInput onSend={handleSend} onRoll={handleRoll} disabled={isLoading} />
      </main>
    </div>
  );
};

export default Index;
