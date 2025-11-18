import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sword, Shield, User, Scroll } from "lucide-react";
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
  
  const [character, setCharacter] = useState<CharacterData>({
    name: "",
    race: "",
    class: "",
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
    background: "",
    backstory: "",
  });

  const POINTS_TO_DISTRIBUTE = 27;
  const BASE_SCORE = 8;
  const MAX_SCORE = 15;

  const calculateUsedPoints = () => {
    const attrs = [
      character.strength,
      character.dexterity,
      character.constitution,
      character.intelligence,
      character.wisdom,
      character.charisma,
    ];
    
    return attrs.reduce((total, score) => {
      const cost = score - BASE_SCORE;
      return total + (cost > 5 ? cost + (cost - 5) : cost);
    }, 0);
  };

  const remainingPoints = POINTS_TO_DISTRIBUTE - calculateUsedPoints();

  const getAttributeModifier = (score: number) => {
    return Math.floor((score - 10) / 2);
  };

  const updateAttribute = (attr: keyof CharacterData, increment: boolean) => {
    const currentValue = character[attr] as number;
    const newValue = increment ? currentValue + 1 : currentValue - 1;
    
    if (newValue < BASE_SCORE || newValue > MAX_SCORE) return;
    
    // Calculate cost difference
    const oldCost = currentValue - BASE_SCORE > 5 ? 
      (currentValue - BASE_SCORE) + (currentValue - BASE_SCORE - 5) : 
      currentValue - BASE_SCORE;
    const newCost = newValue - BASE_SCORE > 5 ? 
      (newValue - BASE_SCORE) + (newValue - BASE_SCORE - 5) : 
      newValue - BASE_SCORE;
    
    if (increment && remainingPoints - (newCost - oldCost) < 0) return;
    
    setCharacter({ ...character, [attr]: newValue });
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
                  <p className="text-sm text-muted-foreground">Pontos Restantes</p>
                  <p className="text-3xl font-bold text-primary">{remainingPoints}</p>
                  <p className="text-xs text-muted-foreground mt-1">de {POINTS_TO_DISTRIBUTE} pontos</p>
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
                    const modifier = getAttributeModifier(value);
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm text-muted-foreground">
                            Modificador: {modifier >= 0 ? "+" : ""}{modifier}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAttribute(key as keyof CharacterData, false)}
                            disabled={value <= BASE_SCORE}
                          >
                            -
                          </Button>
                          <span className="text-xl font-bold w-8 text-center">{value}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateAttribute(key as keyof CharacterData, true)}
                            disabled={value >= MAX_SCORE || remainingPoints <= 0}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={remainingPoints !== 0}>
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
