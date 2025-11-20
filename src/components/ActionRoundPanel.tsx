import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, Send, CheckCircle2 } from "lucide-react";
import { Character } from "@/hooks/useCharacter";
import { RoomPlayer } from "@/hooks/useRoom";

interface ActionRound {
  id: string;
  room_id: string;
  created_by: string;
  created_at: string;
  prompt: string;
  completed: boolean;
  completed_at: string | null;
  round_number: number;
  use_initiative_order: boolean;
}

interface PlayerAction {
  id: string;
  action_round_id: string;
  character_id: string;
  player_id: string;
  action_text: string;
  submitted_at: string;
  initiative: number | null;
}

interface ActionRoundPanelProps {
  roomId: string;
  character: Character;
  players: RoomPlayer[];
  isGM: boolean;
  onActionsComplete?: (actions: PlayerAction[]) => void;
}

export const ActionRoundPanel = ({ roomId, character, players, isGM, onActionsComplete }: ActionRoundPanelProps) => {
  const { toast } = useToast();
  const [activeRound, setActiveRound] = useState<ActionRound | null>(null);
  const [myAction, setMyAction] = useState("");
  const [submittedActions, setSubmittedActions] = useState<PlayerAction[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUserId();
  }, []);

  // Buscar rodada ativa
  useEffect(() => {
    const fetchActiveRound = async () => {
      const { data, error } = await supabase
        .from('action_rounds')
        .select('*')
        .eq('room_id', roomId)
        .eq('completed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setActiveRound(data);
        checkIfSubmitted(data.id);
        loadSubmittedActions(data.id);
      } else {
        setActiveRound(null);
        setHasSubmitted(false);
        setSubmittedActions([]);
      }
    };

    fetchActiveRound();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`action-rounds-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_rounds',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchActiveRound();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions'
        },
        () => {
          if (activeRound) {
            loadSubmittedActions(activeRound.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const checkIfSubmitted = async (roundId: string) => {
    if (!currentUserId) return;
    
    const { data } = await supabase
      .from('player_actions')
      .select('*')
      .eq('action_round_id', roundId)
      .eq('player_id', currentUserId)
      .maybeSingle();

    setHasSubmitted(!!data);
  };

  const loadSubmittedActions = async (roundId: string) => {
    const { data, error } = await supabase
      .from('player_actions')
      .select('*')
      .eq('action_round_id', roundId);

    if (!error && data) {
      setSubmittedActions(data);
      
      // Se todos submeteram, notificar o GM
      if (data.length === players.length && onActionsComplete && !activeRound?.completed) {
        onActionsComplete(data);
      }
    }
  };

  const handleSubmitAction = async () => {
    if (!activeRound || !myAction.trim() || !currentUserId) return;

    const currentPlayer = players.find(p => p.user_id === currentUserId);
    
    const { error } = await supabase
      .from('player_actions')
      .insert({
        action_round_id: activeRound.id,
        character_id: character.id,
        player_id: currentUserId,
        action_text: myAction.trim(),
        initiative: currentPlayer?.initiative || 0
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua ação",
        variant: "destructive",
      });
      return;
    }

    setMyAction("");
    setHasSubmitted(true);
    toast({
      title: "Ação enviada!",
      description: "Aguardando os outros jogadores...",
    });
  };

  if (!activeRound) return null;

  const totalPlayers = players.length;
  const submittedCount = submittedActions.length;
  const allSubmitted = submittedCount === totalPlayers;

  return (
    <Card className="bg-primary/10 border-primary/30 backdrop-blur mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Rodada de Ação #{activeRound.round_number}
          </div>
          <Badge variant={allSubmitted ? "default" : "secondary"} className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {submittedCount}/{totalPlayers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-card rounded-lg border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-1">Pergunta do Mestre:</p>
          <p className="text-base">{activeRound.prompt}</p>
        </div>

        {!isGM && !hasSubmitted && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Sua Ação:</label>
            <Textarea
              value={myAction}
              onChange={(e) => setMyAction(e.target.value)}
              placeholder="Descreva o que seu personagem faz..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={handleSubmitAction} 
              disabled={!myAction.trim()}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar Ação
            </Button>
          </div>
        )}

        {!isGM && hasSubmitted && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-sm">Ação enviada! Aguardando os outros jogadores...</span>
          </div>
        )}

        {isGM && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Status dos Jogadores:</p>
            <div className="space-y-2">
              {players.map(player => {
                const hasSubmitted = submittedActions.some(a => a.player_id === player.user_id);
                return (
                  <div 
                    key={player.id} 
                    className="flex items-center justify-between p-2 bg-card rounded border border-border"
                  >
                    <span className="text-sm">{player.characters?.name || 'Desconhecido'}</span>
                    {hasSubmitted ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Enviado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Aguardando
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            
            {allSubmitted && (
              <div className="pt-2">
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ Todas as ações foram recebidas! Use o chat do GM para narrar a resolução.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
