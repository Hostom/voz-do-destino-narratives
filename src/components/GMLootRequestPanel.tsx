import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Coins, Shield, Sword, Package, Sparkles, Dices } from "lucide-react";

interface Player {
  id: string;
  character_id: string;
  character_name: string;
}

interface GMLootRequestPanelProps {
  roomId: string;
  npcId: string;
  npcName: string;
  npcType?: string;
  players: Player[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GMLootRequestPanel = ({
  roomId,
  npcId,
  npcName,
  npcType = "humanoid",
  players,
  open,
  onOpenChange,
}: GMLootRequestPanelProps) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [dc, setDc] = useState<number>(12);
  const [itemName, setItemName] = useState("");
  const [itemType, setItemType] = useState<string>("misc");
  const [itemDescription, setItemDescription] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [weight, setWeight] = useState<number>(0);
  const [atk, setAtk] = useState<number>(0);
  const [def, setDef] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const dcPresets = [
    { label: "Fácil", value: 8, description: "Inimigos comuns" },
    { label: "Médio", value: 12, description: "Inimigos intermediários" },
    { label: "Difícil", value: 15, description: "Inimigos fortes" },
    { label: "Muito Difícil", value: 18, description: "Inimigos raros" },
  ];

  const itemTemplates = {
    goblin: { name: "Adaga Enferrujada", type: "weapon", description: "Uma adaga em más condições", weight: 1, atk: 4 },
    orc: { name: "Machado de Batalha", type: "weapon", description: "Um machado pesado de guerra", weight: 7, atk: 8 },
    skeleton: { name: "Osso Antigo", type: "misc", description: "Um osso que pode ser útil", weight: 0.5, atk: 0 },
    armor: { name: "Armadura de Couro", type: "armor", description: "Uma armadura leve", weight: 10, def: 1 },
  };

  const handleSubmit = async () => {
    if (!selectedPlayer || !itemName.trim()) {
      toast.error("Selecione um jogador e defina um item!");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const properties: any = {};
      if (itemType === "weapon" && atk > 0) properties.atk = atk;
      if (itemType === "armor" && def > 0) properties.def = def;

      const { error } = await supabase.from("loot_requests").insert({
        room_id: roomId,
        npc_id: npcId,
        npc_name: npcName,
        target_character_id: selectedPlayer,
        dc,
        item_name: itemName,
        item_type: itemType,
        item_description: itemDescription,
        quantity,
        weight,
        properties,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success(`Solicitação de vasculhamento enviada!`);
      onOpenChange(false);
      
      // Reset form
      setSelectedPlayer("");
      setItemName("");
      setItemDescription("");
      setQuantity(1);
      setWeight(0);
      setAtk(0);
      setDef(0);
    } catch (error: any) {
      console.error("Erro ao criar solicitação de loot:", error);
      toast.error("Erro ao criar solicitação de loot");
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: keyof typeof itemTemplates) => {
    const t = itemTemplates[template];
    setItemName(t.name);
    setItemType(t.type);
    setItemDescription(t.description);
    setWeight(t.weight);
    if ('atk' in t) setAtk(t.atk);
    if ('def' in t) setDef(t.def);
  };

  const generateRandomLoot = async () => {
    try {
      // Fetch loot table for this creature type
      const { data: lootOptions, error } = await supabase
        .from("loot_tables")
        .select("*")
        .eq("creature_type", npcType);

      if (error) throw error;

      if (!lootOptions || lootOptions.length === 0) {
        toast.error(`Nenhum loot configurado para tipo: ${npcType}`);
        return;
      }

      // Filter by drop chance
      const availableLoot = lootOptions.filter(
        (item) => Math.random() * 100 <= item.drop_chance
      );

      if (availableLoot.length === 0) {
        toast.info("Nenhum loot passou na verificação de chance!");
        return;
      }

      // Weight by rarity (legendary = rarer)
      const rarityWeights: Record<string, number> = {
        common: 50,
        uncommon: 25,
        rare: 15,
        very_rare: 8,
        legendary: 2,
      };

      const weightedLoot: any[] = [];
      availableLoot.forEach((item) => {
        const weight = rarityWeights[item.rarity] || 10;
        for (let i = 0; i < weight; i++) {
          weightedLoot.push(item);
        }
      });

      // Pick random item
      const selectedLoot = weightedLoot[Math.floor(Math.random() * weightedLoot.length)];

      // Generate random quantity within range
      const qty =
        selectedLoot.min_quantity +
        Math.floor(Math.random() * (selectedLoot.max_quantity - selectedLoot.min_quantity + 1));

      // Apply to form
      setItemName(selectedLoot.item_name);
      setItemType(selectedLoot.item_type);
      setItemDescription(selectedLoot.item_description || "");
      setWeight(selectedLoot.weight);
      setQuantity(qty);

      if (selectedLoot.properties?.atk) setAtk(selectedLoot.properties.atk);
      if (selectedLoot.properties?.def) setDef(selectedLoot.properties.def);

      toast.success(
        <div>
          <div className="font-bold">Loot Aleatório Gerado!</div>
          <div className="text-xs">
            {selectedLoot.item_name} ({selectedLoot.rarity})
          </div>
        </div>
      );
    } catch (error) {
      console.error("Erro ao gerar loot aleatório:", error);
      toast.error("Erro ao gerar loot aleatório");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vasculhar Corpo: {npcName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* DC Selection */}
          <div className="space-y-2">
            <Label>Dificuldade do Teste (DC)</Label>
            <div className="grid grid-cols-2 gap-2">
              {dcPresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={dc === preset.value ? "default" : "outline"}
                  onClick={() => setDc(preset.value)}
                  className="flex flex-col h-auto py-2"
                >
                  <span className="font-bold">DC {preset.value}</span>
                  <span className="text-xs opacity-80">{preset.label}</span>
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={dc}
              onChange={(e) => setDc(Number(e.target.value))}
              min={1}
              max={30}
            />
          </div>

          {/* Player Selection */}
          <div className="space-y-2">
            <Label>Jogador Alvo</Label>
            <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um jogador" />
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

          {/* Random Loot Generator */}
          <div className="space-y-2">
            <Label>Loot Aleatório (baseado no tipo: {npcType})</Label>
            <Button
              variant="default"
              onClick={generateRandomLoot}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Gerar Loot Aleatório
            </Button>
          </div>

          {/* Item Templates */}
          <div className="space-y-2">
            <Label>Templates Rápidos</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => applyTemplate("goblin")} className="justify-start">
                <Sword className="mr-2 h-4 w-4" />
                Goblin
              </Button>
              <Button variant="outline" onClick={() => applyTemplate("orc")} className="justify-start">
                <Sword className="mr-2 h-4 w-4" />
                Orc
              </Button>
              <Button variant="outline" onClick={() => applyTemplate("skeleton")} className="justify-start">
                <Package className="mr-2 h-4 w-4" />
                Esqueleto
              </Button>
              <Button variant="outline" onClick={() => applyTemplate("armor")} className="justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Armadura
              </Button>
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-2">
            <Label>Nome do Item *</Label>
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Ex: Espada Longa"
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
                  <SelectItem value="shield">Escudo</SelectItem>
                  <SelectItem value="potion">Poção</SelectItem>
                  <SelectItem value="misc">Diversos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Peso</Label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                min={0}
                step={0.1}
              />
            </div>

            {itemType === "weapon" && (
              <div className="space-y-2">
                <Label>ATK</Label>
                <Input
                  type="number"
                  value={atk}
                  onChange={(e) => setAtk(Number(e.target.value))}
                  min={0}
                />
              </div>
            )}

            {(itemType === "armor" || itemType === "shield") && (
              <div className="space-y-2">
                <Label>DEF (CA)</Label>
                <Input
                  type="number"
                  value={def}
                  onChange={(e) => setDef(Number(e.target.value))}
                  min={0}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="Descrição do item..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Enviando..." : "Solicitar Vasculhamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
