import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Users, Shield, Swords, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Room, RoomPlayer } from "@/hooks/useRoom";
import { RestPanel } from "@/components/RestPanel";
import { WeaponSelector } from "@/components/WeaponSelector";
import { SpellSelector } from "@/components/SpellSelector";
import { InventoryPanel } from "@/components/InventoryPanel";
import { AbilityCheckPanel } from "@/components/AbilityCheckPanel";
import { CheckHistoryPanel } from "@/components/CheckHistoryPanel";
import { GMCheckRequestPanel } from "@/components/GMCheckRequestPanel";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface RoomLobbyProps {
  room: Room;
  players: RoomPlayer[];
  onLeave: () => void;
  onToggleReady: () => void;
  onRollInitiative: () => void;
  onRefreshPlayers?: () => void;
}

export const RoomLobby = ({ room, players, onLeave, onToggleReady, onRollInitiative, onRefreshPlayers }: RoomLobbyProps) => {
  const { toast } = useToast();
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

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.room_code);
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seus amigos",
    });
  };

  const currentPlayer = players.find(p => p.user_id === currentUserId);
  const allReady = players.length > 0 && players.every(p => p.is_ready);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Sala de Combate</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground">Código:</span>
                    <Badge 
                      variant="outline" 
                      className="text-lg font-mono cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={copyRoomCode}
                    >
                      {room.room_code}
                      <Copy className="w-3 h-3 ml-2" />
                    </Badge>
                  </div>
                </div>
              </div>
              <Button variant="destructive" onClick={onLeave}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Players List */}
        <Card className="bg-card/80 backdrop-blur border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Jogadores ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {players.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aguardando jogadores...
              </p>
            ) : (
              players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${player.is_ready ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <p className="font-semibold">{player.characters?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.characters?.race} {player.characters?.class} - Nível {player.characters?.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">HP</p>
                      <p className="font-bold">{player.characters?.current_hp}/{player.characters?.max_hp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">AC</p>
                      <p className="font-bold">{player.characters?.armor_class}</p>
                    </div>
                    <Badge variant={player.is_ready ? "default" : "secondary"}>
                      {player.is_ready ? "Pronto" : "Não pronto"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          {/* Weapon, Spell and Rest Management */}
          {currentUserId && currentPlayer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <WeaponSelector 
                  characterId={currentPlayer.character_id}
                  currentWeapon={currentPlayer.characters?.equipped_weapon}
                  onWeaponChange={() => {
                    onRefreshPlayers?.();
                  }}
                />
                <RestPanel 
                  roomId={room.id}
                  players={players}
                  currentUserId={currentUserId}
                />
                <InventoryPanel 
                  characterId={currentPlayer.character_id}
                  carryingCapacity={currentPlayer.characters?.carrying_capacity || 150}
                />
              </div>
              <SpellSelector 
                characterId={currentPlayer.character_id}
                spellSlots={currentPlayer.characters?.spell_slots}
                currentSpellSlots={currentPlayer.characters?.current_spell_slots}
              />
              
              {/* Ability Checks Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentPlayer.characters && (
                  <AbilityCheckPanel 
                    roomId={room.id}
                    character={currentPlayer.characters}
                  />
                )}
                <CheckHistoryPanel roomId={room.id} />
              </div>
              
              {/* GM Check Request */}
              {isGM && (
                <GMCheckRequestPanel 
                  roomId={room.id}
                  players={players}
                  gmId={room.gm_id}
                />
              )}
            </div>
          )}

          {/* Ready and Initiative Buttons */}
          <div className="flex gap-4">
            {!isGM && currentPlayer && (
              <Button 
                onClick={onToggleReady}
                variant={currentPlayer.is_ready ? "secondary" : "default"}
                className="flex-1"
                size="lg"
              >
                {currentPlayer.is_ready ? "Cancelar Pronto" : "Estou Pronto"}
              </Button>
            )}
            
            {isGM && (
              <Button 
                onClick={onRollInitiative}
                disabled={!allReady}
                className="flex-1"
                size="lg"
              >
                <Swords className="w-4 h-4 mr-2" />
                Rolar Iniciativa e Iniciar
                {!allReady && " (Aguardando jogadores)"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
