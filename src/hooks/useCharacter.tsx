import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Character {
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

const CLASS_HP: Record<string, number> = {
  fighter: 10,
  wizard: 6,
  rogue: 8,
  cleric: 8,
  barbarian: 12,
  bard: 8,
  druid: 8,
  monk: 8,
  paladin: 10,
  ranger: 10,
  sorcerer: 6,
  warlock: 8,
};

export const useCharacter = () => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCharacter();
  }, []);

  const loadCharacter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCharacter(data);
    } catch (error) {
      console.error("Error loading character:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllCharacters = async (): Promise<Character[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading characters:", error);
      return [];
    }
  };

  const selectCharacter = (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
  };

  const createCharacter = async (characterData: Omit<Character, "id" | "level" | "max_hp" | "current_hp" | "armor_class">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const constitutionModifier = Math.floor((characterData.constitution - 10) / 2);
      const baseHP = CLASS_HP[characterData.class] || 8;
      const maxHP = baseHP + constitutionModifier;

      const newCharacter = {
        user_id: user.id,
        ...characterData,
        level: 1,
        max_hp: maxHP,
        current_hp: maxHP,
        armor_class: 10 + Math.floor((characterData.dexterity - 10) / 2),
      };

      const { data, error } = await supabase
        .from("characters")
        .insert(newCharacter)
        .select()
        .single();

      if (error) throw error;

      setCharacter(data);
      toast({
        title: "Personagem criado!",
        description: `${data.name} está pronto para a aventura!`,
      });

      return data;
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Erro ao criar personagem",
        description: "Não foi possível criar o personagem. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCharacter = async (updates: Partial<Character>) => {
    if (!character?.id) return;

    try {
      const { error } = await supabase
        .from("characters")
        .update(updates)
        .eq("id", character.id);

      if (error) throw error;

      setCharacter({ ...character, ...updates });
    } catch (error) {
      console.error("Error updating character:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o personagem.",
        variant: "destructive",
      });
    }
  };

  const deleteCharacter = async () => {
    if (!character?.id) return;

    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", character.id);

      if (error) throw error;

      setCharacter(null);
      toast({
        title: "Personagem excluído",
        description: "O personagem foi removido.",
      });
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o personagem.",
        variant: "destructive",
      });
    }
  };

  const getCharacterSummary = () => {
    if (!character) return "";

    const getModifier = (score: number) => {
      const mod = Math.floor((score - 10) / 2);
      return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    return `Nome: ${character.name}
Raça: ${character.race}
Classe: ${character.class}
Nível: ${character.level}

ATRIBUTOS:
- Força: ${character.strength} (${getModifier(character.strength)})
- Destreza: ${character.dexterity} (${getModifier(character.dexterity)})
- Constituição: ${character.constitution} (${getModifier(character.constitution)})
- Inteligência: ${character.intelligence} (${getModifier(character.intelligence)})
- Sabedoria: ${character.wisdom} (${getModifier(character.wisdom)})
- Carisma: ${character.charisma} (${getModifier(character.charisma)})

HP: ${character.current_hp}/${character.max_hp}
Classe de Armadura: ${character.armor_class}
Antecedente: ${character.background}
${character.backstory ? `\nHistória: ${character.backstory}` : ''}`;
  };

  return {
    character,
    loading,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacterSummary,
    loadAllCharacters,
    selectCharacter,
  };
};
