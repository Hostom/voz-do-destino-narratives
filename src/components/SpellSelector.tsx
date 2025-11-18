import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wand2 } from "lucide-react";
import { DND_SPELLS, Spell, getSpellsByLevel } from "@/lib/dnd-spells";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SpellSelectorProps {
  characterId: string;
  spellSlots?: any;
  currentSpellSlots?: any;
}

export const SpellSelector = ({ characterId, spellSlots, currentSpellSlots }: SpellSelectorProps) => {
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const maxSlots = spellSlots || {};
  const current = currentSpellSlots || {};
  const hasSpells = Object.values(maxSlots).some((slots: any) => slots > 0);

  const handleSpellClick = (spell: Spell) => {
    setSelectedSpell(spell);
    setIsDialogOpen(true);
  };

  const SpellCard = ({ spell }: { spell: Spell }) => {
    const hasSlots = spell.level === 0 || (current[spell.level] || 0) > 0;

    return (
      <Card
        className={`cursor-pointer transition-all ${
          hasSlots
            ? "border-border hover:border-primary/50"
            : "border-border opacity-50"
        }`}
        onClick={() => handleSpellClick(spell)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2">
                {spell.name}
                {spell.level === 0 && (
                  <Badge variant="outline" className="text-xs">
                    Truque
                  </Badge>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                {spell.school} • {spell.casting_time}
              </p>
            </div>
            <Badge variant="secondary">
              Nível {spell.level}
            </Badge>
          </div>

          {spell.damage && (
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                {spell.damage} {spell.damage_type}
              </Badge>
              {spell.save && (
                <Badge variant="outline" className="text-xs ml-1">
                  Teste: {spell.save.toUpperCase().slice(0, 3)}
                </Badge>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {spell.description}
          </p>
        </CardContent>
      </Card>
    );
  };

  if (!hasSpells) {
    return (
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Este personagem não possui espaços de magia configurados.</p>
            <p className="text-xs mt-2">
              Configure slots de magia na criação do personagem para usar magias.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/80 backdrop-blur border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Grimório de Magias D&D 5e
            </CardTitle>
          </div>
          
          {/* Spell Slots Display */}
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm font-semibold mb-2">Espaços de Magia Disponíveis:</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(maxSlots).map(([level, max]: [string, any]) => {
                if (max === 0) return null;
                const currentSlots = current[level] || 0;
                return (
                  <div
                    key={level}
                    className="text-sm p-2 bg-background rounded border border-border"
                  >
                    <span className="text-muted-foreground">Nível {level}:</span>
                    <span className={`ml-2 font-bold ${currentSlots === 0 ? "text-destructive" : ""}`}>
                      {currentSlots}/{max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="0" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="0">Truques</TabsTrigger>
              <TabsTrigger value="1">Nv 1</TabsTrigger>
              <TabsTrigger value="2">Nv 2</TabsTrigger>
              <TabsTrigger value="3">Nv 3</TabsTrigger>
              <TabsTrigger value="4">Nv 4</TabsTrigger>
              <TabsTrigger value="5">Nv 5</TabsTrigger>
            </TabsList>

            {[0, 1, 2, 3, 4, 5].map((level) => (
              <TabsContent key={level} value={level.toString()} className="space-y-2 mt-4">
                {getSpellsByLevel(level).map((spell) => (
                  <SpellCard key={spell.id} spell={spell} />
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Spell Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedSpell && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {selectedSpell.name}
                </DialogTitle>
                <div className="flex gap-2 mt-2">
                  <Badge>Nível {selectedSpell.level}</Badge>
                  <Badge variant="outline">{selectedSpell.school}</Badge>
                </div>
              </DialogHeader>
              <DialogDescription asChild>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold">Tempo de Conjuração:</span>
                      <p className="text-foreground">{selectedSpell.casting_time}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Alcance:</span>
                      <p className="text-foreground">{selectedSpell.range}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Componentes:</span>
                      <p className="text-foreground">{selectedSpell.components}</p>
                    </div>
                    <div>
                      <span className="font-semibold">Duração:</span>
                      <p className="text-foreground">{selectedSpell.duration}</p>
                    </div>
                  </div>

                  {selectedSpell.damage && (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="font-semibold text-sm mb-1">Dano:</p>
                      <p className="text-foreground">
                        {selectedSpell.damage} de dano {selectedSpell.damage_type}
                      </p>
                      {selectedSpell.save && (
                        <p className="text-sm mt-1">
                          Teste de Resistência: {selectedSpell.save.toUpperCase()}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-sm mb-2">Descrição:</p>
                    <p className="text-foreground text-sm leading-relaxed">
                      {selectedSpell.description}
                    </p>
                  </div>
                </div>
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
