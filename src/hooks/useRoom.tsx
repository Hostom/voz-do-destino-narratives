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
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  character_id: string;
  user_id: string;
  joined_at: string;
  is_ready: boolean;
  initiative: number;
  characters?: {
    id: string;
    name: string;
    class: string;
    race: string;
    level: number;
    current_hp: number;
    max_hp: number;
    armor_class: number;
  };
}

export const useRoom = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createRoom = async () => {
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
            armor_class
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

  // Subscribe to room changes
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  return {
    room,
    players,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleReady,
  };
};
