import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dices, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Character {
  id: string;
  name: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiency_bonus: number;
  saving_throws: any;
}

interface CheckRequest {
  id: string;
  check_type: string;
  ability: string;
  dc: number;
  description: string | null;
}

interface AbilityCheckPanelProps {
  roomId: string;
  character: Character;
}

export const AbilityCheckPanel = ({ roomId, character }: AbilityCheckPanelProps) => {
  const [checkType, setCheckType] = useState<"ability" | "saving_throw">("ability");
  const [ability, setAbility] = useState<string>("strength");
  const [rollMode, setRollMode] = useState<"normal" | "advantage" | "disadvantage">("normal");
  const [pendingRequests, setPendingRequests] = useState<CheckRequest[]>([]);
  const { toast } = useToast();

  const abilityLabels: Record<string, string> = {
    strength: "Força",
    dexterity: "Destreza",
    constitution: "Constituição",
    intelligence: "Inteligência",
    wisdom: "Sabedoria",
    charisma: "Carisma",
  };

  const checkTypeLabels = {
    ability: "Teste de Habilidade",
    saving_throw: "Teste de Resistência",
  };

  useEffect(() => {
    loadPendingRequests();

    const channel = supabase
      .channel(`check-requests-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_requests',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadPendingRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, character.id]);

  const loadPendingRequests = async () => {
    const { data, error } = await supabase
      .from('check_requests')
      .select('*')
      .eq('room_id', roomId)
      .eq('completed', false)
      .or(`target_character_id.eq.${character.id},target_all.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading check requests:', error);
      return;
    }

    setPendingRequests(data || []);
  };

  const calculateModifier = (abilityScore: number): number => {
    return Math.floor((abilityScore - 10) / 2);
  };

  const rollDice = (sides: number): number => {
    return Math.floor(Math.random() * sides) + 1;
  };

  const makeCheck = async (requestId?: string, requestedAbility?: string, requestedType?: string, dc?: number) => {
    const finalAbility = requestedAbility || ability;
    const finalCheckType = requestedType || checkType;
    
    const abilityScore = character[finalAbility as keyof Character] as number;
    let modifier = calculateModifier(abilityScore);

    // Add proficiency for saving throws if proficient
    if (finalCheckType === "saving_throw" && character.saving_throws?.[finalAbility]) {
      modifier += character.proficiency_bonus;
    }

    let roll1 = rollDice(20);
    let roll2 = rollMode !== "normal" ? rollDice(20) : roll1;
    let finalRoll: number;

    if (rollMode === "advantage") {
      finalRoll = Math.max(roll1, roll2);
    } else if (rollMode === "disadvantage") {
      finalRoll = Math.min(roll1, roll2);
    } else {
      finalRoll = roll1;
    }

    const total = finalRoll + modifier;
    const success = dc ? total >= dc : undefined;

    const { error } = await supabase
      .from('ability_checks')
      .insert({
        room_id: roomId,
        character_id: character.id,
        character_name: character.name,
        check_type: finalCheckType,
        ability: finalAbility,
        dc: dc || null,
        roll_result: finalRoll,
        modifier,
        total,
        advantage: rollMode === "advantage",
        disadvantage: rollMode === "disadvantage",
        success,
        requested_by_gm: !!requestId,
      });

    if (error) {
      toast({
        title: "Erro ao realizar teste",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Mark request as completed if it was a GM request
    if (requestId) {
      await supabase
        .from('check_requests')
        .update({ completed: true })
        .eq('id', requestId);
    }

    const resultText = dc 
      ? (success ? "SUCESSO!" : "FALHA!")
      : `Total: ${total}`;

    toast({
      title: `${checkTypeLabels[finalCheckType as keyof typeof checkTypeLabels]} - ${abilityLabels[finalAbility]}`,
      description: `🎲 Rolagem: ${finalRoll} + ${modifier} = ${total}\n${resultText}`,
    });

    // Envia resultado para o chat do GM E notifica os jogadores
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const rollDetails = rollMode !== "normal" 
        ? ` (${rollMode === "advantage" ? "Vantagem" : "Desvantagem"}: ${roll1}, ${roll2})`
        : "";
      
      const message = `🎲 ${checkTypeLabels[finalCheckType as keyof typeof checkTypeLabels]} de ${abilityLabels[finalAbility]}: ${finalRoll} + ${modifier} = **${total}**${rollDetails}${dc ? ` - ${resultText}` : ""}`;
      
      // 1. Envia para o chat dos jogadores (notificação pública)
      await supabase.from("room_chat_messages").insert({
        room_id: roomId,
        user_id: user.id,
        character_name: character.name,
        message: message,
      });

      // 2. Envia para o chat do GM (para o mestre ter contexto)
      await supabase.from("gm_messages").insert({
        room_id: roomId,
        player_id: user.id,
        character_name: character.name,
        sender: "player",
        content: message,
        type: "gm",
      });

      // 3. Chama a IA para processar a rolagem e responder
      console.log('Calling game-master for ability check:', { roomId, characterName: character.name, message });
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/game-master`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            roomId: roomId,
            characterName: character.name,
          }),
        });

        if (!response.ok) {
          console.error('Game master response error:', response.status);
        } else {
          // Consome o stream para garantir que a função execute completamente
          const reader = response.body?.getReader();
          if (reader) {
            while (true) {
              const { done } = await reader.read();
              if (done) break;
            }
          }
          console.log('Game-master function invoked successfully for ability check');
        }
      } catch (error) {
        console.error('Error calling game-master:', error);
      }
    }

    setRollMode("normal");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dices className="h-5 w-5" />
          Testes de Habilidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-primary">Testes Solicitados</Label>
            {pendingRequests.map((request) => (
              <Card key={request.id} className="p-3 bg-primary/5 border-primary/20">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {checkTypeLabels[request.check_type as keyof typeof checkTypeLabels]} - {abilityLabels[request.ability]}
                      </p>
                      {request.description && (
                        <p className="text-xs text-muted-foreground mt-1">{request.description}</p>
                      )}
                      <Badge variant="outline" className="mt-1">DC {request.dc}</Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => makeCheck(request.id, request.ability, request.check_type, request.dc)}
                    >
                      Rolar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Manual Check */}
        <div className="space-y-3">
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
                    {label} ({calculateModifier(character[key as keyof Character] as number) >= 0 ? '+' : ''}{calculateModifier(character[key as keyof Character] as number)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modo de Rolagem</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={rollMode === "normal" ? "default" : "outline"}
                onClick={() => setRollMode("normal")}
                className="w-full"
                size="sm"
              >
                Normal
              </Button>
              <Button
                variant={rollMode === "advantage" ? "default" : "outline"}
                onClick={() => setRollMode("advantage")}
                className="w-full"
                size="sm"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Vantagem
              </Button>
              <Button
                variant={rollMode === "disadvantage" ? "default" : "outline"}
                onClick={() => setRollMode("disadvantage")}
                className="w-full"
                size="sm"
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                Desvantagem
              </Button>
            </div>
          </div>

          <Button onClick={() => makeCheck()} className="w-full" size="lg">
            <Dices className="h-4 w-4 mr-2" />
            Realizar Teste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
