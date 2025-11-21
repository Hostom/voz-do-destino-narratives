import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Users, Zap } from "lucide-react";
import { XP_REWARDS, getXPForLevel, getLevelFromXP } from "@/lib/dnd-xp-progression";

interface Player {
  id: string;
  character_id: string;
  character?: {
    id: string;
    name: string;
    level: number;
    experience_points: number;
  };
}

interface GMXPDistributionProps {
  roomId: string;
  players: Player[];
}

export const GMXPDistribution = ({ roomId, players }: GMXPDistributionProps) => {
  const { toast } = useToast();
  const [baseXP, setBaseXP] = useState<number>(50);
  const [reason, setReason] = useState<string>("");
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [isAwarding, setIsAwarding] = useState(false);

  // Initialize distribution with equal shares
  const initializeDistribution = () => {
    const initialDist: Record<string, number> = {};
    players.forEach((player) => {
      if (player.character) {
        initialDist[player.character.id] = 100;
      }
    });
    setDistribution(initialDist);
  };

  // Update distribution for a specific player
  const updateDistribution = (characterId: string, value: number) => {
    setDistribution((prev) => ({
      ...prev,
      [characterId]: value,
    }));
  };

  // Calculate actual XP for each player based on participation
  const calculatePlayerXP = (characterId: string) => {
    const participation = distribution[characterId] || 100;
    return Math.round((baseXP * participation) / 100);
  };

  // Award XP to all players
  const awardXP = async () => {
    if (!reason.trim()) {
      toast({
        title: "Motivo necessário",
        description: "Por favor, descreva o motivo da recompensa de XP.",
        variant: "destructive",
      });
      return;
    }

    setIsAwarding(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Award XP to each player
      for (const player of players) {
        if (!player.character) continue;

        const xpAmount = calculatePlayerXP(player.character.id);
        const newTotalXP = player.character.experience_points + xpAmount;
        const newLevel = getLevelFromXP(newTotalXP);
        const leveledUp = newLevel > player.character.level;

        // Update character XP
        const { error: updateError } = await supabase
          .from("characters")
          .update({
            experience_points: newTotalXP,
            experience_to_next_level: getXPForLevel(newLevel),
          })
          .eq("id", player.character.id);

        if (updateError) throw updateError;

        // Record the XP reward
        const { error: rewardError } = await supabase
          .from("experience_rewards")
          .insert({
            room_id: roomId,
            character_id: player.character.id,
            amount: xpAmount,
            reason: reason,
            awarded_by: user.id,
          });

        if (rewardError) throw rewardError;

        // Send chat message about XP gain
        const levelUpMessage = leveledUp 
          ? ` 🎉 ${player.character.name} subiu para o nível ${newLevel}!`
          : "";

        const { error: chatError } = await supabase
          .from("room_chat_messages")
          .insert({
            room_id: roomId,
            user_id: user.id,
            character_name: "Mestre",
            message: `${player.character.name} ganhou ${xpAmount} XP! (${reason})${levelUpMessage}`,
          });

        if (chatError) console.error("Error sending chat message:", chatError);
      }

      toast({
        title: "XP Distribuído!",
        description: "Todos os jogadores receberam sua experiência.",
      });

      // Reset form
      setReason("");
      setBaseXP(50);
      initializeDistribution();

    } catch (error) {
      console.error("Error awarding XP:", error);
      toast({
        title: "Erro ao distribuir XP",
        description: "Não foi possível distribuir a experiência.",
        variant: "destructive",
      });
    } finally {
      setIsAwarding(false);
    }
  };

  // Quick XP presets
  const applyPreset = (preset: keyof typeof XP_REWARDS) => {
    const reward = XP_REWARDS[preset];
    setBaseXP(Math.round((reward.min + reward.max) / 2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Distribuir Experiência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Presets */}
        <div className="space-y-2">
          <Label>Dificuldade do Encontro</Label>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("trivial")}
            >
              Trivial (10-25)
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("easy")}
            >
              Fácil (25-50)
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("medium")}
            >
              Médio (50-100)
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("hard")}
            >
              Difícil (100-200)
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("deadly")}
            >
              Mortal (200-400)
            </Badge>
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => applyPreset("story")}
            >
              História (50-150)
            </Badge>
          </div>
        </div>

        {/* Base XP */}
        <div className="space-y-2">
          <Label htmlFor="baseXP">XP Base</Label>
          <Input
            id="baseXP"
            type="number"
            value={baseXP}
            onChange={(e) => setBaseXP(Number(e.target.value))}
            min={0}
          />
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Derrotaram o dragão vermelho jovem"
            rows={2}
          />
        </div>

        {/* Player Distribution */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <Label>Participação dos Jogadores (%)</Label>
          </div>
          
          {players.map((player) => {
            if (!player.character) return null;
            
            const participation = distribution[player.character.id] || 100;
            const xpAmount = calculatePlayerXP(player.character.id);
            const newTotalXP = player.character.experience_points + xpAmount;
            const newLevel = getLevelFromXP(newTotalXP);
            const willLevelUp = newLevel > player.character.level;
            const xpToNextLevel = getXPForLevel(newLevel);
            const xpUntilNext = xpToNextLevel - newTotalXP;

            return (
              <div key={player.character.id} className="space-y-2 p-3 border rounded-lg bg-background/30">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.character.name}</span>
                    <Badge variant="outline" className="text-xs">
                      Nv {player.character.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {willLevelUp && (
                      <Badge variant="default" className="bg-gradient-to-r from-primary to-yellow-500 animate-pulse">
                        🎉 Level Up!
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      <Zap className="w-3 h-3 mr-1" />
                      +{xpAmount} XP
                    </Badge>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>XP Atual: {player.character.experience_points.toLocaleString()}</div>
                  <div>Novo XP: {newTotalXP.toLocaleString()}</div>
                  {!willLevelUp && newLevel < 20 && (
                    <div className="text-primary">Faltarão {xpUntilNext.toLocaleString()} XP para o nv {newLevel + 1}</div>
                  )}
                  {willLevelUp && (
                    <div className="text-yellow-500 font-semibold">
                      Subirá para o nível {newLevel}!
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <Slider
                    value={[participation]}
                    onValueChange={(value) =>
                      updateDistribution(player.character!.id, value[0])
                    }
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {participation}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={awardXP}
          disabled={isAwarding || !reason.trim() || players.length === 0}
          className="w-full"
        >
          {isAwarding ? "Distribuindo..." : "Distribuir XP"}
        </Button>
      </CardContent>
    </Card>
  );
};
