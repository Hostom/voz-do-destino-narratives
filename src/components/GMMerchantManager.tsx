import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Trash2, Power, PowerOff } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface MerchantItem {
  id: string;
  item_name: string;
  current_price: number;
  stock: number;
  rarity: string;
}

interface GMerchantManagerProps {
  roomId: string;
}

export function GMMerchantManager({ roomId }: GMerchantManagerProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<MerchantItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [merchantActive, setMerchantActive] = useState(false);
  const [formData, setFormData] = useState({
    item_name: "",
    item_type: "misc",
    description: "",
    base_price: 10,
    stock: -1,
    weight: 0,
    rarity: "common",
  });

  useEffect(() => {
    loadItems();
    loadMerchantStatus();

    const channel = supabase
      .channel(`merchant-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        () => {
          loadMerchantStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadItems = async () => {
    const { data } = await supabase
      .from("merchant_items")
      .select("*")
      .eq("room_id", roomId)
      .order("rarity");

    if (data) {
      setItems(data);
    }
  };

  const loadMerchantStatus = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("merchant_active")
      .eq("id", roomId)
      .single();

    if (data) {
      setMerchantActive(data.merchant_active);
    }
  };

  const toggleMerchant = async () => {
    try {
      const newStatus = !merchantActive;
      
      const { error } = await supabase
        .from("rooms")
        .update({ merchant_active: newStatus })
        .eq("id", roomId);

      if (error) throw error;

      setMerchantActive(newStatus);

      toast({
        title: newStatus ? "🏪 Mercador Aberto!" : "Mercador Fechado",
        description: newStatus 
          ? "Os jogadores agora podem ver e comprar os itens disponíveis" 
          : "O mercador não está mais disponível para os jogadores",
      });
    } catch (error) {
      console.error("Error toggling merchant:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do mercador",
        variant: "destructive",
      });
    }
  };

  const handleAddItem = async () => {
    if (!formData.item_name) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do item",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("merchant_items").insert({
        room_id: roomId,
        ...formData,
        current_price: formData.base_price,
      });

      if (error) throw error;

      toast({
        title: "Item adicionado!",
        description: `${formData.item_name} foi adicionado ao mercador`,
      });

      setIsDialogOpen(false);
      setFormData({
        item_name: "",
        item_type: "misc",
        description: "",
        base_price: 10,
        stock: -1,
        weight: 0,
        rarity: "common",
      });
      loadItems();
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from("merchant_items").delete().eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Item removido",
        description: "O item foi removido do mercador",
      });

      loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive",
      });
    }
  };

  const quickItems = [
    { name: "Poção de Cura Menor", type: "potion", price: 50, rarity: "common", weight: 0.5 },
    { name: "Ervas Medicinais", type: "misc", price: 5, rarity: "common", weight: 0.1 },
    { name: "Frasco Vazio", type: "misc", price: 2, rarity: "common", weight: 0.2 },
    { name: "Espada Longa", type: "weapon", price: 15, rarity: "common", weight: 3 },
    { name: "Armadura de Couro", type: "armor", price: 10, rarity: "common", weight: 10 },
    { name: "Lingote de Mithral", type: "misc", price: 100, rarity: "uncommon", weight: 1 },
    { name: "Gema Encantada", type: "misc", price: 150, rarity: "uncommon", weight: 0.1 },
  ];

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Gerenciar Mercador
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={merchantActive ? "default" : "secondary"}>
              {merchantActive ? "Aberto" : "Fechado"}
            </Badge>
            <Switch
              checked={merchantActive}
              onCheckedChange={toggleMerchant}
            />
          </div>
        </div>
        
        {merchantActive && (
          <div className="flex items-center gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Item ao Mercador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs mb-2 block">Templates Rápidos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {quickItems.map((item) => (
                      <Button
                        key={item.name}
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setFormData({
                            item_name: item.name,
                            item_type: item.type,
                            description: "",
                            base_price: item.price,
                            stock: -1,
                            weight: item.weight,
                            rarity: item.rarity,
                          })
                        }
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Item</Label>
                  <Input
                    value={formData.item_name}
                    onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.item_type}
                      onValueChange={(v) => setFormData({ ...formData, item_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weapon">Arma</SelectItem>
                        <SelectItem value="armor">Armadura</SelectItem>
                        <SelectItem value="potion">Poção</SelectItem>
                        <SelectItem value="misc">Diversos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Raridade</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(v) => setFormData({ ...formData, rarity: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="common">Common</SelectItem>
                        <SelectItem value="uncommon">Uncommon</SelectItem>
                        <SelectItem value="rare">Rare</SelectItem>
                        <SelectItem value="very_rare">Very Rare</SelectItem>
                        <SelectItem value="legendary">Legendary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Preço (PO)</Label>
                    <Input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) =>
                        setFormData({ ...formData, base_price: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estoque (-1 = infinito)</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) || -1 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Peso (lb)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddItem} className="w-full">
                  Adicionar ao Mercador
                </Button>
              </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!merchantActive ? (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Mercador fechado</p>
            <p className="text-xs mt-1">Ative o mercador para adicionar itens</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum item adicionado. Adicione itens para os jogadores comprarem!
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.current_price} PO • {item.stock === -1 ? "∞" : item.stock} estoque
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
