import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scroll, Plus, Trash2, Sword, Shield, Heart, ArrowLeft } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Character {
  id?: string;
  name: string;
  race: string;
  class: string;
  level: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  max_hp: number;
  current_hp: number;
  armor_class: number;
  background: string;
  backstory: string;
}

interface CharacterSelectProps {
  characters: Character[];
  onSelect: (character: Character) => void;
  onCreateNew: () => void;
  onCharactersUpdate: () => void;
  onBack?: () => void;
}

const getRaceLabel = (race: string) => {
  const labels: Record<string, string> = {
    human: "Humano",
    elf: "Elfo",
    dwarf: "Anão",
    halfling: "Halfling",
    dragonborn: "Draconato",
    gnome: "Gnomo",
    "half-elf": "Meio-Elfo",
    "half-orc": "Meio-Orc",
    tiefling: "Tiefling",
  };
  return labels[race] || race;
};

const getClassLabel = (className: string) => {
  const labels: Record<string, string> = {
    fighter: "Guerreiro",
    wizard: "Mago",
    rogue: "Ladino",
    cleric: "Clérigo",
    barbarian: "Bárbaro",
    bard: "Bardo",
    druid: "Druida",
    monk: "Monge",
    paladin: "Paladino",
    ranger: "Patrulheiro",
    sorcerer: "Feiticeiro",
    warlock: "Bruxo",
  };
  return labels[className] || className;
};

export const CharacterSelect = ({ characters, onSelect, onCreateNew, onCharactersUpdate, onBack }: CharacterSelectProps) => {
  const { toast } = useToast();

  const handleDelete = async (characterId: string, characterName: string) => {
    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", characterId);

      if (error) throw error;

      toast({
        title: "Personagem excluído",
        description: `${characterName} foi removido.`,
      });

      onCharactersUpdate();
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o personagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {onBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Menu
          </Button>
        )}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 flex items-center justify-center gap-3">
            <Scroll className="h-10 w-10 text-primary" />
            Seus Personagens
          </h1>
          <p className="text-muted-foreground text-lg">
            Escolha um personagem ou crie um novo para começar sua aventura
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {characters.map((char) => (
            <Card 
              key={char.id} 
              className="hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/50"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-xl">
                  <span className="truncate">{char.name}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir personagem?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir {char.name}? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(char.id!, char.name)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardTitle>
                <CardDescription className="text-sm">
                  {getRaceLabel(char.race)} • {getClassLabel(char.class)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>{char.current_hp}/{char.max_hp}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>CA {char.armor_class}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Sword className="h-4 w-4 text-orange-500" />
                    <span>Nv {char.level}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.strength}</div>
                    <div className="text-muted-foreground">FOR</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.dexterity}</div>
                    <div className="text-muted-foreground">DES</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.constitution}</div>
                    <div className="text-muted-foreground">CON</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.intelligence}</div>
                    <div className="text-muted-foreground">INT</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.wisdom}</div>
                    <div className="text-muted-foreground">SAB</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-foreground">{char.charisma}</div>
                    <div className="text-muted-foreground">CAR</div>
                  </div>
                </div>

                <Button 
                  onClick={() => onSelect(char)} 
                  className="w-full"
                >
                  Jogar com {char.name}
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card 
            className="hover:shadow-lg transition-all duration-200 border-dashed border-2 border-primary/30 hover:border-primary/60 cursor-pointer bg-card/50"
            onClick={onCreateNew}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Plus className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-lg mb-1">Criar Novo Personagem</h3>
                <p className="text-sm text-muted-foreground">
                  Comece uma nova aventura
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
