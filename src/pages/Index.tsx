import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Auth } from "@/components/Auth";
import { CharacterCreation } from "@/components/CharacterCreation";
import { CharacterSelect } from "@/components/CharacterSelect";
import { GameHeader } from "@/components/GameHeader";
import { AtmosphereEffect } from "@/components/AtmosphereEffect";
import { ChatInput } from "@/components/ChatInput";
import { DicePanel } from "@/components/DicePanel";
import { NarrativeMessage } from "@/components/NarrativeMessage";
import { CreateRoom } from "@/components/CreateRoom";
import { JoinRoom } from "@/components/JoinRoom";
import { RoomLobby } from "@/components/RoomLobby";
import { RoomHistory } from "@/components/RoomHistory";
import { CombatView } from "@/components/CombatView";
import { useCharacter, Character } from "@/hooks/useCharacter";
import { useRoom } from "@/hooks/useRoom";
import { Button } from "@/components/ui/button";
import { BookOpen, Scroll, MessageSquare, Package, User, Store } from "lucide-react";
import { RoomChat } from "@/components/RoomChat";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InventoryPanel } from "@/components/InventoryPanel";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCollection } from "@/hooks/useCollection";
import { XPNotification } from "@/components/XPNotification";
import { ItemRewardNotification } from "@/components/ItemRewardNotification";
import { ItemTradeNotifications } from "@/components/ItemTradeNotifications";
import { CraftingPanel } from "@/components/CraftingPanel";
import { AuctionPanel } from "@/components/AuctionPanel";
import { ShopPanel } from "@/components/shop/ShopPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InteractiveObjectsPanel } from "@/components/InteractiveObjectsPanel";
import { MobileGameView } from "@/components/mobile/MobileGameView";

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
  const { character, loading: characterLoading, createCharacter, loadAllCharacters, selectCharacter } = useCharacter();
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [showCreation, setShowCreation] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'menu' | 'create' | 'join' | 'history' | 'lobby' | 'combat' | 'game'>('menu');
  const [isGM, setIsGM] = useState(false);
  const [isReturningToGame, setIsReturningToGame] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { room, players, loading: roomLoading, createRoom, joinRoom, leaveRoom, toggleReady, rollInitiative, advanceTurn, endCombat, startSession, refreshPlayers, reconnectToRoom } = useRoom();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [auctionsActive, setAuctionsActive] = useState(false);

  const { data: gmMessages, loading: messagesLoading } = useCollection<GMMessage>("gm_messages", {
    filters: room?.id ? { room_id: room.id } : undefined,
    orderBy: "created_at",
    ascending: true,
    limit: 50, // Performance: limit DOM elements
  });

  useEffect(() => {
    const checkGMStatus = async () => {
      if (!room) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsGM(user.id === room.gm_id);
      }
    };
    checkGMStatus();
  }, [room?.gm_id]);

  useEffect(() => {
    if (!room) {
      setAuctionsActive(false);
      return;
    }

    const loadAuctionStatus = async () => {
      const { data, count } = await supabase
        .from("merchant_auctions")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id)
        .eq("status", "active");

      setAuctionsActive((count || 0) > 0);
    };

    loadAuctionStatus();

    const channel = supabase
      .channel(`auctions-status-index-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_auctions',
          filter: `room_id=eq.${room.id}`
        },
        () => loadAuctionStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

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

  useEffect(() => {
    if (!user || !room) return;
    const roomInfo = {
      roomId: room.id,
      roomCode: room.room_code,
      sessionActive: room.session_active,
      combatActive: room.combat_active,
      timestamp: Date.now()
    };
    localStorage.setItem('activeRoomSession', JSON.stringify(roomInfo));
  }, [user, room]);

  useEffect(() => {
    if (!user || room || authLoading || characterLoading) return;
    const savedRoom = localStorage.getItem('activeRoomSession');
    if (savedRoom) {
      const parsed = JSON.parse(savedRoom);
      const hoursSinceLastSession = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
      if (hoursSinceLastSession < 24) {
        const attemptReconnect = async () => {
          const roomData = await reconnectToRoom(parsed.roomId);
          if (roomData) {
            if (roomData.combat_active) setView('combat');
            else if (roomData.session_active) setView('game');
            else setView('lobby');
          } else {
            localStorage.removeItem('activeRoomSession');
          }
        };
        attemptReconnect();
      } else {
        localStorage.removeItem('activeRoomSession');
      }
    }
  }, [user, room, authLoading, characterLoading, reconnectToRoom]);

  useEffect(() => {
    if (user && !character && !characterLoading) {
      loadCharactersData();
    }
  }, [user, character, characterLoading]);

  const loadCharactersData = async () => {
    const chars = await loadAllCharacters();
    setAllCharacters(chars);
    if (chars.length > 0) setShowCharacterSelection(true);
    else setShowCreation(true);
  };

  useEffect(() => {
    if (character && room && room.session_active && view === 'game' && gmMessages.length === 0 && !messagesLoading) {
      const createWelcomeMessage = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !room || user.id !== room.gm_id) return;

        const { data: existingMessages } = await supabase.from('gm_messages').select('id').eq('room_id', room.id).limit(1);
        if (existingMessages && existingMessages.length > 0) return;

        setIsLoading(true);
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          const { data: { session } } = await supabase.auth.getSession();

          const { data: roomPlayers } = await supabase.from('room_players').select(`*, characters (*)`).eq('room_id', room.id);
          let allCharactersSheet = '=== GRUPO DE AVENTUREIROS ===\n\n';
          roomPlayers?.forEach((p: any) => {
            const char = p.characters;
            if (char) allCharactersSheet += `📜 ${char.name} (${char.race} ${char.class})\n`;
          });

          await fetch(`${supabaseUrl}/functions/v1/game-master`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`, 'apikey': supabaseAnonKey },
            body: JSON.stringify({ messages: [{ role: 'user', content: `[INÍCIO DA SESSÃO]\n${allCharactersSheet}` }], roomId: room.id, characterName: character.name, characterId: character.id, isSessionStart: true, campaignType: room.campaign_type || 'fantasy' }),
          });
        } catch (error) {
          console.error('Error generating welcome message:', error);
        } finally {
          setIsLoading(false);
        }
      };
      createWelcomeMessage();
    }
  }, [character, room, view, gmMessages.length, messagesLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gmMessages]);

  const handleSend = async (message: string) => {
    if (!room || !character) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setIsLoading(true);
    try {
      await supabase.from("gm_messages").insert({ room_id: room.id, player_id: user.id, sender: "player", character_name: character.name, content: message.trim(), type: "gm" });
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      await fetch(`${supabaseUrl}/functions/v1/game-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`, 'apikey': supabaseAnonKey },
        body: JSON.stringify({ messages: [{ role: 'user', content: message.trim() }], roomId: room.id, characterName: character.name, characterId: character.id }),
      });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar mensagem", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading && gmMessages.length > 0) {
      if (gmMessages[gmMessages.length - 1].sender === "GM") setIsLoading(false);
    }
  }, [gmMessages, isLoading]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleCreateRoom = async (campaignType: string) => {
    if (!character) return;
    const newRoom = await createRoom(character.id, campaignType);
    if (newRoom) setView('lobby');
  };

  const handleJoinRoomWithCode = async (roomCode: string, characterId: string) => {
    const joinedRoom = await joinRoom(roomCode, characterId);
    if (joinedRoom) setView('lobby');
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    localStorage.removeItem('activeRoomSession');
    setView('menu');
  };

  const handleBackToLobby = async () => {
    setView('lobby');
    if (room?.session_active) {
      await supabase.from('rooms').update({ session_active: false, combat_active: false }).eq('id', room.id);
      localStorage.setItem('activeRoomSession', JSON.stringify({ ...JSON.parse(localStorage.getItem('activeRoomSession') || '{}'), sessionActive: false, combatActive: false }));
    }
  };

  useEffect(() => {
    if (!room) return;
    if (room.session_active && view === 'lobby' && !room.combat_active) {
      if (gmMessages.length === 0 || isReturningToGame) {
        setView('game');
        setIsReturningToGame(false);
      }
    }
    if (room.combat_active && view !== 'combat') setView('combat');
    else if (!room.combat_active && room.session_active && view === 'combat') setView('game');
  }, [room?.session_active, room?.combat_active, view, gmMessages.length, isReturningToGame]);

  if (authLoading || characterLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Auth />;
  if (showCreation) return <CharacterCreation onComplete={async (data) => { await createCharacter(data); setShowCreation(false); loadCharactersData(); }} />;
  if (showCharacterSelection) return <CharacterSelect characters={allCharacters} onSelect={(c) => { selectCharacter(c); setShowCharacterSelection(false); }} onCreateNew={() => { setShowCharacterSelection(false); setShowCreation(true); }} onCharactersUpdate={loadCharactersData} onBack={view === 'menu' ? () => setShowCharacterSelection(false) : undefined} />;
  if (!character) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (view === 'menu') return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-4xl font-bold text-center mb-8">Voz do Destino</h1>
        <Button onClick={() => setView('create')} size="lg" className="w-full">Criar Sala</Button>
        <Button onClick={() => setView('history')} size="lg" variant="default" className="w-full">Minhas Salas</Button>
        <Button onClick={() => setView('join')} size="lg" variant="secondary" className="w-full">Entrar em Sala</Button>
        <Button onClick={() => setShowCharacterSelection(true)} size="lg" variant="outline" className="w-full">Trocar Personagem</Button>
        <Button onClick={handleLogout} size="lg" variant="ghost" className="w-full">Sair</Button>
      </div>
    </div>
  );

  if (view === 'create') return <CreateRoom onCreateRoom={handleCreateRoom} loading={roomLoading} onBack={() => setView('menu')} />;
  if (view === 'join') return <JoinRoom onJoinRoom={handleJoinRoomWithCode} loading={roomLoading} character={character} onBack={() => setView('menu')} />;
  if (view === 'history') return <RoomHistory onJoinRoom={handleJoinRoomWithCode} loading={roomLoading} character={character} onBack={() => setView('menu')} />;
  if (view === 'lobby' && room) return <RoomLobby room={room} players={players} onLeave={handleLeaveRoom} onToggleReady={toggleReady} onStartSession={() => { setIsReturningToGame(true); startSession(); }} onRefreshPlayers={refreshPlayers} />;
  if (view === 'combat' && room) return <CombatView room={room} players={players} onAdvanceTurn={advanceTurn} onEndCombat={endCombat} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden">
      {room?.campaign_type && <AtmosphereEffect campaignType={room.campaign_type} />}
      {character && (
        <>
          <XPNotification characterId={character.id} />
          <ItemRewardNotification characterId={character.id} />
          {room && <ItemTradeNotifications characterId={character.id} roomId={room.id} />}
        </>
      )}
      <div className="relative z-10 flex flex-col h-screen">
        <GameHeader onLogout={handleLogout} onBackToLobby={room ? handleBackToLobby : undefined} roomCode={room?.room_code} characterId={character?.id} players={players} gmId={room?.gm_id} />
        <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 min-h-0 overflow-hidden">
          {isMobile ? (
            <MobileGameView room={room!} character={character} players={players} gmMessages={gmMessages} messagesLoading={messagesLoading} isLoading={isLoading} auctionsActive={auctionsActive} userId={user.id} onSend={handleSend} onRefresh={async () => { await refreshPlayers(); }} />
          ) : (
            <>
              <div className="flex-[2] flex flex-col bg-card/80 backdrop-blur border border-primary/20 rounded-lg p-4 min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {gmMessages.map((msg) => <NarrativeMessage key={msg.id} role={msg.sender === "GM" ? "assistant" : "user"} content={msg.content || ""} characterName={msg.sender === "player" ? msg.character_name : undefined} />)}
                  {isLoading && <div className="animate-pulse text-muted-foreground text-sm text-center">A Voz do Destino está narrando...</div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="pt-4 mt-4 border-t border-border/50"><ChatInput onSend={handleSend} disabled={isLoading} /></div>
              </div>
              <div className="flex-1 min-w-[300px] max-w-[400px] flex flex-col gap-4">
                <div className="bg-card/80 border border-primary/20 rounded-lg p-4 space-y-3">
                  <Sheet><SheetTrigger asChild><Button className="w-full gap-2" variant="outline"><MessageSquare className="h-4 w-4" />Chat Social</Button></SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Chat Social</SheetTitle></SheetHeader><div className="mt-4 h-[calc(100vh-8rem)]"><RoomChat roomId={room!.id} characterName={character.name} currentTurn={room!.current_turn || 0} initiativeOrder={(room!.initiative_order as any[]) || []} isGM={isGM} /></div></SheetContent></Sheet>
                  <Sheet><SheetTrigger asChild><Button className="w-full gap-2" variant="outline"><Package className="h-4 w-4" />Inventário</Button></SheetTrigger><SheetContent side="right"><SheetHeader><SheetTitle>Itens</SheetTitle></SheetHeader><div className="mt-4"><Tabs defaultValue="inventory"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="inventory">Mochila</TabsTrigger><TabsTrigger value="crafting">Crafting</TabsTrigger><TabsTrigger value="shop">Loja</TabsTrigger></TabsList><TabsContent value="inventory" className="mt-4 space-y-4"><InteractiveObjectsPanel characterId={character.id} roomId={room!.id} /><InventoryPanel characterId={character.id} carryingCapacity={150} roomId={room!.id} players={players.filter(p => p.characters).map(p => ({ character_id: p.character_id, character_name: p.characters!.name }))} /></TabsContent><TabsContent value="crafting" className="mt-4"><CraftingPanel characterId={character.id} intelligence={character.intelligence} wisdom={character.wisdom} /></TabsContent><TabsContent value="shop" className="mt-4"><ShopPanel roomId={room!.id} characterId={character.id} /></TabsContent></Tabs></div></SheetContent></Sheet>
                </div>
                <DicePanel roomId={room!.id} characterName={character.name} characterStats={{ strength: character.strength, dexterity: character.dexterity, constitution: character.constitution, intelligence: character.intelligence, wisdom: character.wisdom, charisma: character.charisma }} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
