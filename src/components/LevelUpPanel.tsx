import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Sparkles, Heart, Dices, Shield, Star, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getSpellSlotsForLevel, 
  getProficiencyBonus, 
  CLASS_HIT_DICE,
  getClassLabels 
} from "@/lib/dnd-progression";
import { getXPProgressPercentage, getXPToNextLevel, XP_TABLE } from "@/lib/dnd-xp-progression";

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  constitution: number;
  max_hp: number;
  current_hp: number;
  spell_slots: any;
  current_spell_slots: any;
  current_hit_dice: number;
  proficiency_bonus: number;
  hit_dice: string;
  experience_points?: number;
  experience_to_next_level?: number;
}

interface LevelUpPanelProps {
  character: Character;
  onLevelUp?: () => void;
}

export const LevelUpPanel = ({ character, onLevelUp }: LevelUpPanelProps) => {
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hpRoll, setHpRoll] = useState<number | null>(null);
  const { toast } = useToast();

  const newLevel = character.level + 1;
  const classLabels = getClassLabels();

  // Calculate what player will gain
  const newProficiencyBonus = getProficiencyBonus(newLevel);
  const newSpellSlots = getSpellSlotsForLevel(character.class, newLevel);
  const hitDiceSize = CLASS_HIT_DICE[character.class] || 8;
  const conModifier = Math.floor((character.constitution - 10) / 2);

  const previewLevelUp = () => {
    // Roll HP
    const roll = Math.floor(Math.random() * hitDiceSize) + 1;
    setHpRoll(roll);
    setShowPreview(true);
  };

  const confirmLevelUp = async () => {
    if (!hpRoll) return;

    setIsLevelingUp(true);
    try {
      const hpGain = hpRoll + conModifier;
      const newMaxHp = character.max_hp + hpGain;
      const newCurrentHp = character.current_hp + hpGain;

      const { error } = await supabase
        .from("characters")
        .update({
          level: newLevel,
          max_hp: newMaxHp,
          current_hp: newCurrentHp,
          spell_slots: newSpellSlots,
          current_spell_slots: newSpellSlots,
          current_hit_dice: newLevel,
          proficiency_bonus: newProficiencyBonus,
          hit_dice: `${newLevel}d${hitDiceSize}`,
        })
        .eq("id", character.id);

      if (error) throw error;

      toast({
        title: "🎉 Level Up!",
        description: `${character.name} agora é nível ${newLevel}! Você ganhou ${hpGain} HP (+${hpRoll} do dado, +${conModifier} CON).`,
      });

      setShowPreview(false);
      setHpRoll(null);
      onLevelUp?.();
    } catch (error) {
      console.error("Error leveling up:", error);
      toast({
        title: "Erro",
        description: "Não foi possível subir de nível",
        variant: "destructive",
      });
    } finally {
      setIsLevelingUp(false);
    }
  };

  const hasSpellSlotChanges = () => {
    const currentSlots = character.spell_slots || {};
    return Object.entries(newSpellSlots).some(([level, slots]) => {
      return slots !== (currentSlots[level] || 0);
    });
  };

  const getSpellSlotChanges = () => {
    const currentSlots = character.spell_slots || {};
    const changes: { level: string; old: number; new: number }[] = [];
    
    Object.entries(newSpellSlots).forEach(([level, newSlots]) => {
      const oldSlots = currentSlots[level] || 0;
      if (newSlots !== oldSlots) {
        changes.push({ level, old: oldSlots, new: newSlots as number });
      }
    });

    return changes;
  };

  // XP Progress
  const currentXP = character.experience_points || 0;
  const xpProgress = getXPProgressPercentage(currentXP, character.level);
  const xpToNext = getXPToNextLevel(currentXP, character.level);
  const currentLevelXP = XP_TABLE[character.level];
  const nextLevelXP = XP_TABLE[character.level + 1];
  const canLevelUp = character.level < 20 && currentXP >= nextLevelXP;

  if (character.level >= 20) {
    return (
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Nível Máximo Alcançado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {character.name} alcançou o nível máximo (20)! Você dominou completamente sua classe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-card to-card/80 backdrop-blur border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <TrendingUp className="w-6 h-6 text-primary" />
          Subir de Nível
        </CardTitle>
        <CardDescription>
          Prepare-se para a jornada até o nível {newLevel}
        </CardDescription>
      </CardHeader>
      
      {/* XP Progress Bar */}
      <CardContent className="space-y-2 pb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-medium">Experiência</span>
          </div>
          <span className="text-muted-foreground">
            {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </span>
        </div>
        <Progress value={xpProgress} className="h-2" />
        {!canLevelUp && (
          <p className="text-xs text-muted-foreground text-center">
            Faltam {xpToNext.toLocaleString()} XP para o próximo nível
          </p>
        )}
        {canLevelUp && (
          <Badge variant="default" className="w-full justify-center animate-pulse">
            Pronto para subir de nível!
          </Badge>
        )}
      </CardContent>

      <CardContent className="space-y-4">
        {!showPreview ? (
          <>
            <div className="p-4 bg-background/50 rounded-lg border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Nível Atual</span>
                <Badge variant="outline" className="text-lg">{character.level}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Próximo Nível</span>
                <Badge variant="default" className="text-lg">{newLevel}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-primary">Ganhos ao Subir para Nível {newLevel}:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-destructive" />
                  <span>HP: Rolar 1d{hitDiceSize} + {conModifier} (CON)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-primary" />
                  <span>Dados de Vida: +1 (total: {newLevel}d{hitDiceSize})</span>
                </div>
                {newProficiencyBonus > character.proficiency_bonus && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>Bônus de Proficiência: +{character.proficiency_bonus} → +{newProficiencyBonus}</span>
                  </div>
                )}
                {hasSpellSlotChanges() && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
                    <div>
                      <span className="block">Espaços de Magia:</span>
                      <div className="ml-4 mt-1 space-y-1">
                        {getSpellSlotChanges().map(({ level, old, new: newSlots }) => (
                          <div key={level} className="text-xs text-muted-foreground">
                            Nível {level}: {old} → {newSlots}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button 
              onClick={previewLevelUp}
              disabled={isLevelingUp || !canLevelUp}
              className="w-full"
              size="lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {canLevelUp ? `Subir para Nível ${newLevel}` : "XP Insuficiente"}
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
              <h4 className="font-semibold text-primary">Rolagem de HP</h4>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{hpRoll}</div>
                  <div className="text-xs text-muted-foreground">Dado</div>
                </div>
                <div className="text-2xl">+</div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{conModifier}</div>
                  <div className="text-xs text-muted-foreground">CON</div>
                </div>
                <div className="text-2xl">=</div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500">{hpRoll! + conModifier}</div>
                  <div className="text-xs text-muted-foreground">HP Ganho</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Resumo das Mudanças:</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>• Nível: {character.level} → {newLevel}</div>
                <div>• HP Máximo: {character.max_hp} → {character.max_hp + hpRoll! + conModifier}</div>
                <div>• HP Atual: {character.current_hp} → {character.current_hp + hpRoll! + conModifier}</div>
                <div>• Dados de Vida: {character.current_hit_dice}d{hitDiceSize} → {newLevel}d{hitDiceSize}</div>
                {newProficiencyBonus > character.proficiency_bonus && (
                  <div>• Bônus de Proficiência: +{character.proficiency_bonus} → +{newProficiencyBonus}</div>
                )}
                {hasSpellSlotChanges() && (
                  <div>• Espaços de magia atualizados</div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowPreview(false);
                  setHpRoll(null);
                }}
                variant="outline"
                className="flex-1"
                disabled={isLevelingUp}
              >
                Rolar Novamente
              </Button>
              <Button 
                onClick={confirmLevelUp}
                disabled={isLevelingUp}
                className="flex-1"
              >
                Confirmar Level Up
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
