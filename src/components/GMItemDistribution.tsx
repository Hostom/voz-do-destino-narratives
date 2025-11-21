import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Gift } from "lucide-react";

interface GMItemDistributionProps {
  roomId: string;
  players: Array<{ character_id: string; character_name: string }>;
}

export function GMItemDistribution({ roomId, players }: GMItemDistributionProps) {
  const { toast } = useToast();
  const [selectedCharacter, setSelectedCharacter] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState("misc");
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(0);
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDistribute = async () => {
    if (!selectedCharacter || !itemName) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um personagem e informe o nome do item",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Insert item reward
      const { error: rewardError } = await supabase
        .from("item_rewards")
        .insert({
          room_id: roomId,
          character_id: selectedCharacter,
          item_name: itemName,
          item_type: itemType,
          quantity,
          weight,
          description,
          reason,
          awarded_by: user.id,
          auto_added: false,
        });

      if (rewardError) throw rewardError;

      // Automatically add to character inventory
      const { error: inventoryError } = await supabase
        .from("character_items")
        .insert({
          character_id: selectedCharacter,
          item_name: itemName,
          item_type: itemType,
          quantity,
          weight,
          description,
        });

      if (inventoryError) throw inventoryError;

      // Update the reward to mark it as auto-added
      await supabase
        .from("item_rewards")
        .update({ auto_added: true })
        .eq("character_id", selectedCharacter)
        .eq("item_name", itemName)
        .is("auto_added", false);

      toast({
        title: "Item distribuído!",
        description: `${itemName} foi adicionado ao inventário do personagem.`,
      });

      // Reset form
      setItemName("");
      setQuantity(1);
      setWeight(0);
      setDescription("");
      setReason("");
    } catch (error) {
      console.error("Error distributing item:", error);
      toast({
        title: "Erro ao distribuir item",
        description: "Não foi possível adicionar o item ao inventário",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Distribuir Loot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Personagem</Label>
          <Select value={selectedCharacter} onValueChange={setSelectedCharacter}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um personagem" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.character_id} value={player.character_id}>
                  {player.character_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nome do Item *</Label>
          <Input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Ex: Espada Longa +1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weapon">Arma</SelectItem>
                <SelectItem value="armor">Armadura</SelectItem>
                <SelectItem value="potion">Poção</SelectItem>
                <SelectItem value="scroll">Pergaminho</SelectItem>
                <SelectItem value="misc">Diversos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Peso (lb)</Label>
          <Input
            type="number"
            step={0.1}
            min={0}
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição do item..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Motivo da Recompensa</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Loot da batalha contra o dragão"
          />
        </div>

        <Button
          onClick={handleDistribute}
          disabled={isSubmitting || !selectedCharacter || !itemName}
          className="w-full"
        >
          {isSubmitting ? "Distribuindo..." : "Distribuir Item"}
        </Button>
      </CardContent>
    </Card>
  );
}
