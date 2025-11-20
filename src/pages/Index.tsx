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
import { BookOpen, Scroll, MessageSquare, Dices } from "lucide-react";
import { RoomChat } from "@/components/RoomChat";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCollection } from "@/hooks/useCollection";

interface GMMessage {
  id: string;
  player_id: string;
  sender: "player" | "GM";
  content?: string;
  message?: string;
  character_name: string;
  created_at: string;
  type: "gm";
}

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { character, loading: characterLoading, createCharacter, getCharacterSummary, loadAllCharacters, selectCharacter } = useCharacter();
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [showCreation, setShowCreation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<number | null>(null);
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'lobby' | 'combat' | 'game'>('menu');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { room, players, loading: roomLoading, createRoom, joinRoom, leaveRoom, toggleReady, rollInitiative, advanceTurn, endCombat, startSession, refreshPlayers } = useRoom();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Use gm_messages as single source of truth for all players
  // useCollection will handle empty roomId gracefully
  const { data: gmMessages, loading: messagesLoading } = useCollection<GMMessage>("gm_messages", {
    filters: room?.id ? { room_id: room.id } : undefined,
    orderBy: "created_at",
    ascending: true,
  });

  // Debug: Log when gmMessages change
  useEffect(() => {
    if (gmMessages.length > 0) {
      console.log('gmMessages updated:', gmMessages.length, 'messages');
      const lastMessage = gmMessages[gmMessages.length - 1];
      console.log('Last message:', {
        sender: lastMessage.sender,
        character_name: lastMessage.character_name,
        content_preview: lastMessage.content.substring(0, 50) + '...'
      });
    }
  }, [gmMessages]);

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

  // Initialize welcome message when character is ready and room is active
  useEffect(() => {
    if (character && room && room.session_active && view === 'game' && gmMessages.length === 0 && !messagesLoading) {
      // Create AI-generated welcome message that has access to all character sheets
      const createWelcomeMessage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !room) return;

        console.log('Creating AI welcome message with character context...');
        setIsLoading(true);

        // Call game-master to generate welcome with character context
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          
          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
          }

          const { data: { session } } = await supabase.auth.getSession();
          const authToken = session?.access_token;

          // Get character summary with items
          const characterSheet = await getCharacterSummary();

          // Call AI to generate welcome with full character context
          // The character sheet is sent as context, not saved as a message
          const response = await fetch(`${supabaseUrl}/functions/v1/game-master`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken || supabaseAnonKey}`,
              'apikey': supabaseAnonKey,
            },
            body: JSON.stringify({
              messages: [{ 
                role: 'user', 
                content: `[INÍCIO DA SESSÃO]\n\nFicha do Personagem:\n${characterSheet}\n\nApresente-se como "Voz do Destino" e dê as boas-vindas ao jogador. Inicie a aventura criando uma cena introdutória envolvente baseada no personagem e sua história.` 
              }],
              roomId: room.id,
              characterName: character.name,
              characterId: character.id,
              isSessionStart: true, // Flag to indicate this is session start
            }),
          });

          if (response.ok) {
            // Consume the stream
            const reader = response.body?.getReader();
            if (reader) {
              while (true) {
                const { done } = await reader.read();
                if (done) break;
              }
            }
            console.log('AI welcome message generated successfully');
          }
        } catch (error) {
          console.error('Error generating welcome message:', error);
        } finally {
          setIsLoading(false);
        }
      };

      createWelcomeMessage();
    }
  }, [character, room, view, gmMessages.length, messagesLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gmMessages]);

  // CRITICAL: This function handles ONLY GM chat (narrative with AI)
  // It saves to gm_messages ONLY and triggers game-master
  // DO NOT use this for group chat messages
  const handleSend = async (message: string) => {
    if (!room || !character) {
      toast({
        title: "Erro",
        description: "Você precisa estar em uma sala com um personagem selecionado",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar autenticado para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // CRITICAL: Save player message ONLY to gm_messages (NOT room_chat_messages)
      // This is for narrative interaction with the AI Game Master
      const { error: insertError } = await supabase.from("gm_messages" as any).insert({
        room_id: room.id,
        player_id: user.id,
        sender: "player",
        character_name: character.name,
        content: message.trim(),
        type: "gm",
      } as any);

      if (insertError) {
        console.error("Error saving player message to gm_messages:", insertError);
        toast({
          title: "Erro",
          description: "Não foi possível enviar a mensagem",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Trigger game-master function
      // The server will save the GM response ONLY to gm_messages (NOT room_chat_messages)
      console.log('Calling game-master function with:', {
        roomId: room.id,
        characterName: character.name,
        message: message.trim()
      });
      
      try {
        // The function returns a stream (SSE), we need to consume it to ensure it completes
        // The server will save the response to gm_messages when the stream completes
        console.log('Invoking game-master function...');
        
        // Get the Supabase URL and anon key from environment
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Supabase configuration missing');
        }

        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token;

        // Call the function using fetch directly for better stream handling
        const response = await fetch(`${supabaseUrl}/functions/v1/game-master`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken || supabaseAnonKey}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: message.trim() }],
            roomId: room.id,
            characterName: character.name,
            characterId: character.id, // Pass character ID for tool calls
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error calling game master:', response.status, errorText);
          toast({
            title: "Erro",
            description: `Falha ao chamar a IA: ${response.status}`,
            variant: "destructive",
          });
          setIsLoading(false);
        } else {
          console.log('Game-master function invoked successfully. Response will appear in gm_messages via real-time.');
          
          // Consume the stream to ensure it completes
          const reader = response.body?.getReader();
          if (reader) {
            const decoder = new TextDecoder();
            let buffer = '';
            
            // Consume the stream to ensure it completes
            (async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) {
                    console.log('Stream consumed completely');
                    // Give the server a moment to save the response
                    await new Promise(resolve => setTimeout(resolve, 500));
                    break;
                  }
                  
                  // Decode and process the stream properly
                  buffer += decoder.decode(value, { stream: true });
                  
                  // Process complete lines (SSE format)
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || ''; // Keep incomplete line in buffer
                  
                  // Process each line to ensure proper SSE parsing
                  for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                      // Stream is being processed correctly
                    }
                  }
                }
              } catch (streamError) {
                console.error('Error consuming stream:', streamError);
              }
            })();
          } else {
            console.warn('No response body/stream received');
          }
          // Don't set loading to false here - wait for real-time update
        }
      } catch (invokeError: any) {
        console.error('Exception calling game master:', invokeError);
        toast({
          title: "Erro",
          description: invokeError?.message || "Falha ao obter resposta da IA",
          variant: "destructive",
        });
        setIsLoading(false);
      }

      // Don't set loading to false immediately - wait for the AI response
      // The loading will be cleared when we detect a new GM message in gmMessages
    } catch (error) {
      console.error('Error in handleSend (GM chat):', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Clear loading state when we receive a GM response
  useEffect(() => {
    if (isLoading && gmMessages.length > 0) {
      const lastMessage = gmMessages[gmMessages.length - 1];
      if (lastMessage.sender === "GM") {
        console.log('GM response received, clearing loading state');
        setIsLoading(false);
      }
    }
  }, [gmMessages, isLoading]);

  // Safety timeout: clear loading after 30 seconds if no response
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout - no GM response received after 30 seconds');
        setIsLoading(false);
        toast({
          title: "Timeout",
          description: "A resposta da IA está demorando. Verifique se a função está funcionando.",
          variant: "destructive",
        });
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

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

  const handleBackToLobby = async () => {
    if (room?.session_active) {
      // End session when going back to lobby
      const { error } = await supabase
        .from('rooms')
        .update({ session_active: false, combat_active: false })
        .eq('id', room.id);
      
      if (error) {
        console.error('Error ending session:', error);
        toast({
          title: "Erro",
          description: "Não foi possível voltar ao lobby",
          variant: "destructive",
        });
        return;
      }
    }
    setView('lobby');
  };

  const handleStartSession = async () => {
    await startSession();
  };

  const handleRollInitiative = async () => {
    await rollInitiative();
    // A view já vai mudar para combat pelo useEffect que monitora room.combat_active
  };

  const handleEndCombat = async () => {
    await endCombat();
    // A view já vai mudar para game pelo useEffect que monitora room.combat_active
  };

  // Auto-switch views based on room state
  useEffect(() => {
    if (!room) return;

    // Switch to game view when session starts
    if (room.session_active && view === 'lobby') {
      setView('game');
      // Welcome message will be created automatically by useEffect when gmMessages is empty
    }

    // Switch to combat view when combat becomes active
    if (room.combat_active && view !== 'combat') {
      setView('combat');
    } else if (!room.combat_active && view === 'combat') {
      setView('game');
    }
  }, [room?.session_active, room?.combat_active, view]);

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
          onBackToLobby={room ? handleBackToLobby : undefined}
          roomCode={room?.room_code}
          characterId={character?.id}
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

        <div className="flex-1 flex flex-col md:flex-row gap-4 px-2 md:px-4 pb-4 overflow-hidden">
          {/* Quando há sala: Chat principal (narrativa) + Chat social + Dados */}
          {room && character ? (
            <>
          {/* Desktop: Layout com chat principal, chat social e dados */}
          {!isMobile && (
            <>
              {/* Coluna principal - Narrativa da IA */}
              <div className="flex-1 md:flex-[2] min-h-0">
                <div className="h-full flex flex-col bg-card/80 backdrop-blur border border-primary/20 rounded-lg p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Scroll className="w-5 h-5" />
                      Aventura - Narração do Mestre
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      A IA Mestre narra a história - Interaja aqui para avançar a aventura
                    </p>
                  </div>
            <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 pr-2 min-h-0">
              {messagesLoading && gmMessages.length === 0 && (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground text-sm">
                    Carregando mensagens...
                  </div>
                </div>
              )}
              {gmMessages.map((msg, idx) => (
                <NarrativeMessage
                  key={msg.id}
                  role={msg.sender === "GM" ? "assistant" : "user"}
                  content={msg.content ?? msg.message ?? ""}
                  characterName={msg.sender === "player" ? msg.character_name : undefined}
                  onSpeak={(content) => {
                    setCurrentSpeakingIndex(idx);
                  }}
                  isSpeaking={currentSpeakingIndex === idx}
                />
              ))}
              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-pulse text-muted-foreground text-sm">
                    A Voz do Destino está narrando...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
                  <div className="pt-2 md:pt-4 mt-4 border-t border-border/50">
              <ChatInput 
                onSend={handleSend} 
                disabled={isLoading}
              />
                  </div>
            </div>
          </div>

              {/* Botões flutuantes para desktop */}
              <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
                {/* Chat Social */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-14 w-14 rounded-full shadow-lg bg-primary hover:scale-110 transition-transform"
                      title="Chat Social"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[500px] h-full">
                    <div className="h-full flex flex-col">
                      <h2 className="text-xl font-semibold mb-4">Chat Social</h2>
                      <div className="flex-1 min-h-0">
                        <RoomChat 
                          roomId={room.id} 
                          characterName={character.name}
                          currentTurn={room.current_turn ?? 0}
                          initiativeOrder={(room.initiative_order as any[]) || []}
                          isGM={room.gm_id === user?.id}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Inventário */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-14 w-14 rounded-full shadow-lg bg-accent hover:scale-110 transition-transform"
                      title="Inventário"
                    >
                      <BookOpen className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[500px] h-full overflow-y-auto">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Inventário</h2>
                      <div className="space-y-4">
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-3">Moedas</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Ouro</span>
                              <span className="font-bold text-yellow-500">{character.gold_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Prata</span>
                              <span className="font-bold text-gray-400">{character.silver_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Cobre</span>
                              <span className="font-bold text-orange-600">{character.copper_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Platina</span>
                              <span className="font-bold text-blue-400">{character.platinum_pieces || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-2">Equipamento</h3>
                          <p className="text-sm text-muted-foreground">
                            Sistema de itens em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Ficha do Personagem */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-14 w-14 rounded-full shadow-lg bg-secondary hover:scale-110 transition-transform"
                      title="Ficha do Personagem"
                    >
                      <Scroll className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[500px] h-full overflow-y-auto">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Ficha do Personagem</h2>
                      
                      <div className="space-y-4">
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold">{character.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {character.race} {character.class}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Nível</p>
                              <p className="text-xl font-bold">{character.level}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded bg-background">
                              <p className="text-xs text-muted-foreground mb-1">Pontos de Vida</p>
                              <p className="text-lg font-bold text-destructive">
                                {character.current_hp} / {character.max_hp}
                              </p>
                            </div>
                            <div className="p-3 rounded bg-background">
                              <p className="text-xs text-muted-foreground mb-1">Classe de Armadura</p>
                              <p className="text-lg font-bold">{character.armor_class}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-3">Atributos</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Força</span>
                              <span className="font-bold">{character.strength}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Destreza</span>
                              <span className="font-bold">{character.dexterity}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Constituição</span>
                              <span className="font-bold">{character.constitution}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Inteligência</span>
                              <span className="font-bold">{character.intelligence}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Sabedoria</span>
                              <span className="font-bold">{character.wisdom}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Carisma</span>
                              <span className="font-bold">{character.charisma}</span>
                            </div>
                          </div>
                        </div>

                        {character.backstory && (
                          <div className="bg-card/50 rounded-lg p-4 border border-border">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <Scroll className="w-4 h-4" />
                              História
                            </h3>
                            <p className="text-sm leading-relaxed">{character.backstory}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Dados */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-14 w-14 rounded-full shadow-lg bg-primary/80 hover:scale-110 transition-transform"
                      title="Rolar Dados"
                    >
                      <Dices className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[400px] h-full">
                    <div className="h-full">
                      <h2 className="text-xl font-semibold mb-4">Rolar Dados</h2>
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
                  </SheetContent>
                </Sheet>
              </div>
                </>
              )}
            </>
          ) : (
            /* Quando não há sala: Chat individual */
            <div className="flex flex-col flex-1">
              <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 pr-2">
                {messagesLoading && gmMessages.length === 0 && (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground text-sm">
                      Carregando mensagens...
                    </div>
                  </div>
                )}
                {gmMessages.map((msg, idx) => (
                  <NarrativeMessage
                    key={msg.id}
                    role={msg.sender === "GM" ? "assistant" : "user"}
                    content={msg.content ?? msg.message ?? ""}
                    characterName={msg.sender === "player" ? msg.character_name : undefined}
                    onSpeak={(content) => {
                      setCurrentSpeakingIndex(idx);
                    }}
                    isSpeaking={currentSpeakingIndex === idx}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-center">
                    <div className="animate-pulse text-muted-foreground text-sm">
                      A Voz do Destino está narrando...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="pt-2 md:pt-4">
                <ChatInput 
                  onSend={handleSend} 
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Mobile: Chat principal (narrativa) + Botão para chat social */}
          {room && character && isMobile && (
            <>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="mb-3 px-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Scroll className="w-5 h-5" />
                    Aventura - Narração do Mestre
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    A IA Mestre narra a história - Interaja aqui para avançar a aventura
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 md:space-y-4 px-2 min-h-0">
                  {messagesLoading && gmMessages.length === 0 && (
                    <div className="flex justify-center py-8">
                      <div className="text-muted-foreground text-sm">
                        Carregando mensagens...
                      </div>
                    </div>
                  )}
                  {gmMessages.map((msg, idx) => (
                    <NarrativeMessage
                      key={msg.id}
                      role={msg.sender === "GM" ? "assistant" : "user"}
                      content={msg.content ?? msg.message ?? ""}
                      characterName={msg.sender === "player" ? msg.character_name : undefined}
                      onSpeak={(content) => {
                        setCurrentSpeakingIndex(idx);
                      }}
                      isSpeaking={currentSpeakingIndex === idx}
                    />
                  ))}
                  {isLoading && (
                    <div className="flex justify-center">
                      <div className="animate-pulse text-muted-foreground text-sm">
                        A Voz do Destino está narrando...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="pt-2 md:pt-4 mt-4 border-t border-border/50 px-2">
                  <ChatInput 
                    onSend={handleSend} 
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              {/* Botões flutuantes para mobile */}
              <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-3">
                {/* Chat Social */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-12 w-12 rounded-full shadow-lg bg-primary hover:scale-110 transition-transform"
                      title="Chat Social"
                    >
                      <MessageSquare className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
                    <div className="h-full flex flex-col">
                      <h2 className="text-xl font-semibold mb-4">Chat Social</h2>
                      <div className="flex-1 min-h-0">
                        <RoomChat 
                          roomId={room.id} 
                          characterName={character.name}
                          currentTurn={room.current_turn ?? 0}
                          initiativeOrder={(room.initiative_order as any[]) || []}
                          isGM={room.gm_id === user?.id}
                        />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Inventário */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-12 w-12 rounded-full shadow-lg bg-accent hover:scale-110 transition-transform"
                      title="Inventário"
                    >
                      <BookOpen className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-xl overflow-y-auto">
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold">Inventário</h2>
                      <div className="space-y-4">
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-3">Moedas</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Ouro</span>
                              <span className="font-bold text-yellow-500">{character.gold_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Prata</span>
                              <span className="font-bold text-gray-400">{character.silver_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Cobre</span>
                              <span className="font-bold text-orange-600">{character.copper_pieces || 0}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Platina</span>
                              <span className="font-bold text-blue-400">{character.platinum_pieces || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-2">Equipamento</h3>
                          <p className="text-sm text-muted-foreground">
                            Sistema de itens em desenvolvimento
                          </p>
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Ficha do Personagem */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-12 w-12 rounded-full shadow-lg bg-secondary hover:scale-110 transition-transform"
                      title="Ficha"
                    >
                      <Scroll className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-xl overflow-y-auto">
                    <div className="space-y-6 pb-6">
                      <h2 className="text-xl font-semibold">Ficha do Personagem</h2>
                      
                      <div className="space-y-4">
                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold">{character.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {character.race} {character.class}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Nível</p>
                              <p className="text-xl font-bold">{character.level}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="p-3 rounded bg-background">
                              <p className="text-xs text-muted-foreground mb-1">Pontos de Vida</p>
                              <p className="text-lg font-bold text-destructive">
                                {character.current_hp} / {character.max_hp}
                              </p>
                            </div>
                            <div className="p-3 rounded bg-background">
                              <p className="text-xs text-muted-foreground mb-1">Classe de Armadura</p>
                              <p className="text-lg font-bold">{character.armor_class}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-card/50 rounded-lg p-4 border border-border">
                          <h3 className="font-semibold mb-3">Atributos</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Força</span>
                              <span className="font-bold">{character.strength}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Destreza</span>
                              <span className="font-bold">{character.dexterity}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Constituição</span>
                              <span className="font-bold">{character.constitution}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Inteligência</span>
                              <span className="font-bold">{character.intelligence}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Sabedoria</span>
                              <span className="font-bold">{character.wisdom}</span>
                            </div>
                            <div className="flex justify-between p-2 rounded bg-background">
                              <span className="text-sm">Carisma</span>
                              <span className="font-bold">{character.charisma}</span>
                            </div>
                          </div>
                        </div>

                        {character.backstory && (
                          <div className="bg-card/50 rounded-lg p-4 border border-border">
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                              <Scroll className="w-4 h-4" />
                              História
                            </h3>
                            <p className="text-sm leading-relaxed">{character.backstory}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Dados */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      size="icon" 
                      className="h-12 w-12 rounded-full shadow-lg bg-primary/80 hover:scale-110 transition-transform"
                      title="Rolar Dados"
                    >
                      <Dices className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
                    <div className="h-full flex flex-col">
                      <h2 className="text-xl font-semibold mb-4">Rolar Dados</h2>
                      <div className="flex-1 overflow-y-auto">
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
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
