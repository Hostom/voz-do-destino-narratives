import { useState, useRef, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { NarrativeMessage } from "@/components/NarrativeMessage";
import { ChatInput } from "@/components/ChatInput";
import { CharacterCreation } from "@/components/CharacterCreation";
import { CharacterSelect } from "@/components/CharacterSelect";
import { DicePanel } from "@/components/DicePanel";
import { Auth } from "@/components/Auth";
import { useCharacter } from "@/hooks/useCharacter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BookOpen, Scroll } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { character, loading: characterLoading, createCharacter, getCharacterSummary, loadAllCharacters, selectCharacter } = useCharacter();
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageContent, setSpeakingMessageContent] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check auth status
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load all characters when user is authenticated and no character is selected
  useEffect(() => {
    if (user && !character && !characterLoading) {
      loadCharactersData();
    }
  }, [user, character, characterLoading]);

  const loadCharactersData = async () => {
    const chars = await loadAllCharacters();
    setAllCharacters(chars);
    if (chars.length > 0) {
      setShowCharacterSelect(true);
    } else {
      setShowCharacterCreation(true);
    }
  };

  // Initialize welcome message when character is ready
  useEffect(() => {
    if (character && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `Bem-vindo, ${character.name}!

Eu sou a Voz do Destino, seu mestre de jogo. Vejo que você é ${character.race === "human" ? "um humano" : `${character.race}`} ${character.class}.

Sua jornada começa agora. Que tipo de aventura deseja viver?

• Uma jornada de fantasia medieval repleta de magia e dragões?
• Um mistério sombrio em uma cidade steampunk?
• Uma exploração espacial em galáxias desconhecidas?
• Ou prefere que eu crie algo único para você?

Diga-me, e deixe o destino se desenrolar...`,
      }]);
    }
  }, [character]);

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
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-master`;
      
      // Include character info in the context
      const systemContext = character ? `\n\nFICHA DO PERSONAGEM:\n${getCharacterSummary()}` : "";
      const contextualMessages = messages.length === 0 && character
        ? [{ role: "system" as const, content: `Você é o mestre de jogo. ${systemContext}` }, userMessage]
        : [...messages, userMessage];
      
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: contextualMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to connect to Game Master");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      // Add empty assistant message that will be updated
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === "assistant") {
                  newMessages[newMessages.length - 1] = { role: "assistant", content: assistantContent };
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível conectar com o Mestre. Tente novamente.",
        variant: "destructive",
      });
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.content !== ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterComplete = async (characterData: any) => {
    await createCharacter(characterData);
    setShowCharacterCreation(false);
    setShowCharacterSelect(false);
  };

  const handleCharacterSelect = (selectedCharacter: any) => {
    selectCharacter(selectedCharacter);
    setShowCharacterSelect(false);
    setShowCharacterCreation(false);
  };

  const handleCreateNew = () => {
    setShowCharacterSelect(false);
    setShowCharacterCreation(true);
  };

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show auth if not authenticated
  if (!user) {
    return <Auth />;
  }

  // Show character selection screen
  if (showCharacterSelect && allCharacters.length > 0) {
    return (
      <CharacterSelect
        characters={allCharacters}
        onSelect={handleCharacterSelect}
        onCreateNew={handleCreateNew}
        onCharactersUpdate={loadCharactersData}
      />
    );
  }

  // Show character creation if no character exists or creating new
  if (!character || showCharacterCreation) {
    return <CharacterCreation onComplete={handleCharacterComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-glow opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <GameHeader />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl flex flex-col">
        {/* Character Sheet Button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharacterSheet(!showCharacterSheet)}
            className="gap-2"
          >
            <Scroll className="h-4 w-4" />
            {showCharacterSheet ? "Ocultar" : "Ver"} Ficha
          </Button>
        </div>

        {/* Character Sheet Display */}
        {showCharacterSheet && (
          <div className="mb-4 p-4 bg-card border border-primary/20 rounded-lg animate-in slide-in-from-top">
            <pre className="text-xs whitespace-pre-wrap text-foreground">{getCharacterSummary()}</pre>
          </div>
        )}

        <div className="flex-1 space-y-6 mb-6 overflow-y-auto">
          {messages.map((message, index) => (
            <NarrativeMessage
              key={index}
              role={message.role}
              content={message.content}
              onSpeak={(text) => setSpeakingMessageContent(text)}
              isSpeaking={speakingMessageContent === message.content}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="space-y-3">
          <ChatInput
            onSend={handleSend}
            onRoll={(result) => {
              toast({
                title: "Dado rolado!",
                description: `Você rolou ${result} no d20`,
              });
            }}
            disabled={isLoading || !!speakingMessageContent}
          />
          
          <DicePanel />
        </div>
      </main>
    </div>
  );
};

export default Index;
