import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowUp, Store, Package } from "lucide-react";

interface GMStageManagerProps {
  roomId: string;
  currentStage: number;
  campaignType: string;
  onStageUpdate: (newStage: number) => void;
}

export function GMStageManager({ roomId, currentStage, campaignType, onStageUpdate }: GMStageManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRestocking, setIsRestocking] = useState(false);
  const [newStage, setNewStage] = useState(currentStage);

  const handleAdvanceStage = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ story_stage: newStage })
        .eq('id', roomId);

      if (error) throw error;

      toast.success(`Estágio avançado para ${newStage}! Novos itens desbloqueados.`);
      onStageUpdate(newStage);
    } catch (error) {
      console.error('Error updating stage:', error);
      toast.error('Erro ao atualizar estágio');
    } finally {
      setIsUpdating(false);
    }
  };


  const handleRestock = async () => {
    setIsRestocking(true);
    try {
      const { error } = await supabase.functions.invoke('restock-shop', {
        body: { roomId }
      });

      if (error) throw error;

      toast.success('Todas as lojas foram reabastecidas!');
    } catch (error) {
      console.error('Error restocking:', error);
      toast.error('Erro ao reabastecer lojas');
    } finally {
      setIsRestocking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Gerenciar Progressão da História
        </CardTitle>
        <CardDescription>
          Controle o estágio da campanha para desbloquear novos itens nas lojas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stage Management */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Estágio Atual</Label>
              <p className="text-2xl font-bold text-primary">{currentStage}</p>
              <p className="text-sm text-muted-foreground">Campanha: {campaignType}</p>
            </div>
            <ArrowUp className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newStage">Novo Estágio</Label>
            <div className="flex gap-2">
              <Input
                id="newStage"
                type="number"
                min={1}
                max={20}
                value={newStage}
                onChange={(e) => setNewStage(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <Button
                onClick={handleAdvanceStage}
                disabled={isUpdating || newStage <= currentStage}
                className="flex-1"
              >
                {isUpdating ? 'Atualizando...' : 'Avançar Estágio'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Estágios mais altos desbloqueiam itens mais poderosos
            </p>
          </div>
        </div>

        {/* Restock Button */}
        <div className="space-y-3 pt-4 border-t">
          <Label>Gerenciar Estoque</Label>
          <Button 
            onClick={handleRestock} 
            disabled={isRestocking}
            variant="secondary"
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            {isRestocking ? 'Reabastecendo...' : 'Reabastecer Todas as Lojas'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Restaura o estoque de todos os itens nas lojas da campanha
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
