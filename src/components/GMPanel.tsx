import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Crown, Plus, Trash2, Heart, Shield, Swords, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { GMXPDistribution } from "./GMXPDistribution";
import { GMItemDistribution } from "./GMItemDistribution";
import { GMAuctionManager } from "./GMAuctionManager";

interface NPC {
  id: string;
  room_id: string;
  name: string;
  creature_type: string;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  initiative_bonus: number;
  initiative: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  attack_bonus: number;
  damage_dice: string;
  damage_type: string;
  conditions: any;
  notes: string | null;
}

interface GMPanelProps {
  roomId: string;
  players?: any[];
}

export const GMPanel = ({ roomId, players = [] }: GMPanelProps) => {
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [gmId, setGmId] = useState<string>("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    creature_type: "humanoid",
    max_hp: 10,
    armor_class: 10,
    initiative_bonus: 0,
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    attack_bonus: 2,
    damage_dice: "1d6",
    damage_type: "cortante",
    notes: "",
  });

  useEffect(() => {
    loadNPCs();
    loadGmId();

    const channel = supabase
      .channel(`npcs-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'npcs',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadNPCs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadGmId = async () => {
    const { data } = await supabase
      .from("rooms")
      .select("gm_id")
      .eq("id", roomId)
      .single();

    if (data) {
      setGmId(data.gm_id);
    }
  };

  const loadNPCs = async () => {
    const { data, error } = await supabase
      .from("npcs")
      .select("*")
      .eq("room_id", roomId)
      .order("name");

    if (!error && data) {
      setNpcs(data);
    }
  };

  const handleCreateNPC = async () => {
    setIsCreating(true);
    try {
      const { error } = await supabase.from("npcs").insert({
        room_id: roomId,
        ...formData,
        current_hp: formData.max_hp,
      });

      if (error) throw error;

      toast({
        title: "NPC criado!",
        description: `${formData.name} foi adicionado ao encontro`,
      });

      setIsDialogOpen(false);
      setFormData({
        name: "",
        creature_type: "humanoid",
        max_hp: 10,
        armor_class: 10,
        initiative_bonus: 0,
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
        attack_bonus: 2,
        damage_dice: "1d6",
        damage_type: "cortante",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating NPC:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o NPC",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteNPC = async (npcId: string) => {
    try {
      const { error } = await supabase.from("npcs").delete().eq("id", npcId);

      if (error) throw error;

      toast({
        title: "NPC removido",
        description: "O NPC foi removido do encontro",
      });
    } catch (error) {
      console.error("Error deleting NPC:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o NPC",
        variant: "destructive",
      });
    }
  };

  const handleUpdateHP = async (npcId: string, newHp: number) => {
    try {
      const { error } = await supabase
        .from("npcs")
        .update({ current_hp: Math.max(0, newHp) })
        .eq("id", npcId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating HP:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar HP",
        variant: "destructive",
      });
    }
  };

  const toggleInspiration = async (characterId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('characters')
        .update({ inspiration: !currentValue })
        .eq('id', characterId);

      if (error) throw error;

      toast({
        title: currentValue ? "Inspiração removida" : "✨ Inspiração concedida!",
        description: currentValue 
          ? "A inspiração foi removida do jogador" 
          : "Jogador pode usar inspiração em um teste",
      });
    } catch (error) {
      console.error("Error toggling inspiration:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar inspiração",
        variant: "destructive",
      });
    }
  };

  const quickTemplates = [
    {
      name: "Goblin",
      creature_type: "goblinoid",
      max_hp: 7,
      armor_class: 15,
      initiative_bonus: 2,
      attack_bonus: 4,
      damage_dice: "1d6",
      damage_type: "perfurante",
    },
    {
      name: "Orc",
      creature_type: "orc",
      max_hp: 15,
      armor_class: 13,
      initiative_bonus: 1,
      attack_bonus: 5,
      damage_dice: "1d12",
      damage_type: "cortante",
    },
    {
      name: "Esqueleto",
      creature_type: "morto-vivo",
      max_hp: 13,
      armor_class: 13,
      initiative_bonus: 2,
      attack_bonus: 4,
      damage_dice: "1d6",
      damage_type: "perfurante",
    },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur border-amber-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Painel do Mestre
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar NPC/Inimigo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar NPC/Inimigo</DialogTitle>
                <DialogDescription>
                  Adicione criaturas, inimigos ou NPCs ao encontro
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Quick Templates */}
                <div>
                  <Label>Templates Rápidos</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {quickTemplates.map((template) => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData({ ...formData, ...template })}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Goblin Guerreiro"
                    />
                  </div>
                  <div>
                    <Label>Tipo de Criatura</Label>
                    <Input
                      value={formData.creature_type}
                      onChange={(e) => setFormData({ ...formData, creature_type: e.target.value })}
                      placeholder="Ex: humanoid, morto-vivo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>HP Máximo</Label>
                    <Input
                      type="number"
                      value={formData.max_hp}
                      onChange={(e) => setFormData({ ...formData, max_hp: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Classe de Armadura</Label>
                    <Input
                      type="number"
                      value={formData.armor_class}
                      onChange={(e) => setFormData({ ...formData, armor_class: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Bônus de Iniciativa</Label>
                    <Input
                      type="number"
                      value={formData.initiative_bonus}
                      onChange={(e) => setFormData({ ...formData, initiative_bonus: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Bônus de Ataque</Label>
                    <Input
                      type="number"
                      value={formData.attack_bonus}
                      onChange={(e) => setFormData({ ...formData, attack_bonus: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Dano (Dados)</Label>
                    <Input
                      value={formData.damage_dice}
                      onChange={(e) => setFormData({ ...formData, damage_dice: e.target.value })}
                      placeholder="1d6"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Tipo de Dano</Label>
                    <Input
                      value={formData.damage_type}
                      onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
                      placeholder="cortante, perfurante..."
                    />
                  </div>
                </div>

                <div>
                  <Label>Notas do Mestre</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Comportamento, táticas, fraquezas..."
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateNPC} disabled={isCreating || !formData.name} className="w-full">
                  Criar NPC
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {npcs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum NPC/Inimigo no encontro</p>
            <p className="text-xs mt-1">Clique em "Adicionar" para começar</p>
          </div>
        ) : (
          npcs.map((npc) => {
            const hpPercent = (npc.current_hp / npc.max_hp) * 100;
            return (
              <Card key={npc.id} className="bg-background/50 border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {npc.name}
                        <Badge variant="outline" className="text-xs">
                          {npc.creature_type}
                        </Badge>
                      </h4>
                      {npc.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{npc.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNPC(npc.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-destructive" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>HP</span>
                          <span className="font-semibold">{npc.current_hp}/{npc.max_hp}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-destructive h-1.5 rounded-full transition-all"
                            style={{ width: `${hpPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>CA: <strong>{npc.armor_class}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Swords className="w-4 h-4 text-accent" />
                      <span>+{npc.attack_bonus} | {npc.damage_dice}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateHP(npc.id, npc.current_hp - 5)}
                    >
                      -5 HP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateHP(npc.id, npc.current_hp + 5)}
                    >
                      +5 HP
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateHP(npc.id, npc.max_hp)}
                      className="ml-auto"
                    >
                      Restaurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </CardContent>

      {/* XP Distribution Panel */}
      {players.length > 0 && (
        <div className="px-6 pb-6 space-y-6">
          {/* Inspiration Management */}
          <Card className="border-accent/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Gerenciar Inspiração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {players.map((player) => player.characters && (
                <div key={player.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{player.characters.name}</span>
                    {player.characters.inspiration && (
                      <Badge variant="default" className="text-xs bg-accent text-accent-foreground">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Ativa
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={player.characters.inspiration ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleInspiration(player.characters!.id, player.characters!.inspiration)}
                  >
                    {player.characters.inspiration ? (
                      "Remover"
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        Conceder
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <GMXPDistribution roomId={roomId} players={players} />
          <GMItemDistribution 
            roomId={roomId} 
            players={players.map(p => ({
              character_id: p.characters!.id,
              character_name: p.characters!.name
            }))} 
          />
          <GMAuctionManager roomId={roomId} gmId={gmId} />
        </div>
      )}
    </Card>
  );
};
