import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Heart, Shield, Sword, Book } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PlayerCharacter {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  armor_class: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiency_bonus: number;
}

interface GMPlayerViewerProps {
  roomId: string;
}

const calculateModifier = (score: number): string => {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

export const GMPlayerViewer = ({ roomId }: GMPlayerViewerProps) => {
  const [players, setPlayers] = useState<PlayerCharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();

    const channel = supabase
      .channel(`gm-players-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          loadPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const loadPlayers = async () => {
    try {
      const { data: roomPlayers, error: rpError } = await supabase
        .from("room_players")
        .select("character_id")
        .eq("room_id", roomId);

      if (rpError) throw rpError;

      if (roomPlayers && roomPlayers.length > 0) {
        const characterIds = roomPlayers.map(rp => rp.character_id);
        
        const { data: characters, error: charError } = await supabase
          .from("characters")
          .select("*")
          .in("id", characterIds);

        if (charError) throw charError;

        if (characters) {
          setPlayers(characters);
        }
      }
    } catch (error) {
      console.error("Error loading players:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fichas dos Jogadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fichas dos Jogadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Nenhum jogador na sala ainda.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Fichas dos Jogadores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={players[0]?.id} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            {players.map((player) => (
              <TabsTrigger key={player.id} value={player.id} className="whitespace-nowrap">
                {player.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {players.map((player) => (
            <TabsContent key={player.id} value={player.id}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Informações Básicas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Raça</p>
                      <p className="font-medium">{player.race}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Classe</p>
                      <p className="font-medium">{player.class}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nível</p>
                      <p className="font-medium">{player.level}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bônus de Proficiência</p>
                      <p className="font-medium">+{player.proficiency_bonus}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">HP</p>
                        <p className="font-medium">{player.current_hp} / {player.max_hp}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">CA</p>
                        <p className="font-medium">{player.armor_class}</p>
                      </div>
                    </div>
                  </div>

                  {/* Atributos */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      Atributos e Modificadores
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Força</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.strength}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.strength)}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Destreza</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.dexterity}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.dexterity)}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Constituição</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.constitution}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.constitution)}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Inteligência</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.intelligence}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.intelligence)}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Sabedoria</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.wisdom}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.wisdom)}</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-secondary/50 rounded">
                        <span className="text-sm font-medium">Carisma</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{player.charisma}</Badge>
                          <Badge variant="secondary">{calculateModifier(player.charisma)}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
