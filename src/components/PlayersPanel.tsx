import { Users, Heart, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RoomPlayer } from "@/hooks/useRoom";

interface PlayersPanelProps {
  players: RoomPlayer[];
  currentUserId: string | null;
  gmId: string;
}

export const PlayersPanel = ({ players, currentUserId, gmId }: PlayersPanelProps) => {
  return (
    <Card className="bg-card/95 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Grupo ({players.length} {players.length === 1 ? 'jogador' : 'jogadores'})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {players.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            Nenhum jogador na sala
          </p>
        ) : (
          players.map((player) => {
            const isCurrentUser = player.user_id === currentUserId;
            const isGM = player.user_id === gmId;
            const hpPercentage = player.characters ? (player.characters.current_hp / player.characters.max_hp) * 100 : 0;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isCurrentUser 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-background/50 border-border/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="font-semibold text-sm truncate cursor-help">
                              {player.characters?.name}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{player.characters?.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {isGM && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          GM
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Você
                        </Badge>
                      )}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground truncate cursor-help">
                            {player.characters?.race} {player.characters?.class} Nv.{player.characters?.level}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{player.characters?.race} {player.characters?.class} - Nível {player.characters?.level}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {player.characters && (
                  <div className="space-y-1.5">
                    {/* HP Bar */}
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-destructive flex-shrink-0" />
                      <div className="flex-1">
                        <Progress 
                          value={hpPercentage} 
                          className="h-1.5 bg-muted"
                          indicatorClassName={
                            hpPercentage > 50 
                              ? "bg-green-500" 
                              : hpPercentage > 25 
                                ? "bg-yellow-500" 
                                : "bg-destructive"
                          }
                        />
                      </div>
                      <span className="text-xs font-medium min-w-[42px] text-right">
                        {player.characters.current_hp}/{player.characters.max_hp}
                      </span>
                    </div>

                    {/* AC Badge */}
                    <div className="flex items-center gap-2">
                      <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Classe de Armadura
                      </span>
                      <span className="text-xs font-bold ml-auto">
                        {player.characters.armor_class}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
