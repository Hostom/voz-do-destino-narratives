import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Package, Plus, Trash2, Lock, Unlock } from "lucide-react";

interface InteractiveObject {
  id: string;
  object_type: string;
  name: string;
  description: string | null;
  dc: number;
  item_name: string;
  item_type: string;
  item_description: string | null;
  quantity: number;
  weight: number;
  properties: any;
  looted: boolean;
  looted_by_character_id: string | null;
}

interface GMInteractiveObjectsPanelProps {
  roomId: string;
}

export const GMInteractiveObjectsPanel = ({ roomId }: GMInteractiveObjectsPanelProps) => {
  const [objects, setObjects] = useState<InteractiveObject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    object_type: "chest",
    name: "Baú de Madeira",
    description: "Um baú de madeira trancado",
    dc: 12,
    item_name: "",
    item_type: "misc",
    item_description: "",
    quantity: 1,
    weight: 0,
    atk: 0,
    def: 0,
  });

  const objectTypeLabels: Record<string, string> = {
    chest: "Baú",
    crate: "Caixote",
    barrel: "Barril",
    corpse: "Corpo",
    altar: "Altar",
    custom: "Personalizado",
  };

  const objectTemplates = [
    { type: "chest", name: "Baú de Madeira", description: "Um baú trancado", dc: 12 },
    { type: "chest", name: "Baú de Ferro", description: "Um baú fortemente trancado", dc: 18 },
    { type: "crate", name: "Caixote de Suprimentos", description: "Um caixote com suprimentos", dc: 10 },
    { type: "barrel", name: "Barril Selado", description: "Um barril bem selado", dc: 8 },
    { type: "altar", name: "Altar Místico", description: "Um altar que irradia magia", dc: 15 },
  ];

  useEffect(() => {
    loadObjects();

    const channel = supabase
      .channel(`interactive-objects-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interactive_objects",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadObjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadObjects = async () => {
    try {
      const { data, error } = await supabase
        .from("interactive_objects")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setObjects(data || []);
    } catch (error) {
      console.error("Erro ao carregar objetos:", error);
    }
  };

  const handleCreate = async () => {
    if (!formData.item_name.trim()) {
      toast.error("Defina o item que está no objeto!");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const properties: any = {};
      if (formData.item_type === "weapon" && formData.atk > 0) properties.atk = formData.atk;
      if ((formData.item_type === "armor" || formData.item_type === "shield") && formData.def > 0) {
        properties.def = formData.def;
      }

      const { error } = await supabase.from("interactive_objects").insert({
        room_id: roomId,
        object_type: formData.object_type,
        name: formData.name,
        description: formData.description,
        dc: formData.dc,
        item_name: formData.item_name,
        item_type: formData.item_type,
        item_description: formData.item_description,
        quantity: formData.quantity,
        weight: formData.weight,
        properties,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Objeto interativo criado!");
      setDialogOpen(false);
      
      // Reset form
      setFormData({
        object_type: "chest",
        name: "Baú de Madeira",
        description: "Um baú de madeira trancado",
        dc: 12,
        item_name: "",
        item_type: "misc",
        item_description: "",
        quantity: 1,
        weight: 0,
        atk: 0,
        def: 0,
      });
    } catch (error: any) {
      console.error("Erro ao criar objeto:", error);
      toast.error("Erro ao criar objeto interativo");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (objectId: string) => {
    try {
      const { error } = await supabase
        .from("interactive_objects")
        .delete()
        .eq("id", objectId);

      if (error) throw error;
      toast.success("Objeto removido!");
    } catch (error) {
      console.error("Erro ao remover objeto:", error);
      toast.error("Erro ao remover objeto");
    }
  };

  const applyTemplate = (template: typeof objectTemplates[0]) => {
    setFormData({
      ...formData,
      object_type: template.type,
      name: template.name,
      description: template.description,
      dc: template.dc,
    });
  };

  return (
    <Card className="border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Objetos Interativos (Baús, Caixas)
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Criar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Objeto Interativo</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Templates */}
                <div className="space-y-2">
                  <Label>Templates Rápidos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {objectTemplates.map((template, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => applyTemplate(template)}
                        className="justify-start text-xs"
                      >
                        {template.name} (DC {template.dc})
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Object Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Objeto</Label>
                    <Select value={formData.object_type} onValueChange={(v) => setFormData({ ...formData, object_type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(objectTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>DC do Teste</Label>
                    <Input
                      type="number"
                      value={formData.dc}
                      onChange={(e) => setFormData({ ...formData, dc: Number(e.target.value) })}
                      min={1}
                      max={30}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Objeto *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Baú Antigo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição do Objeto</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Como o objeto aparece..."
                    rows={2}
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-semibold">Conteúdo do Objeto</h4>

                  <div className="space-y-2">
                    <Label>Item Dentro *</Label>
                    <Input
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      placeholder="Ex: Poção de Cura"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo do Item</Label>
                      <Select value={formData.item_type} onValueChange={(v) => setFormData({ ...formData, item_type: v })}>
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
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Peso</Label>
                      <Input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                        min={0}
                        step={0.1}
                      />
                    </div>

                    {formData.item_type === "weapon" && (
                      <div className="space-y-2">
                        <Label>ATK</Label>
                        <Input
                          type="number"
                          value={formData.atk}
                          onChange={(e) => setFormData({ ...formData, atk: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    )}

                    {(formData.item_type === "armor" || formData.item_type === "shield") && (
                      <div className="space-y-2">
                        <Label>DEF (CA)</Label>
                        <Input
                          type="number"
                          value={formData.def}
                          onChange={(e) => setFormData({ ...formData, def: Number(e.target.value) })}
                          min={0}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição do Item</Label>
                    <Textarea
                      value={formData.item_description}
                      onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                      placeholder="Descrição do item..."
                      rows={2}
                    />
                  </div>
                </div>

                <Button onClick={handleCreate} disabled={loading} className="w-full">
                  {loading ? "Criando..." : "Criar Objeto"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {objects.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum objeto interativo criado</p>
          </div>
        ) : (
          objects.map((obj) => (
            <Card key={obj.id} className="p-3 bg-background/50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm truncate">{obj.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {objectTypeLabels[obj.object_type]}
                    </Badge>
                    <Badge variant={obj.looted ? "secondary" : "default"} className="text-xs gap-1">
                      {obj.looted ? (
                        <>
                          <Unlock className="h-3 w-3" />
                          Saqueado
                        </>
                      ) : (
                        <>
                          <Lock className="h-3 w-3" />
                          Lacrado
                        </>
                      )}
                    </Badge>
                  </div>
                  {obj.description && (
                    <p className="text-xs text-muted-foreground mt-1">{obj.description}</p>
                  )}
                  <p className="text-xs mt-1">
                    <strong>Conteúdo:</strong> {obj.item_name} ({obj.quantity}x) | DC {obj.dc}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(obj.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </CardContent>
    </Card>
  );
};
