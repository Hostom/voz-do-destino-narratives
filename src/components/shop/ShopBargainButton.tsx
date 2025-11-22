import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Coins, Dices } from "lucide-react";
import { ShopItem, Personality } from "@/lib/shop-pricing";

interface ShopBargainButtonProps {
  item: ShopItem;
  characterId: string;
  roomId: string;
  npcPersonality: Personality;
  npcReputation: number;
  onSuccess: (newPrice: number) => void;
}

export const ShopBargainButton = ({ 
  item, 
  characterId, 
  roomId,
  npcPersonality,
  npcReputation,
  onSuccess 
}: ShopBargainButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [hasBargained, setHasBargained] = useState(false);

  const handleBargain = async () => {
    setLoading(true);
    
    try {
      // Get character data
      const { data: character, error: charError } = await supabase
        .from("characters")
        .select("name, charisma, proficiency_bonus, saving_throws")
        .eq("id", characterId)
        .single();

      if (charError) throw charError;

      // Calculate modifier (Charisma modifier + proficiency if proficient in Persuasion)
      const charismaModifier = Math.floor((character.charisma - 10) / 2);
      const savingThrows = character.saving_throws as any || {};
      const isProficient = savingThrows.charisma === true;
      const modifier = charismaModifier + (isProficient ? character.proficiency_bonus : 0);

      // Roll d20
      const rollResult = Math.floor(Math.random() * 20) + 1;
      const total = rollResult + modifier;

      // Calculate DC based on NPC personality and item rarity
      let baseDC = 15;
      if (npcPersonality === "friendly") baseDC = 12;
      if (npcPersonality === "hostile") baseDC = 18;
      
      // Adjust DC by rarity
      if (item.rarity === "uncommon") baseDC += 2;
      if (item.rarity === "rare") baseDC += 4;
      if (item.rarity === "epic") baseDC += 6;
      if (item.rarity === "legendary") baseDC += 8;

      const success = total >= baseDC;

      // Calculate discount
      let discountPercent = 0;
      if (success) {
        // Better rolls = better discounts
        const margin = total - baseDC;
        discountPercent = Math.min(5 + margin * 2, 25); // 5-25% discount
      }

      const newPrice = Math.round(item.finalPrice * (1 - discountPercent / 100));

      // Log the ability check
      await supabase.from("ability_checks").insert({
        character_id: characterId,
        character_name: character.name,
        room_id: roomId,
        ability: "charisma",
        check_type: "Persuasão",
        roll_result: rollResult,
        modifier: modifier,
        total: total,
        dc: baseDC,
        success: success,
        description: `Barganha por ${item.name}`,
      });

      if (success) {
        toast({
          title: "🎲 Sucesso na Barganha!",
          description: `Você conseguiu ${discountPercent}% de desconto! Novo preço: ${newPrice} PO`,
        });
        onSuccess(newPrice);
      } else {
        toast({
          title: "🎲 Falha na Barganha",
          description: `O mercador não aceitou sua oferta. (${total} vs DC ${baseDC})`,
          variant: "destructive",
        });
      }

      setHasBargained(true);
    } catch (error) {
      console.error("Error bargaining:", error);
      toast({
        title: "Erro",
        description: "Não foi possível realizar a barganha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={handleBargain}
      disabled={loading || hasBargained}
    >
      <Dices className="h-4 w-4 mr-2" />
      {loading ? "Barganhando..." : hasBargained ? "Já tentou barganhar" : "Barganhar (Persuasão)"}
    </Button>
  );
};
