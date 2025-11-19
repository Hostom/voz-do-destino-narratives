import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Swords, Shield, Heart, ChevronRight, X } from "lucide-react";
import { Room, RoomPlayer } from "@/hooks/useRoom";
import { CombatActions } from "@/components/CombatActions";
import { CombatLog } from "@/components/CombatLog";
import { ConditionsPanel } from "@/components/ConditionsPanel";
import { GMPanel } from "@/components/GMPanel";
import { GMPlayerViewer } from "@/components/GMPlayerViewer";
import { GMCheckRequestPanel } from "@/components/GMCheckRequestPanel";
import { AbilityCheckPanel } from "@/components/AbilityCheckPanel";
import { TurnHistory } from "@/components/TurnHistory";
import { useTurnNotification } from "@/hooks/useTurnNotification";
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
  const [npcs, setNpcs] = useState<any[]>([]);

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

  // Load and subscribe to NPCs
  useEffect(() => {
    const loadNPCs = async () => {
      const { data } = await supabase
        .from('npcs')
        .select('*')
        .eq('room_id', room.id);
      
      if (data) setNpcs(data);
    };

    loadNPCs();

    const channel = supabase
      .channel(`npcs-combat-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'npcs',
          filter: `room_id=eq.${room.id}`
        },
        () => loadNPCs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  // Combine players and NPCs into initiative order
  const initiativeOrder = Array.isArray(room.initiative_order) ? room.initiative_order : [];
  const currentTurnEntry = initiativeOrder[room.current_turn];
  
  // Parse current turn (format: "type:id")
  const [currentType, currentId] = currentTurnEntry?.split(':') || ['', ''];
  const isCurrentUserTurn = currentType === 'player' && players.some(p => p.character_id === currentId && p.user_id === currentUserId);

  // Build combined initiative list
  const combatants = initiativeOrder.map((entry: string) => {
    const [type, id] = entry.split(':');
    if (type === 'player') {
      const player = players.find(p => p.character_id === id);
      return player ? { ...player, type: 'player', displayName: player.characters?.name } : null;
    } else {
      const npc = npcs.find(n => n.id === id);
      return npc ? { ...npc, type: 'npc', displayName: npc.name } : null;
    }
  }).filter(Boolean);

  // Calculate round number
  const roundNumber = Math.floor(room.current_turn / combatants.length) + 1;

  // Get current turn character for notifications
  const currentCombatant = combatants[room.current_turn];
  const currentCharacterName = currentCombatant?.displayName || null;
  const userCharacter = players.find(p => p.user_id === currentUserId)?.characters;

  // Setup turn notifications
  useTurnNotification({
    isUserTurn: isCurrentUserTurn,
    currentTurnCharacterName: currentCharacterName,
    characterName: userCharacter?.name || "",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-2 md:p-6">
      <div className="max-w-6xl mx-auto space-y-3 md:space-y-6">
        {/* Combat Header */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader className="p-3 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                <Swords className="w-6 h-6 md:w-8 md:h-8 text-destructive animate-pulse" />
                <div>
                  <CardTitle className="text-lg md:text-2xl">Combate Ativo</CardTitle>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Rodada {roundNumber} • Sala: {room.room_code}
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
        {combatants.length > 0 && combatants[room.current_turn] && (
          <Card className="bg-gradient-to-r from-primary/20 to-primary/10 backdrop-blur border-primary animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                  <div>
                    <p className="text-sm text-muted-foreground">Turno atual</p>
                    <p className="text-2xl font-bold">{combatants[room.current_turn].displayName}</p>
                    {combatants[room.current_turn].type === 'npc' && (
                      <Badge variant="outline" className="mt-1">NPC</Badge>
                    )}
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
            {combatants.map((combatant: any, index) => {
              const isCurrentTurn = index === room.current_turn;
              const isPlayer = combatant.type === 'player';
              
              return (
                <div
                  key={`${combatant.type}-${combatant.id}`}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isCurrentTurn
                      ? 'bg-primary/20 border-primary shadow-lg scale-105'
                      : 'bg-background/50 border-border'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary">
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      <span className="text-lg font-bold">{combatant.initiative}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        {combatant.displayName}
                        {!isPlayer && (
                          <Badge variant="outline" className="text-xs">NPC</Badge>
                        )}
                      </p>
                      {isPlayer && combatant.characters && (
                        <p className="text-sm text-muted-foreground">
                          {combatant.characters.class} • {combatant.characters.race}
                        </p>
                      )}
                      {!isPlayer && (
                        <p className="text-sm text-muted-foreground">
                          {combatant.creature_type}
                        </p>
                      )}
                      {((isPlayer ? combatant.conditions : combatant.conditions) as any[])?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {((isPlayer ? combatant.conditions : combatant.conditions) as any[]).map((condition: any) => (
                            <Badge key={condition.id} variant="destructive" className="text-xs">
                              {condition.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-destructive" />
                      <span className="font-bold">
                        {isPlayer ? combatant.characters?.current_hp : combatant.current_hp}/
                        {isPlayer ? combatant.characters?.max_hp : combatant.max_hp}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-bold">
                        {isPlayer ? combatant.characters?.armor_class : combatant.armor_class}
                      </span>
                    </div>
                    {isCurrentTurn && (
                      <Badge className="bg-primary animate-pulse">
                        Turno Atual
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Combat Actions, GM Panel, Conditions and Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isGM ? (
            <>
              <div className="space-y-6">
                <GMPanel roomId={room.id} players={players} />
                <GMCheckRequestPanel 
                  roomId={room.id}
                  players={players}
                  gmId={room.gm_id}
                />
                <GMPlayerViewer roomId={room.id} />
              </div>
              <div className="space-y-6">
                <ConditionsPanel 
                  roomId={room.id}
                  players={players}
                  isGM={isGM}
                />
                <TurnHistory roomId={room.id} />
                <CombatLog roomId={room.id} />
              </div>
            </>
          ) : (
            <>
              <div className="lg:col-span-1 space-y-6">
                {currentUserId && (
                  <>
                    <CombatActions
                      roomId={room.id}
                      currentPlayerId={players.find(p => p.user_id === currentUserId)?.id || ""}
                      availablePlayers={players}
                      isYourTurn={isCurrentUserTurn}
                    />
                    {players.find(p => p.user_id === currentUserId)?.characters && (
                      <AbilityCheckPanel 
                        roomId={room.id}
                        character={players.find(p => p.user_id === currentUserId)!.characters!}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="lg:col-span-1">
                <ConditionsPanel 
                  roomId={room.id}
                  players={players}
                  isGM={isGM}
                />
              </div>
              <div className="lg:col-span-1 space-y-6">
                <TurnHistory roomId={room.id} />
                <CombatLog roomId={room.id} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
