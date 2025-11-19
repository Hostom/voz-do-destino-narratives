import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/components/Auth";
import { CharacterCreation } from "@/components/CharacterCreation";
import { CharacterSelect } from "@/components/CharacterSelect";
import { GameHeader } from "@/components/GameHeader";
import { ChatInput } from "@/components/ChatInput";
import { DicePanel } from "@/components/DicePanel";
import { NarrativeMessage } from "@/components/NarrativeMessage";
import { CreateRoom } from "@/components/CreateRoom";
import { JoinRoom } from "@/components/JoinRoom";
import { RoomLobby } from "@/components/RoomLobby";
import { CombatView } from "@/components/CombatView";
import { useCharacter, Character } from "@/hooks/useCharacter";
import { useRoom } from "@/hooks/useRoom";
import { Button } from "@/components/ui/button";
import { BookOpen, Scroll } from "lucide-react";
import { RoomChat } from "@/components/RoomChat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { character, loading: characterLoading, createCharacter, getCharacterSummary, loadAllCharacters, selectCharacter } = useCharacter();
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [showCreation, setShowCreation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'combat' | 'game'>('menu');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { room, players, loading: roomLoading, createRoom, joinRoom, leaveRoom, toggleReady, rollInitiative, advanceTurn, endCombat, refreshPlayers } = useRoom();
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

  // Load all characters when user is authenticated
  useEffect(() => {
    if (user && !character && !characterLoading) {
      loadCharactersData();
    }
  }, [user, character, characterLoading]);

  const loadCharactersData = async () => {
    const chars = await loadAllCharacters();
    setAllCharacters(chars);
    if (chars.length > 0) {
      setShowCharacterSelection(true);
    } else {
      setShowCreation(true);
    }
  };

  // Initialize welcome message when character is ready
  useEffect(() => {
    if (character && messages.length === 0 && view === 'game') {
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
  }, [character, view]);

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
      
      // Identificar o jogador atual
      const currentPlayer = character ? players.find(p => p.character_id === character.id) : null;
      const currentPlayerId = currentPlayer?.id || "";
      const currentPlayerName = character?.name || "Jogador Desconhecido";
      
      // Contexto do personagem atual (quem está enviando a mensagem)
      const systemContext = character ? `\n\nJOGADOR ATIVO: ${currentPlayerName} (ID: ${currentPlayerId})\nFICHA DO JOGADOR ATIVO:\n${getCharacterSummary()}` : "";
      
      // Adicionar fichas completas de TODOS os jogadores na sala
      let roomContext = "";
      if (room && players.length > 0) {
        roomContext = `\n\n🎮 SISTEMA MULTIPLAYER - ${players.length} JOGADOR(ES) NA SALA:\n`;
        roomContext += `📍 Sala ID: ${room.id}\n`;
        roomContext += `📍 Código da Sala: ${room.room_code}\n\n`;
        
        roomContext += `⚠️ REGRAS CRÍTICAS DE ISOLAMENTO:\n`;
        roomContext += `- NUNCA misture atributos entre jogadores\n`;
        roomContext += `- SEMPRE use a ficha do jogador correto ao narrar ações\n`;
        roomContext += `- Cada ficha pertence SOMENTE ao seu jogador (identificado por ID único)\n`;
        roomContext += `- Quando um jogador perguntar "meus atributos" ou "minha ficha", use APENAS a ficha dele\n\n`;
        
        roomContext += `═══════════════════════════════════════\n`;
        roomContext += `📋 FICHAS COMPLETAS DE TODOS OS JOGADORES:\n`;
        roomContext += `═══════════════════════════════════════\n\n`;
        
        players.forEach((player, index) => {
          const char = player.characters;
          if (char) {
            const isActivePlayer = player.id === currentPlayerId;
            roomContext += `${isActivePlayer ? "👉 " : ""}JOGADOR ${index + 1}${isActivePlayer ? " (ATIVO - ENVIOU ESTA MENSAGEM)" : ""}:\n`;
            roomContext += `🆔 Player ID: ${player.id}\n`;
            roomContext += `🆔 Character ID: ${char.id}\n`;
            roomContext += `👤 Nome: ${char.name}\n`;
            roomContext += `🧬 Raça: ${char.race}\n`;
            roomContext += `⚔️ Classe: ${char.class}\n`;
            roomContext += `📊 Nível: ${char.level}\n`;
            roomContext += `❤️ HP: ${char.current_hp}/${char.max_hp}\n`;
            roomContext += `🛡️ CA (Armor Class): ${char.armor_class}\n`;
            roomContext += `🎲 Bônus de Proficiência: +${char.proficiency_bonus}\n\n`;
            
            roomContext += `📊 ATRIBUTOS:\n`;
            roomContext += `- Força (STR): ${char.strength} (mod: ${Math.floor((char.strength - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.strength - 10) / 2)})\n`;
            roomContext += `- Destreza (DEX): ${char.dexterity} (mod: ${Math.floor((char.dexterity - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.dexterity - 10) / 2)})\n`;
            roomContext += `- Constituição (CON): ${char.constitution} (mod: ${Math.floor((char.constitution - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.constitution - 10) / 2)})\n`;
            roomContext += `- Inteligência (INT): ${char.intelligence} (mod: ${Math.floor((char.intelligence - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.intelligence - 10) / 2)})\n`;
            roomContext += `- Sabedoria (WIS): ${char.wisdom} (mod: ${Math.floor((char.wisdom - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.wisdom - 10) / 2)})\n`;
            roomContext += `- Carisma (CHA): ${char.charisma} (mod: ${Math.floor((char.charisma - 10) / 2) >= 0 ? '+' : ''}${Math.floor((char.charisma - 10) / 2)})\n\n`;
            
            if (char.equipped_weapon && typeof char.equipped_weapon === 'object') {
              const weapon = char.equipped_weapon as any;
              roomContext += `⚔️ ARMA EQUIPADA: ${weapon.name || 'Desconhecida'}\n`;
              roomContext += `  - Dano: ${weapon.damage_dice || '1d4'}\n`;
              roomContext += `  - Tipo: ${weapon.damage_type || 'contundente'}\n`;
              roomContext += `  - Atributo: ${weapon.ability || 'strength'}\n\n`;
            }
            
            if (char.spell_slots && typeof char.spell_slots === 'object') {
              const spellSlots = char.spell_slots as Record<string, number>;
              const hasSpells = Object.values(spellSlots).some(val => val > 0);
              if (hasSpells) {
                roomContext += `✨ ESPAÇOS DE MAGIA:\n`;
                Object.entries(spellSlots).forEach(([level, slots]) => {
                  if (slots > 0) {
                    roomContext += `  - Nível ${level}: ${slots} espaços\n`;
                  }
                });
                roomContext += `\n`;
              }
            }
            
            if (player.conditions && Array.isArray(player.conditions) && player.conditions.length > 0) {
              roomContext += `⚠️ CONDIÇÕES ATIVAS: ${player.conditions.join(', ')}\n\n`;
            }
            
            roomContext += `───────────────────────────────────────\n\n`;
          }
        });
        
        roomContext += `\n⚔️ COMBATE: Quando houver um confronto, você DEVE incluir [INICIAR_COMBATE] no início da resposta.\n\n`;
        roomContext += `🎯 INSTRUÇÕES DE NARRATIVA:\n`;
        roomContext += `1. Use a ficha do JOGADOR ATIVO ao responder perguntas pessoais\n`;
        roomContext += `2. Ao narrar ações, sempre verifique os atributos do jogador correto\n`;
        roomContext += `3. NUNCA invente ou adivinhe estatísticas\n`;
        roomContext += `4. Em cenas de grupo, use cada ficha apropriadamente\n`;
        roomContext += `5. Mantenha a coerência dos dados de cada personagem\n`;
      }
      
      const contextualMessages = messages.length === 0 && character
        ? [{ role: "system" as const, content: `Você é o mestre de jogo. ${systemContext}${roomContext}` }, userMessage]
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
        const errorData = await resp.json();
        throw new Error(errorData.error || "Failed to start stream");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

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
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Detectar se a IA quer iniciar combate
      if (assistantContent.includes("[INICIAR_COMBATE]")) {
        // Remove o marcador da mensagem
        assistantContent = assistantContent.replace("[INICIAR_COMBATE]", "").trim();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: assistantContent };
          return updated;
        });
        
        // Inicia o combate após um breve delay para o usuário ler a mensagem
        setTimeout(async () => {
          if (room) {
            await handleRollInitiative();
            toast({
              title: "Combate Iniciado!",
              description: "Rolando iniciativa para todos os participantes...",
            });
          }
        }, 2000);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar mensagem",
        variant: "destructive",
      });
      setIsLoading(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleCharacterComplete = () => {
    setShowCreation(false);
    loadCharactersData();
  };

  const handleCharacterSelect = (selectedCharacter: Character) => {
    selectCharacter(selectedCharacter);
    setShowCharacterSelection(false);
  };

  const handleCreateNew = () => {
    setShowCharacterSelection(false);
    setShowCreation(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleBackToCharacterSelect = () => {
    setShowCharacterSelection(true);
  };

  const handleCreateRoom = async () => {
    if (!character) {
      toast({
        title: "Erro",
        description: "Você precisa ter um personagem selecionado para criar uma sala",
        variant: "destructive",
      });
      return;
    }
    const newRoom = await createRoom(character.id);
    if (newRoom) {
      setView('lobby');
    }
  };

  const handleJoinRoomWithCode = async (roomCode: string, characterId: string) => {
    const joinedRoom = await joinRoom(roomCode, characterId);
    if (joinedRoom) {
      setView('lobby');
    }
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    setView('menu');
  };

  const handleStartSession = () => {
    setView('game');
    // Limpa mensagens anteriores e começa nova sessão
    setMessages([{
      role: "assistant",
      content: `Bem-vindos, aventureiros! A sessão está começando.

Todos os jogadores estão reunidos e prontos para começar. Que tipo de aventura vocês desejam embarcar?

• Uma jornada de fantasia medieval repleta de magia e dragões?
• Um mistério sombrio em uma cidade steampunk?
• Uma exploração espacial em galáxias desconhecidas?
• Ou preferem que eu crie algo único para o grupo?

Decidam juntos, e deixem o destino se desenrolar...`,
    }]);
  };

  const handleRollInitiative = async () => {
    await rollInitiative();
    // A view já vai mudar para combat pelo useEffect que monitora room.combat_active
  };

  const handleEndCombat = async () => {
    await endCombat();
    // A view já vai mudar para game pelo useEffect que monitora room.combat_active
  };

  // Auto-switch to combat view when combat becomes active or back to game when it ends
  useEffect(() => {
    if (room?.combat_active && view !== 'combat') {
      setView('combat');
    } else if (room && !room.combat_active && view === 'combat') {
      setView('game');
    }
  }, [room?.combat_active, view]);

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showCreation) {
    return (
      <CharacterCreation 
        onComplete={async (characterData) => {
          await createCharacter(characterData);
          setShowCreation(false);
          loadCharactersData();
        }}
      />
    );
  }

  if (showCharacterSelection) {
    return (
      <CharacterSelect 
        characters={allCharacters}
        onSelect={handleCharacterSelect}
        onCreateNew={handleCreateNew}
        onCharactersUpdate={loadCharactersData}
        onBack={view === 'menu' ? () => setShowCharacterSelection(false) : undefined}
      />
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Room menu
  if (view === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-4xl font-bold text-center mb-8">Voz do Destino</h1>
          <Button onClick={() => setView('create')} size="lg" className="w-full">
            Criar Sala
          </Button>
          <Button onClick={() => setView('join')} size="lg" variant="secondary" className="w-full">
            Entrar em Sala
          </Button>
          <Button onClick={() => setShowCharacterSelection(true)} size="lg" variant="outline" className="w-full">
            Trocar Personagem
          </Button>
          <Button onClick={handleLogout} size="lg" variant="ghost" className="w-full">
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'create') {
    return <CreateRoom onCreateRoom={handleCreateRoom} loading={roomLoading} onBack={() => setView('menu')} />;
  }

  if (view === 'join') {
    return <JoinRoom onJoinRoom={handleJoinRoomWithCode} loading={roomLoading} character={character} onBack={() => setView('menu')} />;
  }

  if (view === 'lobby' && room) {
    return <RoomLobby room={room} players={players} onLeave={handleLeaveRoom} onToggleReady={toggleReady} onStartSession={handleStartSession} onRefreshPlayers={refreshPlayers} />;
  }

  if (view === 'combat' && room) {
    return <CombatView room={room} players={players} onAdvanceTurn={advanceTurn} onEndCombat={handleEndCombat} />;
  }

  // Game view (original RPG interface)
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative z-10 flex flex-col h-screen">
        <GameHeader 
          onLogout={handleLogout}
          onBackToCharacterSelect={room ? undefined : handleBackToCharacterSelect}
          onBackToLobby={room ? () => setView('lobby') : undefined}
          roomCode={room?.room_code}
        />

        {showCharacterSheet && character && (
          <div className="mx-4 mb-4 p-6 bg-card/95 backdrop-blur rounded-lg border border-primary/20 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Ficha do Personagem
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="text-lg font-semibold">{character.name}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Raça</p>
                    <p className="font-semibold">{character.race}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Classe</p>
                    <p className="font-semibold">{character.class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nível</p>
                    <p className="font-semibold">{character.level}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">HP</p>
                    <p className="font-semibold">{character.current_hp}/{character.max_hp}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">AC</p>
                    <p className="font-semibold">{character.armor_class}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-semibold mb-2">Atributos</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">FOR</span>
                    <span className="font-bold">{character.strength}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">DES</span>
                    <span className="font-bold">{character.dexterity}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">CON</span>
                    <span className="font-bold">{character.constitution}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">INT</span>
                    <span className="font-bold">{character.intelligence}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">SAB</span>
                    <span className="font-bold">{character.wisdom}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-background/50">
                    <span className="text-sm">CAR</span>
                    <span className="font-bold">{character.charisma}</span>
                  </div>
                </div>
              </div>

              {character.backstory && (
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Scroll className="w-4 h-4" />
                    <p className="text-sm text-muted-foreground font-semibold">História</p>
                  </div>
                  <p className="text-sm leading-relaxed">{character.backstory}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 flex gap-4 px-4 pb-4 overflow-hidden">
          {/* Coluna principal - Narrativa */}
          <div className={`flex flex-col ${room ? 'flex-[2]' : 'flex-1'}`}>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg, idx) => (
                <NarrativeMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  onSpeak={(content) => {
                    setCurrentSpeakingIndex(idx);
                  }}
                  isSpeaking={currentSpeakingIndex === idx}
                />
              ))}
              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-pulse text-muted-foreground">
                    A Voz do Destino está narrando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="pt-4">
              <ChatInput 
                onSend={handleSend} 
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Coluna do chat do grupo e dados - só aparece se estiver em uma sala */}
          {room && character && (
            <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col gap-4">
              <div className="flex-1 min-h-0">
                <RoomChat roomId={room.id} characterName={character.name} />
              </div>
              <DicePanel 
                roomId={room.id}
                characterName={character.name}
                characterStats={{
                  strength: character.strength,
                  dexterity: character.dexterity,
                  constitution: character.constitution,
                  intelligence: character.intelligence,
                  wisdom: character.wisdom,
                  charisma: character.charisma
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
