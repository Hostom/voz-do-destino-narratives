import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Hammer, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  result_item_name: string;
  result_item_type: string;
  result_quantity: number;
  result_weight: number;
  required_items: Array<{ name: string; quantity: number }>;
  difficulty_dc: number;
  rarity: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  quantity: number;
}

interface CraftingPanelProps {
  characterId: string;
  intelligence: number;
  wisdom: number;
}

export function CraftingPanel({ characterId, intelligence, wisdom }: CraftingPanelProps) {
  const { toast } = useToast();
  const [recipes, setRecipes] = useState<CraftingRecipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [crafting, setCrafting] = useState(false);

  useEffect(() => {
    loadRecipes();
    loadInventory();
  }, [characterId]);

  const loadRecipes = async () => {
    const { data } = await supabase
      .from("crafting_recipes")
      .select("*")
      .order("difficulty_dc");

    if (data) {
      setRecipes(data as any);
    }
  };

  const loadInventory = async () => {
    const { data } = await supabase
      .from("character_items")
      .select("id, item_name, quantity")
      .eq("character_id", characterId);

    if (data) {
      setInventory(data);
    }
  };

  const canCraft = (recipe: CraftingRecipe): boolean => {
    return recipe.required_items.every((req) => {
      const item = inventory.find((inv) => inv.item_name === req.name);
      return item && item.quantity >= req.quantity;
    });
  };

  const handleCraft = async (recipe: CraftingRecipe) => {
    if (!canCraft(recipe)) {
      toast({
        title: "Materiais insuficientes",
        description: "Você não possui todos os materiais necessários",
        variant: "destructive",
      });
      return;
    }

    setCrafting(true);

    try {
      // Roll skill check (using Intelligence or Wisdom, whichever is higher)
      const skillModifier = Math.floor((Math.max(intelligence, wisdom) - 10) / 2);
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + skillModifier;
      const success = total >= recipe.difficulty_dc;

      toast({
        title: `🎲 Teste de Crafting`,
        description: `Rolou ${roll} + ${skillModifier} = ${total} (DC ${recipe.difficulty_dc})`,
        duration: 3000,
      });

      if (!success) {
        // Consume half the materials on failure
        for (const req of recipe.required_items) {
          const item = inventory.find((inv) => inv.item_name === req.name);
          if (item) {
            const consumedQuantity = Math.floor(req.quantity / 2);
            if (consumedQuantity > 0) {
              if (item.quantity <= consumedQuantity) {
                await supabase.from("character_items").delete().eq("id", item.id);
              } else {
                await supabase
                  .from("character_items")
                  .update({ quantity: item.quantity - consumedQuantity })
                  .eq("id", item.id);
              }
            }
          }
        }

        toast({
          title: "❌ Crafting falhou!",
          description: "Você perdeu metade dos materiais no processo",
          variant: "destructive",
        });

        loadInventory();
        setCrafting(false);
        return;
      }

      // Success - consume materials and create item
      for (const req of recipe.required_items) {
        const item = inventory.find((inv) => inv.item_name === req.name);
        if (item) {
          if (item.quantity === req.quantity) {
            await supabase.from("character_items").delete().eq("id", item.id);
          } else {
            await supabase
              .from("character_items")
              .update({ quantity: item.quantity - req.quantity })
              .eq("id", item.id);
          }
        }
      }

      // Add crafted item
      const { data: existing } = await supabase
        .from("character_items")
        .select("*")
        .eq("character_id", characterId)
        .eq("item_name", recipe.result_item_name)
        .single();

      if (existing) {
        await supabase
          .from("character_items")
          .update({ quantity: existing.quantity + recipe.result_quantity })
          .eq("id", existing.id);
      } else {
        await supabase.from("character_items").insert({
          character_id: characterId,
          item_name: recipe.result_item_name,
          item_type: recipe.result_item_type,
          quantity: recipe.result_quantity,
          weight: recipe.result_weight,
          description: recipe.description,
        });
      }

      toast({
        title: "✅ Crafting bem-sucedido!",
        description: `Você criou ${recipe.result_item_name}!`,
      });

      loadInventory();
    } catch (error) {
      console.error("Error crafting:", error);
      toast({
        title: "Erro",
        description: "Não foi possível completar o crafting",
        variant: "destructive",
      });
    } finally {
      setCrafting(false);
    }
  };

  const rarityColors: Record<string, string> = {
    common: "bg-gray-500",
    uncommon: "bg-green-500",
    rare: "bg-blue-500",
    very_rare: "bg-purple-500",
    legendary: "bg-amber-500",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Hammer className="h-5 w-5" />
          Oficina de Crafting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {recipes.map((recipe) => {
              const canCraftThis = canCraft(recipe);
              return (
                <Card key={recipe.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{recipe.name}</h4>
                          <Badge className={rarityColors[recipe.rarity]}>
                            {recipe.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {recipe.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        DC {recipe.difficulty_dc}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Materiais Necessários:</p>
                      {recipe.required_items.map((req, idx) => {
                        const hasItem = inventory.find(
                          (inv) => inv.item_name === req.name
                        );
                        const hasEnough = hasItem && hasItem.quantity >= req.quantity;

                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs"
                          >
                            <span className={hasEnough ? "text-green-500" : "text-destructive"}>
                              {hasEnough ? <Check className="h-3 w-3 inline mr-1" /> : <X className="h-3 w-3 inline mr-1" />}
                              {req.name} x{req.quantity}
                            </span>
                            <span className="text-muted-foreground">
                              {hasItem ? `(${hasItem.quantity} disponível)` : "(0 disponível)"}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Chance de Sucesso</span>
                        <span className="font-semibold">
                          {Math.max(
                            5,
                            Math.min(
                              95,
                              ((21 + Math.floor((Math.max(intelligence, wisdom) - 10) / 2) - recipe.difficulty_dc) / 20) * 100
                            )
                          ).toFixed(0)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          5,
                          Math.min(
                            95,
                            ((21 + Math.floor((Math.max(intelligence, wisdom) - 10) / 2) - recipe.difficulty_dc) / 20) * 100
                          )
                        )}
                        className="h-1"
                      />
                    </div>

                    <Button
                      onClick={() => handleCraft(recipe)}
                      disabled={!canCraftThis || crafting}
                      className="w-full"
                      size="sm"
                    >
                      {crafting ? "Craftando..." : "Craftar Item"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
