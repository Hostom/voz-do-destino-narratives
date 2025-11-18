import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Shield, Heart, ChevronRight, X } from "lucide-react";
import { Room, RoomPlayer } from "@/hooks/useRoom";
import { CombatActions } from "@/components/CombatActions";
import { CombatLog } from "@/components/CombatLog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface CombatViewProps {
  room: Room;
  players: RoomPlayer[];
  onAdvanceTurn: () => void;
  onEndCombat: () => void;
}

export const CombatView = ({ room, players, onAdvanceTurn, onEndCombat }: CombatViewProps) => {
  const [isGM, setIsGM] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkGMStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        setIsGM(user.id === room.gm_id);
      }
    };
    checkGMStatus();
  }, [room.gm_id]);

  // Sort players by initiative
  const sortedPlayers = [...players].sort((a, b) => b.initiative - a.initiative);

  // Get current turn character
  const initiativeOrder = Array.isArray(room.initiative_order) ? room.initiative_order : [];
  const currentTurnCharacterId = initiativeOrder[room.current_turn];
  const currentTurnPlayer = players.find(p => p.character_id === currentTurnCharacterId);
  const isCurrentUserTurn = currentTurnPlayer?.user_id === currentUserId;

  // Calculate round number
  const roundNumber = Math.floor(room.current_turn / players.length) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Combat Header */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Swords className="w-8 h-8 text-destructive animate-pulse" />
                <div>
                  <CardTitle className="text-2xl">Combate Ativo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Rodada {roundNumber} • Código da sala: {room.room_code}
                  </p>
                </div>
              </div>
              {isGM && (
                <Button variant="destructive" onClick={onEndCombat}>
                  <X className="w-4 h-4 mr-2" />
                  Encerrar Combate
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Current Turn Indicator */}
        {currentTurnPlayer && (
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur border-primary animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  <div>
                    <p className="text-sm text-muted-foreground">Turno atual</p>
                    <p className="text-2xl font-bold">{currentTurnPlayer.characters?.name}</p>
                  </div>
                </div>
                {isGM && (
                  <Button onClick={onAdvanceTurn} size="lg">
                    Próximo Turno
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Initiative Order */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Ordem de Iniciativa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isCurrentTurn = player.character_id === currentTurnCharacterId;
              const dexModifier = Math.floor(((player.characters?.dexterity || 10) - 10) / 2);
              const roll = player.initiative - dexModifier;

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isCurrentTurn
                      ? 'bg-primary/20 border-primary shadow-lg scale-105'
                      : 'bg-background/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <span className="text-lg font-bold">{player.initiative}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{player.characters?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Rolou {roll} + {dexModifier} (DES) = {player.initiative}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-destructive" />
                      <span className="font-bold">
                        {player.characters?.current_hp}/{player.characters?.max_hp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-bold">{player.characters?.armor_class}</span>
                    </div>
                    {isCurrentTurn && (
                      <Badge className="bg-primary animate-pulse">
                        Turno Atual
                      </Badge>
                    )}
                    {player.user_id === room.gm_id && (
                      <Badge variant="outline" className="border-primary text-primary">
                        GM
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Combat Actions (placeholder for future phases) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentUserId && (
            <CombatActions
              roomId={room.id}
              currentPlayerId={players.find(p => p.user_id === currentUserId)?.id || ""}
              availablePlayers={players}
              isYourTurn={isCurrentUserTurn}
            />
          )}
          <CombatLog roomId={room.id} />
        </div>
      </div>
    </div>
  );
};
