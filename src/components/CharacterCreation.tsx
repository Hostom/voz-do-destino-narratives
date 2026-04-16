import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sword, Shield, User, Scroll, Dices, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const STEPS = [
  { number: 1, label: "Básico", icon: User },
  { number: 2, label: "Atributos", icon: Sword },
  { number: 3, label: "História", icon: Scroll },
];

const STORAGE_KEY = "character_creation_draft";

export const CharacterCreation = ({ onComplete }: CharacterCreationProps) => {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [rollingAttribute, setRollingAttribute] = useState<string | null>(null);
  
  const [character, setCharacter] = useState<CharacterData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
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
    };
  });

  // Persist draft on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
  }, [character]);

  const rollAttribute = (attr: keyof CharacterData) => {
    setRollingAttribute(attr as string);
    const rolls: number[] = [];
    for (let i = 0; i < 4; i++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
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
    localStorage.removeItem(STORAGE_KEY);
    onComplete(character);
  };

  const isStep1Valid = character.name.trim() && character.race && character.class;
  const isStep2Valid = allAttributesRolled();

  return (
    <div className="min-h-screen bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8 px-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isCompleted = step > s.number;
              const isCurrent = step === s.number;
              
              return (
                <div key={s.number} className="relative flex flex-col items-center z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                      isCompleted 
                        ? "bg-primary border-primary text-primary-foreground scale-100" 
                        : isCurrent 
                          ? "bg-primary/20 border-primary text-primary scale-110 shadow-glow animate-pulse-slow"
                          : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 animate-scale-in" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn("mt-2 text-sm font-medium", isCurrent ? "text-primary" : "text-muted-foreground")}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="border-primary/20 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Criação de Personagem
            </CardTitle>
            <CardDescription>Crie seu herói seguindo as regras do D&D 5E</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
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
                    placeholder="Nome do personagem"
                    className="bg-background/50"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Raça *</Label>
                    <Select value={character.race} onValueChange={(v) => setCharacter({ ...character, race: v })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Raça" /></SelectTrigger>
                      <SelectContent>{RACES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Classe *</Label>
                    <Select value={character.class} onValueChange={(v) => setCharacter({ ...character, class: v })}>
                      <SelectTrigger className="bg-background/50"><SelectValue placeholder="Classe" /></SelectTrigger>
                      <SelectContent>{CLASSES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full" disabled={!isStep1Valid}>Próximo: Atributos</Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sword className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">Atributos</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "strength", label: "Força" },
                    { key: "dexterity", label: "Destreza" },
                    { key: "constitution", label: "Constituição" },
                    { key: "intelligence", label: "Inteligência" },
                    { key: "wisdom", label: "Sabedoria" },
                    { key: "charisma", label: "Carisma" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {character[key as keyof CharacterData] ? `Mod: ${getAttributeModifier(character[key as keyof CharacterData] as number)}` : "Não rolado"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {character[key as keyof CharacterData] ? (
                          <>
                            <span className="text-xl font-bold w-8 text-center">{character[key as keyof CharacterData]}</span>
                            <Button variant="ghost" size="sm" onClick={() => rollAttribute(key as keyof CharacterData)} disabled={!!rollingAttribute}><Dices className="h-4 w-4" /></Button>
                          </>
                        ) : (
                          <Button onClick={() => rollAttribute(key as keyof CharacterData)} disabled={!!rollingAttribute} size="sm">
                            {rollingAttribute === key ? <Dices className="h-4 w-4 animate-spin" /> : "Rolar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Voltar</Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={!isStep2Valid}>Próximo: História</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Scroll className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">História</h3>
                </div>
                <div className="space-y-2">
                  <Label>Antecedente *</Label>
                  <Select value={character.background} onValueChange={(v) => setCharacter({ ...character, background: v })}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Antecedente" /></SelectTrigger>
                    <SelectContent>{BACKGROUNDS.map((bg) => <SelectItem key={bg.value} value={bg.value}>{bg.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backstory">História</Label>
                  <Textarea
                    id="backstory"
                    value={character.backstory}
                    onChange={(e) => setCharacter({ ...character, backstory: e.target.value })}
                    rows={4}
                    className="bg-background/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Voltar</Button>
                  <Button onClick={handleSubmit} className="flex-1">Iniciar Aventura</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
