import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Check, Sword, CircleDot, Crosshair } from "lucide-react";
import { DND_WEAPONS, Weapon, getWeaponsByCategory } from "@/lib/dnd-weapons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
interface WeaponSelectorProps {
  characterId: string;
  currentWeapon?: any;
  onWeaponChange?: () => void;
}
export const WeaponSelector = ({
  characterId,
  currentWeapon,
  onWeaponChange
}: WeaponSelectorProps) => {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const {
    toast
  } = useToast();
  const currentWeaponId = currentWeapon?.id || "unarmed";
  const handleEquipWeapon = async (weapon: Weapon) => {
    setIsUpdating(true);
    try {
      const {
        error
      } = await supabase.from("characters").update({
        equipped_weapon: {
          id: weapon.id,
          name: weapon.name,
          damage_dice: weapon.damage_dice,
          damage_type: weapon.damage_type,
          ability: weapon.ability
        }
      }).eq("id", characterId);
      if (error) throw error;
      toast({
        title: "Arma equipada!",
        description: `${weapon.name} está agora equipada`
      });
      onWeaponChange?.();
      setSelectedWeapon(null);
    } catch (error) {
      console.error("Error equipping weapon:", error);
      toast({
        title: "Erro",
        description: "Não foi possível equipar a arma",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  const WeaponCard = ({
    weapon
  }: {
    weapon: Weapon;
  }) => {
    const isEquipped = weapon.id === currentWeaponId;
    const isSelected = selectedWeapon?.id === weapon.id;
    return <Card className={`cursor-pointer transition-all ${isEquipped ? "border-primary bg-primary/10" : isSelected ? "border-accent bg-accent/10" : "border-border hover:border-primary/50"}`} onClick={() => setSelectedWeapon(weapon)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {weapon.name}
                {isEquipped && <Badge variant="default" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Equipada
                  </Badge>}
              </h4>
              <p className="text-sm text-muted-foreground">
                {weapon.damage_dice} {weapon.damage_type}
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {weapon.ability === "strength" ? "FOR" : "DES"}
            </Badge>
          </div>

          {weapon.properties.length > 0 && <div className="flex flex-wrap gap-1 mt-2">
              {weapon.properties.map((prop, idx) => <Badge key={idx} variant="secondary" className="text-xs">
                  {prop}
                </Badge>)}
            </div>}

          {weapon.range && <p className="text-xs text-muted-foreground mt-2">
              Alcance: {weapon.range}
            </p>}
        </CardContent>
      </Card>;
  };
  return <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg mb-2">Arsenal de Armas      <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
          Arsenal de Armas D&D 5e
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Tabs defaultValue="simple_melee" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 h-auto bg-muted/50 p-1">
            <TabsTrigger value="simple_melee" className="text-xs whitespace-nowrap px-2 flex items-center gap-1">
              <Sword className="w-3 h-3" />
              Simples C/C
            </TabsTrigger>
            <TabsTrigger value="simple_ranged" className="text-xs whitespace-nowrap px-2 flex items-center gap-1">
              <CircleDot className="w-3 h-3" />
              Simples Dist.
            </TabsTrigger>
            <TabsTrigger value="martial_melee" className="text-xs whitespace-nowrap px-2 flex items-center gap-1">
              <Swords className="w-3 h-3" />
              Marcial C/C
            </TabsTrigger>
            <TabsTrigger value="martial_ranged" className="text-xs whitespace-nowrap px-2 flex items-center gap-1">
              <Crosshair className="w-3 h-3" />
              Marcial Dist.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simple_melee" className="space-y-2 mt-4">
            {getWeaponsByCategory("simple_melee").map(weapon => <WeaponCard key={weapon.id} weapon={weapon} />)}
          </TabsContent>

          <TabsContent value="simple_ranged" className="space-y-2 mt-4">
            {getWeaponsByCategory("simple_ranged").map(weapon => <WeaponCard key={weapon.id} weapon={weapon} />)}
          </TabsContent>

          <TabsContent value="martial_melee" className="space-y-2 mt-4">
            {getWeaponsByCategory("martial_melee").map(weapon => <WeaponCard key={weapon.id} weapon={weapon} />)}
          </TabsContent>

          <TabsContent value="martial_ranged" className="space-y-2 mt-4">
            {getWeaponsByCategory("martial_ranged").map(weapon => <WeaponCard key={weapon.id} weapon={weapon} />)}
          </TabsContent>
        </Tabs>

        {selectedWeapon && selectedWeapon.id !== currentWeaponId && <Button onClick={() => handleEquipWeapon(selectedWeapon)} disabled={isUpdating} className="w-full" size="lg">
            Equipar {selectedWeapon.name}
          </Button>}

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <p className="font-semibold mb-1">Propriedades das Armas:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li><strong>Acuidade:</strong> Use FOR ou DES para ataque e dano</li>
            <li><strong>Leve:</strong> Ideal para duas armas</li>
            <li><strong>Versátil:</strong> Dano maior com duas mãos</li>
            <li><strong>Pesada:</strong> Criaturas pequenas têm desvantagem</li>
            <li><strong>Recarga:</strong> Só pode atacar uma vez por turno</li>
          </ul>
        </div>
      </CardContent>
    </Card>;
};