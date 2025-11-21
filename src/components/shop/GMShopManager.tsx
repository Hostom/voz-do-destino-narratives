import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ShopItem, Rarity } from "@/lib/shop-pricing";

interface GMShopManagerProps {
  roomId: string;
}

const QUICK_ITEMS = [
  { name: "Poção de Cura", basePrice: 50, quality: "normal", rarity: "common", category: "Poção", description: "Restaura 2d4+2 HP" },
  { name: "Poção de Cura Superior", basePrice: 200, quality: "refined", rarity: "uncommon", category: "Poção", description: "Restaura 4d4+4 HP" },
  { name: "Espada Longa", basePrice: 15, quality: "normal", rarity: "common", category: "Arma", description: "1d8 de dano cortante" },
  { name: "Arco Longo", basePrice: 50, quality: "normal", rarity: "common", category: "Arma", description: "1d8 de dano perfurante" },
  { name: "Armadura de Couro", basePrice: 10, quality: "normal", rarity: "common", category: "Armadura", description: "CA 11 + modificador de Destreza" },
];

export function GMShopManager({ roomId }: GMShopManagerProps) {
  const { toast } = useToast();
  const [npcName, setNpcName] = useState("Mercador");
  const [npcDescription, setNpcDescription] = useState("Um mercador viajante com mercadorias variadas.");
  const [npcPersonality, setNpcPersonality] = useState<"friendly" | "neutral" | "hostile">("neutral");
  const [npcReputation, setNpcReputation] = useState(0);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(10);
  const [newItemRarity, setNewItemRarity] = useState<Rarity>("common");
  const [newItemCategory, setNewItemCategory] = useState("Misc");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemStock, setNewItemStock] = useState(-1);

  const handleAddItem = () => {
    if (!newItemName) {
      toast({
        title: "Erro",
        description: "O item precisa ter um nome",
        variant: "destructive",
      });
      return;
    }

    const newItem: ShopItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newItemName,
      basePrice: newItemPrice,
      finalPrice: newItemPrice, // Will be recalculated by ShopPanel
      rarity: newItemRarity,
      quality: "normal",
      category: newItemCategory,
      description: newItemDescription,
      stock: newItemStock,
      attributes: {},
    };

    setItems([...items, newItem]);
    
    // Reset form
    setNewItemName("");
    setNewItemPrice(10);
    setNewItemRarity("common");
    setNewItemCategory("Misc");
    setNewItemDescription("");
    setNewItemStock(-1);
    
    toast({
      title: "Item adicionado",
      description: `${newItem.name} foi adicionado à loja`,
    });
  };

  const handleAddQuickItem = (quickItem: any) => {
    const newItem: ShopItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...quickItem,
      finalPrice: quickItem.basePrice, // Will be recalculated by ShopPanel
      stock: -1,
      attributes: {},
    };
    setItems([...items, newItem]);
    toast({
      title: "Item adicionado",
      description: `${newItem.name} foi adicionado à loja`,
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
    toast({
      title: "Item removido",
      description: "O item foi removido da loja",
    });
  };

  const handleSaveShop = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error("Você precisa estar autenticado");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/set-shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          roomId,
          npcName,
          npcDescription,
          npcPersonality,
          npcReputation,
          items,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar loja');
      }

      const result = await response.json();
      
      toast({
        title: "Loja salva!",
        description: result.message || "A loja foi atualizada com sucesso",
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving shop:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao salvar loja",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearShop = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        throw new Error("Você precisa estar autenticado");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/set-shop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          roomId,
          npcName: "Loja Fechada",
          npcDescription: "Não há mercador disponível no momento.",
          npcPersonality: "neutral",
          npcReputation: 0,
          items: [],
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao limpar loja');
      }

      setItems([]);
      toast({
        title: "Loja limpa",
        description: "A loja foi esvaziada",
      });
    } catch (error) {
      console.error('Error clearing shop:', error);
      toast({
        title: "Erro",
        description: "Falha ao limpar loja",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Gerenciar Loja
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Store className="mr-2 h-4 w-4" />
                Configurar Loja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configurar Loja da Sala</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* NPC Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Informações do Mercador</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do NPC</Label>
                      <Input
                        value={npcName}
                        onChange={(e) => setNpcName(e.target.value)}
                        placeholder="Ex: Guildas, o Mercador"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Personalidade</Label>
                      <Select value={npcPersonality} onValueChange={(v: any) => setNpcPersonality(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="friendly">Amigável (-10% preços)</SelectItem>
                          <SelectItem value="neutral">Neutro</SelectItem>
                          <SelectItem value="hostile">Hostil (+15% preços)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={npcDescription}
                      onChange={(e) => setNpcDescription(e.target.value)}
                      placeholder="Descreva o mercador..."
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Reputação (0-25, afeta preços)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={25}
                      value={npcReputation}
                      onChange={(e) => setNpcReputation(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Quick Items */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Itens Rápidos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_ITEMS.map((item) => (
                      <Button
                        key={item.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddQuickItem(item)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Add Item Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Adicionar Item Customizado</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Nome do item"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Preço (PO)</Label>
                      <Input
                        type="number"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Raridade</Label>
                      <Select value={newItemRarity} onValueChange={(v: any) => setNewItemRarity(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="common">Comum</SelectItem>
                          <SelectItem value="uncommon">Incomum</SelectItem>
                          <SelectItem value="rare">Raro</SelectItem>
                          <SelectItem value="epic">Épico</SelectItem>
                          <SelectItem value="legendary">Lendário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estoque (-1 = infinito)</Label>
                      <Input
                        type="number"
                        value={newItemStock}
                        onChange={(e) => setNewItemStock(parseInt(e.target.value) || -1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Descrição do item"
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>

                <Separator />

                {/* Items List */}
                <div className="space-y-2">
                  <h3 className="font-semibold">Itens na Loja ({items.length})</h3>
                  <ScrollArea className="h-64 rounded-md border p-4">
                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum item adicionado ainda
                        </p>
                      ) : (
                        items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded border bg-card">
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.basePrice} PO • {item.rarity} • {item.category}
                                {item.stock >= 0 && ` • Estoque: ${item.stock}`}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveShop}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? "Salvando..." : "Salvar Loja"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClearShop}
                    disabled={isSaving}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Loja
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <p className="text-xs text-muted-foreground">
          Configure a loja da sala manualmente. Os jogadores verão os itens instantaneamente na aba LOJA.
        </p>
      </CardContent>
    </Card>
  );
}
