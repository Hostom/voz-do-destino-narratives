import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Room {
  id: string;
  room_code: string;
  gm_id: string;
  created_at: string;
  combat_active: boolean;
  current_turn: number;
  initiative_order: any;
  session_active: boolean;
  campaign_type?: string;
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
    experience_points: number;
    experience_to_next_level: number;
    inspiration: boolean;
  };
}

export const useRoom = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadPlayers = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('room_players')
        .select(`
          *,
          characters (*)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error("Error loading players:", error);
    }
  }, []);

  const createRoom = async (characterId: string, campaignType: string = 'fantasy') => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await cleanupOldSessions();
      const { data: codeData, error: codeError } = await supabase.rpc('generate_room_code');
      if (codeError) throw codeError;

      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .insert({ room_code: codeData, gm_id: user.id, campaign_type: campaignType, story_stage: 1 })
        .select().single();

      if (roomError) throw roomError;

      await supabase.from('room_players').insert({ room_id: roomData.id, character_id: characterId, user_id: user.id });

      setRoom(roomData);
      toast({ title: "Sala criada!", description: `Código: ${roomData.room_code}` });
      return roomData;
    } catch (error: any) {
      toast({ title: "Erro ao criar sala", description: error.message, variant: "destructive" });
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

      await cleanupOldSessions();
      const { data: roomData, error: roomError } = await supabase
        .from('rooms').select('*').eq('room_code', roomCode).single();

      if (roomError) throw new Error("Sala não encontrada");

      const { error: playerError } = await supabase
        .from('room_players').insert({ room_id: roomData.id, character_id: characterId, user_id: user.id });

      if (playerError) throw playerError;

      setRoom(roomData);
      toast({ title: "Entrou na sala!", description: `Você entrou em ${roomCode}` });
      return roomData;
    } catch (error: any) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const leaveRoom = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !room) return;
      await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', user.id);
      setRoom(null);
      setPlayers([]);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const toggleReady = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !room) return;
      const player = players.find(p => p.user_id === user.id);
      if (!player) return;
      await supabase.from('room_players').update({ is_ready: !player.is_ready }).eq('id', player.id);
    } catch (error) {
      console.error("Error toggling ready:", error);
    }
  };

  const rollInitiative = async () => {
    if (!room) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id !== room.gm_id) return;

      const { data: npcs } = await supabase.from('npcs').select('*').eq('room_id', room.id);

      const initiativeOrder = [...players.map(p => ({ id: p.id, type: 'player', name: p.characters?.name, initiative: Math.floor(Math.random() * 20) + 1 + Math.floor(((p.characters?.dexterity || 10) - 10) / 2) })),
                               ...(npcs || []).map(n => ({ id: n.id, type: 'npc', name: n.name, initiative: Math.floor(Math.random() * 20) + 1 + n.initiative_bonus }))]
                               .sort((a, b) => b.initiative - a.initiative)
                               .map(e => `${e.type}:${e.id}`);

      await supabase.from('rooms').update({ initiative_order: initiativeOrder, combat_active: true, current_turn: 0 }).eq('id', room.id);
    } catch (error) {
      console.error("Error rolling initiative:", error);
    }
  };

  const advanceTurn = async () => {
    if (!room || !Array.isArray(room.initiative_order)) return;
    const nextTurn = (room.current_turn + 1) % room.initiative_order.length;
    await supabase.from('rooms').update({ current_turn: nextTurn }).eq('id', room.id);
  };

  const endCombat = async () => {
    if (!room) return;
    await supabase.from('rooms').update({ combat_active: false, current_turn: 0, initiative_order: [] }).eq('id', room.id);
  };

  const startSession = async () => {
    if (!room) return;
    await supabase.from('rooms').update({ session_active: true }).eq('id', room.id);
  };

  const cleanupOldSessions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('room_players').delete().eq('user_id', user.id);
  };

  const reconnectToRoom = async (roomId: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not auth");

      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (!roomData) throw new Error("No room");

      setRoom(roomData);
      return roomData;
    } catch (error) {
      localStorage.removeItem('activeRoomSession');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!room?.id) return;

    loadPlayers(room.id);

    const channel = supabase.channel(`room-sync-${room.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${room.id}` }, () => loadPlayers(room.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` }, (p) => setRoom(p.new as Room))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' }, () => loadPlayers(room.id))
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [room?.id, loadPlayers]);

  return { room, players, loading, createRoom, joinRoom, leaveRoom, toggleReady, rollInitiative, advanceTurn, endCombat, startSession, refreshPlayers: () => room?.id && loadPlayers(room.id), reconnectToRoom };
};
