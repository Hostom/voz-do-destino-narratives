import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Coins, Package, Plus, Trash2, Weight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InventoryItem {
  id: string;
  item_name: string;
  item_type: string;
  quantity: number;
  weight: number;
  description: string | null;
  equipped: boolean;
}

interface Currency {
  copper_pieces: number;
  silver_pieces: number;
  electrum_pieces: number;
  gold_pieces: number;
  platinum_pieces: number;
}

interface InventoryPanelProps {
  characterId: string;
  carryingCapacity: number;
}

export const InventoryPanel = ({ characterId, carryingCapacity }: InventoryPanelProps) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [currency, setCurrency] = useState<Currency>({
    copper_pieces: 0,
    silver_pieces: 0,
    electrum_pieces: 0,
    gold_pieces: 0,
    platinum_pieces: 0,
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    item_name: "",
    item_type: "misc",
    quantity: 1,
    weight: 0,
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadInventory();
    loadCurrency();

    const channel = supabase
      .channel(`inventory-${characterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_items',
          filter: `character_id=eq.${characterId}`
        },
        () => {
          loadInventory();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'characters',
          filter: `id=eq.${characterId}`
        },
        () => {
          loadCurrency();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [characterId]);

  const loadInventory = async () => {
    const { data, error } = await supabase
      .from('character_items')
      .select('*')
      .eq('character_id', characterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading inventory:', error);
      return;
    }

    setItems(data || []);
  };

  const loadCurrency = async () => {
    const { data, error } = await supabase
      .from('characters')
      .select('copper_pieces, silver_pieces, electrum_pieces, gold_pieces, platinum_pieces')
      .eq('id', characterId)
      .single();

    if (error) {
      console.error('Error loading currency:', error);
      return;
    }

    setCurrency(data);
  };

  const addItem = async () => {
    if (!newItem.item_name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do item é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('character_items')
      .insert({
        character_id: characterId,
        ...newItem,
      });

    if (error) {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item adicionado!",
      description: `${newItem.item_name} foi adicionado ao inventário`,
    });

    setNewItem({
      item_name: "",
      item_type: "misc",
      quantity: 1,
      weight: 0,
      description: "",
    });
    setIsAddDialogOpen(false);
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from('character_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Item removido",
      description: "Item foi removido do inventário",
    });
  };

  const updateCurrency = async (field: keyof Currency, value: number) => {
    const { error } = await supabase
      .from('characters')
      .update({ [field]: Math.max(0, value) })
      .eq('id', characterId);

    if (error) {
      toast({
        title: "Erro ao atualizar moedas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const isOverencumbered = totalWeight > carryingCapacity;

  const itemTypeLabels: Record<string, string> = {
    weapon: "Arma",
    armor: "Armadura",
    potion: "Poção",
    magic_item: "Item Mágico",
    misc: "Diversos",
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Inventário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Coins className="h-4 w-4" />
            Moedas
          </div>
          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PC</Label>
              <Input
                type="number"
                value={currency.copper_pieces}
                onChange={(e) => updateCurrency('copper_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PP</Label>
              <Input
                type="number"
                value={currency.silver_pieces}
                onChange={(e) => updateCurrency('silver_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PE</Label>
              <Input
                type="number"
                value={currency.electrum_pieces}
                onChange={(e) => updateCurrency('electrum_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PO</Label>
              <Input
                type="number"
                value={currency.gold_pieces}
                onChange={(e) => updateCurrency('gold_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">PL</Label>
              <Input
                type="number"
                value={currency.platinum_pieces}
                onChange={(e) => updateCurrency('platinum_pieces', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Weight */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4" />
            <span>Peso Total:</span>
          </div>
          <span className={isOverencumbered ? "text-destructive font-semibold" : ""}>
            {totalWeight.toFixed(1)} / {carryingCapacity} lb
          </span>
        </div>

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Itens</span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Item</Label>
                    <Input
                      value={newItem.item_name}
                      onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                      placeholder="Ex: Poção de Cura"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newItem.item_type}
                      onValueChange={(value) => setNewItem({ ...newItem, item_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weapon">Arma</SelectItem>
                        <SelectItem value="armor">Armadura</SelectItem>
                        <SelectItem value="potion">Poção</SelectItem>
                        <SelectItem value="magic_item">Item Mágico</SelectItem>
                        <SelectItem value="misc">Diversos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peso (lb)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={newItem.weight}
                        onChange={(e) => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Descrição do item..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={addItem} className="w-full">
                    Adicionar Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum item no inventário
                </p>
              ) : (
                items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.item_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({itemTypeLabels[item.item_type]})
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Qtd: {item.quantity}</span>
                          <span>Peso: {(item.weight * item.quantity).toFixed(1)} lb</span>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteItem(item.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
