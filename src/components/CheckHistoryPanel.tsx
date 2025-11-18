import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle2, XCircle } from "lucide-react";

interface AbilityCheck {
  id: string;
  character_name: string;
  check_type: string;
  ability: string;
  dc: number | null;
  roll_result: number;
  modifier: number;
  total: number;
  advantage: boolean;
  disadvantage: boolean;
  success: boolean | null;
  description: string | null;
  is_secret: boolean;
  created_at: string;
}

interface CheckHistoryPanelProps {
  roomId: string;
}

export const CheckHistoryPanel = ({ roomId }: CheckHistoryPanelProps) => {
  const [checks, setChecks] = useState<AbilityCheck[]>([]);

  const abilityLabels: Record<string, string> = {
    strength: "Força",
    dexterity: "Destreza",
    constitution: "Constituição",
    intelligence: "Inteligência",
    wisdom: "Sabedoria",
    charisma: "Carisma",
  };

  const checkTypeLabels = {
    ability: "Habilidade",
    saving_throw: "Resistência",
    skill: "Perícia",
  };

  useEffect(() => {
    loadChecks();

    const channel = supabase
      .channel(`ability-checks-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ability_checks',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadChecks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadChecks = async () => {
    const { data, error } = await supabase
      .from('ability_checks')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading checks:', error);
      return;
    }

    setChecks(data || []);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histórico de Testes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {checks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum teste realizado ainda
              </p>
            ) : (
              checks.map((check) => (
                <Card key={check.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{check.character_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {checkTypeLabels[check.check_type as keyof typeof checkTypeLabels]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {abilityLabels[check.ability]}
                          </span>
                        </div>
                        {check.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {check.description}
                          </p>
                        )}
                      </div>
                      {check.success !== null && (
                        <div className="flex items-center gap-1">
                          {check.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-mono">
                        🎲 {check.roll_result} + {check.modifier} = <span className="font-semibold">{check.total}</span>
                      </span>
                      {check.dc && (
                        <Badge variant={check.success ? "default" : "destructive"} className="text-xs">
                          DC {check.dc}
                        </Badge>
                      )}
                      {check.advantage && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Vantagem
                        </Badge>
                      )}
                      {check.disadvantage && (
                        <Badge variant="outline" className="text-xs text-red-600">
                          Desvantagem
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
