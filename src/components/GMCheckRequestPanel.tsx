import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Users } from "lucide-react";
import { RoomPlayer } from "@/hooks/useRoom";

interface GMCheckRequestPanelProps {
  roomId: string;
  players: RoomPlayer[];
  gmId: string;
}

export const GMCheckRequestPanel = ({ roomId, players, gmId }: GMCheckRequestPanelProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [checkType, setCheckType] = useState<"ability" | "saving_throw">("ability");
  const [ability, setAbility] = useState<string>("strength");
  const [dc, setDc] = useState<number>(15);
  const [description, setDescription] = useState<string>("");
  const [targetType, setTargetType] = useState<"all" | "single">("all");
  const [targetCharacterId, setTargetCharacterId] = useState<string>("");
  const { toast } = useToast();

  const abilityLabels: Record<string, string> = {
    strength: "Força",
    dexterity: "Destreza",
    constitution: "Constituição",
    intelligence: "Inteligência",
    wisdom: "Sabedoria",
    charisma: "Carisma",
  };

  const requestCheck = async () => {
    if (targetType === "single" && !targetCharacterId) {
      toast({
        title: "Erro",
        description: "Selecione um personagem alvo",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('check_requests')
      .insert({
        room_id: roomId,
        target_character_id: targetType === "single" ? targetCharacterId : null,
        target_all: targetType === "all",
        check_type: checkType,
        ability: ability,
        dc: dc,
        description: description || null,
        created_by: gmId,
      });

    if (error) {
      toast({
        title: "Erro ao solicitar teste",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Teste Solicitado!",
      description: `Teste de ${abilityLabels[ability]} solicitado aos jogadores`,
    });

    // Reset form
    setDescription("");
    setTargetType("all");
    setTargetCharacterId("");
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <UserCheck className="h-4 w-4 mr-2" />
          Solicitar Teste aos Jogadores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Teste</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Teste</Label>
            <Select value={checkType} onValueChange={(v: any) => setCheckType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ability">Teste de Habilidade</SelectItem>
                <SelectItem value="saving_throw">Teste de Resistência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Habilidade</Label>
            <Select value={ability} onValueChange={setAbility}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(abilityLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>DC (Classe de Dificuldade)</Label>
            <Input
              type="number"
              value={dc}
              onChange={(e) => setDc(parseInt(e.target.value) || 10)}
              min="1"
              max="30"
            />
          </div>

          <div className="space-y-2">
            <Label>Alvo</Label>
            <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Todos os Jogadores
                  </div>
                </SelectItem>
                <SelectItem value="single">Jogador Específico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === "single" && (
            <div className="space-y-2">
              <Label>Selecionar Jogador</Label>
              <Select value={targetCharacterId} onValueChange={setTargetCharacterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um jogador" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.character_id} value={player.character_id}>
                      {player.characters?.name || "Sem nome"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Teste para resistir ao veneno..."
              rows={3}
            />
          </div>

          <Button onClick={requestCheck} className="w-full">
            <UserCheck className="h-4 w-4 mr-2" />
            Enviar Solicitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
