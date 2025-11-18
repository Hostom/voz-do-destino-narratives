import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sword, Shield, User, Scroll, Dices } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CharacterData {
  name: string;
  race: string;
  class: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  background: string;
  backstory: string;
}

interface CharacterCreationProps {
  onComplete: (character: CharacterData) => void;
}

const RACES = [
  { value: "human", label: "Humano" },
  { value: "elf", label: "Elfo" },
  { value: "dwarf", label: "Anão" },
  { value: "halfling", label: "Halfling" },
  { value: "dragonborn", label: "Draconato" },
  { value: "gnome", label: "Gnomo" },
  { value: "half-elf", label: "Meio-Elfo" },
  { value: "half-orc", label: "Meio-Orc" },
  { value: "tiefling", label: "Tiefling" },
];

const CLASSES = [
  { value: "fighter", label: "Guerreiro", hp: 10 },
  { value: "wizard", label: "Mago", hp: 6 },
  { value: "rogue", label: "Ladino", hp: 8 },
  { value: "cleric", label: "Clérigo", hp: 8 },
  { value: "barbarian", label: "Bárbaro", hp: 12 },
  { value: "bard", label: "Bardo", hp: 8 },
  { value: "druid", label: "Druida", hp: 8 },
  { value: "monk", label: "Monge", hp: 8 },
  { value: "paladin", label: "Paladino", hp: 10 },
  { value: "ranger", label: "Patrulheiro", hp: 10 },
  { value: "sorcerer", label: "Feiticeiro", hp: 6 },
  { value: "warlock", label: "Bruxo", hp: 8 },
];

const BACKGROUNDS = [
  { value: "acolyte", label: "Acólito" },
  { value: "charlatan", label: "Charlatão" },
  { value: "criminal", label: "Criminoso" },
  { value: "entertainer", label: "Artista" },
  { value: "folk-hero", label: "Herói do Povo" },
  { value: "guild-artisan", label: "Artesão de Guilda" },
  { value: "hermit", label: "Eremita" },
  { value: "noble", label: "Nobre" },
  { value: "outlander", label: "Forasteiro" },
  { value: "sage", label: "Sábio" },
  { value: "sailor", label: "Marinheiro" },
  { value: "soldier", label: "Soldado" },
];

export const CharacterCreation = ({ onComplete }: CharacterCreationProps) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [rollingAttribute, setRollingAttribute] = useState<string | null>(null);
  
  const [character, setCharacter] = useState<CharacterData>({
    name: "",
    race: "",
    class: "",
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
    background: "",
    backstory: "",
  });

  const rollAttribute = (attr: keyof CharacterData) => {
    setRollingAttribute(attr as string);
    
    // Roll 4d6, drop lowest (standard D&D 5E method)
    const rolls: number[] = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    
    // Sort and drop lowest
    rolls.sort((a, b) => a - b);
    const sum = rolls.slice(1).reduce((acc, val) => acc + val, 0);
    
    setTimeout(() => {
      setCharacter({ ...character, [attr]: sum });
      setRollingAttribute(null);
      toast({
        title: "Dados rolados!",
        description: `Você rolou ${rolls.join(", ")} e obteve ${sum} (descartando o menor).`,
      });
    }, 1000);
  };

  const allAttributesRolled = () => {
    return character.strength > 0 &&
           character.dexterity > 0 &&
           character.constitution > 0 &&
           character.intelligence > 0 &&
           character.wisdom > 0 &&
           character.charisma > 0;
  };

  const getAttributeModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const handleSubmit = () => {
    if (!character.name.trim()) {
      toast({ title: "Nome obrigatório", description: "Por favor, insira o nome do personagem.", variant: "destructive" });
      return;
    }
    if (!character.race || !character.class || !character.background) {
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }
    onComplete(character);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Criação de Personagem
            </CardTitle>
            <CardDescription>
              Crie seu herói seguindo as regras do D&D 5E
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Informações Básicas</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Personagem *</Label>
                  <Input
                    id="name"
                    value={character.name}
                    onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                    placeholder="Digite o nome do seu personagem"
                    maxLength={50}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raça *</Label>
                    <Select value={character.race} onValueChange={(value) => setCharacter({ ...character, race: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma raça" />
                      </SelectTrigger>
                      <SelectContent>
                        {RACES.map((race) => (
                          <SelectItem key={race.value} value={race.value}>
                            {race.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Classe *</Label>
                    <Select value={character.class} onValueChange={(value) => setCharacter({ ...character, class: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASSES.map((cls) => (
                          <SelectItem key={cls.value} value={cls.value}>
                            {cls.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Próximo: Atributos
                </Button>
              </div>
            )}

            {/* Step 2: Attributes */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sword className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Atributos</h3>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Role 4d6 para cada atributo</p>
                  <p className="text-xs text-muted-foreground mt-1">O dado mais baixo será descartado automaticamente</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "strength", label: "Força" },
                    { key: "dexterity", label: "Destreza" },
                    { key: "constitution", label: "Constituição" },
                    { key: "intelligence", label: "Inteligência" },
                    { key: "wisdom", label: "Sabedoria" },
                    { key: "charisma", label: "Carisma" },
                  ].map(({ key, label }) => {
                    const value = character[key as keyof CharacterData] as number;
                    const modifier = value > 0 ? getAttributeModifier(value) : 0;
                    const isRolling = rollingAttribute === key;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">
                            {value > 0 ? `Modificador: ${modifier >= 0 ? "+" : ""}${modifier}` : "Não rolado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {value > 0 ? (
                            <>
                              <span className="text-2xl font-bold w-12 text-center text-primary">{value}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => rollAttribute(key as keyof CharacterData)}
                                disabled={isRolling}
                              >
                                <Dices className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              onClick={() => rollAttribute(key as keyof CharacterData)}
                              disabled={isRolling}
                              className="w-full"
                            >
                              {isRolling ? (
                                <Dices className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Dices className="mr-2 h-4 w-4" />
                                  Rolar 4d6
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={!allAttributesRolled()}>
                    Próximo: História
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Background */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                  <Scroll className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">História e Antecedentes</h3>
                </div>

                <div className="space-y-2">
                  <Label>Antecedente *</Label>
                  <Select value={character.background} onValueChange={(value) => setCharacter({ ...character, background: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um antecedente" />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUNDS.map((bg) => (
                        <SelectItem key={bg.value} value={bg.value}>
                          {bg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backstory">História do Personagem</Label>
                  <Textarea
                    id="backstory"
                    value={character.backstory}
                    onChange={(e) => setCharacter({ ...character, backstory: e.target.value })}
                    placeholder="Conte a história do seu personagem: de onde veio, o que o motiva, seus objetivos..."
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {character.backstory.length}/1000
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    <Shield className="mr-2 h-4 w-4" />
                    Iniciar Aventura
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
