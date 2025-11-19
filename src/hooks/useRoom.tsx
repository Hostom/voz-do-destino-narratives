import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Room {
  id: string;
  room_code: string;
  gm_id: string;
  created_at: string;
  combat_active: boolean;
  current_turn: number;
  initiative_order: any;
  session_active: boolean;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  character_id: string;
  user_id: string;
  joined_at: string;
  is_ready: boolean;
  initiative: number;
  conditions: any;
  temp_hp: number;
  characters?: {
    id: string;
    name: string;
    class: string;
    race: string;
    level: number;
    current_hp: number;
    max_hp: number;
    armor_class: number;
    dexterity: number;
    strength: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    proficiency_bonus: number;
    equipped_weapon: any;
    spell_slots: any;
    current_spell_slots: any;
    saving_throws: any;
    carrying_capacity: number;
    copper_pieces: number;
    silver_pieces: number;
    electrum_pieces: number;
    gold_pieces: number;
    platinum_pieces: number;
    current_hit_dice: number;
    hit_dice: string;
  };
}

export const useRoom = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createRoom = async (characterId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Generate room code
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;

      // Create room
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({
          room_code: codeData,
          gm_id: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add GM as a player in the room
      const { error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          character_id: characterId,
          user_id: user.id,
        });

      if (playerError) throw playerError;

      setRoom(roomData);
      toast({
        title: "Sala criada!",
        description: `Código da sala: ${roomData.room_code}`,
      });

      return roomData;
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Erro ao criar sala",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomCode: string, characterId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Find room by code
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single();

      if (roomError) throw new Error("Sala não encontrada");

      // Join room
      const { data: playerData, error: playerError } = await supabase
        .from('room_players')
        .insert({
          room_id: roomData.id,
          character_id: characterId,
          user_id: user.id,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setRoom(roomData);
      toast({
        title: "Entrou na sala!",
        description: `Você entrou na sala ${roomCode}`,
      });

      return roomData;
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Erro ao entrar na sala",
        description: error instanceof Error ? error.message : "Código inválido ou sala cheia",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !room) return;

      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', room.id)
        .eq('user_id', user.id);

      setRoom(null);
      setPlayers([]);
      
      toast({
        title: "Saiu da sala",
        description: "Você deixou a sala",
      });
    } catch (error) {
      console.error("Error leaving room:", error);
      toast({
        title: "Erro ao sair da sala",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const loadPlayers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select(`
          *,
          characters (
            id,
            name,
            class,
            race,
            level,
            current_hp,
            max_hp,
            armor_class,
            dexterity,
            strength,
            constitution,
            intelligence,
            wisdom,
            charisma,
            proficiency_bonus,
            equipped_weapon,
            spell_slots,
            current_spell_slots,
            saving_throws,
            carrying_capacity,
            copper_pieces,
            silver_pieces,
            electrum_pieces,
            gold_pieces,
            platinum_pieces,
            current_hit_dice,
            hit_dice
          )
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  };

  const toggleReady = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !room) return;

      const currentPlayer = players.find(p => p.user_id === user.id);
      if (!currentPlayer) return;

      const { error } = await supabase
        .from('room_players')
        .update({ is_ready: !currentPlayer.is_ready })
        .eq('id', currentPlayer.id);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling ready:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar status",
        variant: "destructive",
      });
    }
  };

  const rollInitiative = async () => {
    try {
      if (!room) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== room.gm_id) {
        toast({
          title: "Erro",
          description: "Apenas o GM pode rolar iniciativa",
          variant: "destructive",
        });
        return;
      }

      // Get NPCs
      const { data: npcs, error: npcsError } = await supabase
        .from('npcs')
        .select('*')
        .eq('room_id', room.id);

      if (npcsError) throw npcsError;

      // Roll initiative for each player
      const initiativeRolls = players.map(player => {
        const dexModifier = Math.floor(((player.characters?.dexterity || 10) - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        const initiative = roll + dexModifier;

        return {
          id: player.id,
          type: 'player' as const,
          character_id: player.character_id,
          name: player.characters?.name || "Unknown",
          roll,
          modifier: dexModifier,
          initiative,
          dexterity: player.characters?.dexterity || 10
        };
      });

      // Roll initiative for NPCs
      const npcRolls = (npcs || []).map(npc => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const initiative = roll + npc.initiative_bonus;

        return {
          id: npc.id,
          type: 'npc' as const,
          character_id: npc.id,
          name: npc.name,
          roll,
          modifier: npc.initiative_bonus,
          initiative,
          dexterity: npc.dexterity
        };
      });

      // Combine and sort by initiative (highest first), then by dexterity for ties
      const allInitiatives = [...initiativeRolls, ...npcRolls];
      const sorted = allInitiatives.sort((a, b) => {
        if (b.initiative !== a.initiative) {
          return b.initiative - a.initiative;
        }
        return b.dexterity - a.dexterity;
      });

      // Update each player's initiative
      for (const entity of sorted.filter(e => e.type === 'player')) {
        await supabase
          .from('room_players')
          .update({ initiative: entity.initiative })
          .eq('id', entity.id);
      }

      // Update each NPC's initiative
      for (const entity of sorted.filter(e => e.type === 'npc')) {
        await supabase
          .from('npcs')
          .update({ initiative: entity.initiative })
          .eq('id', entity.id);
      }

      // Update room with initiative order (include type prefix)
      const initiativeOrder = sorted.map(e => `${e.type}:${e.character_id}`);
      const { error } = await supabase
        .from('rooms')
        .update({
          initiative_order: initiativeOrder,
          combat_active: true,
          current_turn: 0
        })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Iniciativa Rolada!",
        description: "O combate começou!",
      });
    } catch (error) {
      console.error("Error rolling initiative:", error);
      toast({
        title: "Erro ao rolar iniciativa",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const advanceTurn = async () => {
    try {
      if (!room) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== room.gm_id) {
        toast({
          title: "Erro",
          description: "Apenas o GM pode avançar o turno",
          variant: "destructive",
        });
        return;
      }

      const initiativeOrder = Array.isArray(room.initiative_order) 
        ? room.initiative_order 
        : [];

      if (initiativeOrder.length === 0) return;

      const nextTurn = (room.current_turn + 1) % initiativeOrder.length;

      const { error } = await supabase
        .from('rooms')
        .update({ current_turn: nextTurn })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Próximo turno",
        description: "Turno avançado!",
      });
    } catch (error) {
      console.error("Error advancing turn:", error);
      toast({
        title: "Erro ao avançar turno",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const endCombat = async () => {
    try {
      if (!room) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== room.gm_id) {
        toast({
          title: "Erro",
          description: "Apenas o GM pode encerrar o combate",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .update({
          combat_active: false,
          current_turn: 0,
          initiative_order: []
        })
        .eq('id', room.id);

      if (error) throw error;

      // Reset all player initiatives
      for (const player of players) {
        await supabase
          .from('room_players')
          .update({ initiative: 0 })
          .eq('id', player.id);
      }

      toast({
        title: "Combate encerrado",
        description: "Voltando ao lobby",
      });
    } catch (error) {
      console.error("Error ending combat:", error);
      toast({
        title: "Erro ao encerrar combate",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const startSession = async () => {
    if (!room) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== room.gm_id) {
        toast({
          title: "Acesso negado",
          description: "Apenas o GM pode iniciar a sessão",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .update({ session_active: true })
        .eq('id', room.id);

      if (error) throw error;

      toast({
        title: "Sessão iniciada!",
        description: "Todos os jogadores foram notificados",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Erro ao iniciar sessão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  // Subscribe to room and player changes
  useEffect(() => {
    if (!room) return;

    loadPlayers(room.id);

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${room.id}`
        },
        () => {
          loadPlayers(room.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`
        },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  const refreshPlayers = () => {
    if (room?.id) loadPlayers(room.id);
  };

  return {
    room,
    players,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
    rollInitiative,
    advanceTurn,
    endCombat,
    startSession,
    refreshPlayers,
  };
};
