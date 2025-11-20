import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseDiceNotificationsProps {
  roomId: string;
  currentUserId: string;
}

export const useDiceNotifications = ({ roomId, currentUserId }: UseDiceNotificationsProps) => {
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel(`room-dice-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          // Não mostra notificação para mensagens do próprio usuário
          if (payload.new.user_id === currentUserId) return;
          
          // Apenas mostra notificação para mensagens de dados (começam com 🎲)
          if (payload.new.message && payload.new.message.startsWith('🎲')) {
            toast({
              title: `${payload.new.character_name} rolou dados!`,
              description: payload.new.message,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ability_checks',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          // Não mostra notificação para testes do próprio usuário
          if (payload.new.character_id && payload.new.character_id === currentUserId) return;
          
          const checkTypeLabels: Record<string, string> = {
            ability: "Teste de Habilidade",
            saving_throw: "Teste de Resistência",
          };
          
          const abilityLabels: Record<string, string> = {
            strength: "Força",
            dexterity: "Destreza",
            constitution: "Constituição",
            intelligence: "Inteligência",
            wisdom: "Sabedoria",
            charisma: "Carisma",
          };

          const checkType = checkTypeLabels[payload.new.check_type] || payload.new.check_type;
          const ability = abilityLabels[payload.new.ability] || payload.new.ability;
          const success = payload.new.success !== null 
            ? (payload.new.success ? " - SUCESSO!" : " - FALHA!") 
            : "";

          toast({
            title: `${payload.new.character_name} realizou um teste!`,
            description: `🎲 ${checkType} de ${ability}: ${payload.new.total}${success}`,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId, toast]);
};
