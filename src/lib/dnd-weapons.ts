// D&D 5e Weapons Library
export interface Weapon {
  id: string;
  name: string;
  damage_dice: string;
  damage_type: string;
  ability: "strength" | "dexterity";
  properties: string[];
  category: "simple_melee" | "simple_ranged" | "martial_melee" | "martial_ranged";
  range?: string;
}

export const DND_WEAPONS: Weapon[] = [
  // Simple Melee Weapons
  {
    id: "club",
    name: "Clava",
    damage_dice: "1d4",
    damage_type: "contundente",
    ability: "strength",
    properties: ["Leve"],
    category: "simple_melee",
  },
  {
    id: "dagger",
    name: "Adaga",
    damage_dice: "1d4",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Acuidade", "Leve", "Arremesso (6/18m)"],
    category: "simple_melee",
  },
  {
    id: "mace",
    name: "Maça",
    damage_dice: "1d6",
    damage_type: "contundente",
    ability: "strength",
    properties: [],
    category: "simple_melee",
  },
  {
    id: "quarterstaff",
    name: "Bordão",
    damage_dice: "1d6",
    damage_type: "contundente",
    ability: "strength",
    properties: ["Versátil (1d8)"],
    category: "simple_melee",
  },
  {
    id: "spear",
    name: "Lança",
    damage_dice: "1d6",
    damage_type: "perfurante",
    ability: "strength",
    properties: ["Arremesso (6/18m)", "Versátil (1d8)"],
    category: "simple_melee",
  },

  // Simple Ranged Weapons
  {
    id: "light_crossbow",
    name: "Besta Leve",
    damage_dice: "1d8",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Munição (24/96m)", "Recarga", "Duas Mãos"],
    category: "simple_ranged",
    range: "24/96m",
  },
  {
    id: "shortbow",
    name: "Arco Curto",
    damage_dice: "1d6",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Munição (24/96m)", "Duas Mãos"],
    category: "simple_ranged",
    range: "24/96m",
  },

  // Martial Melee Weapons
  {
    id: "battleaxe",
    name: "Machado de Batalha",
    damage_dice: "1d8",
    damage_type: "cortante",
    ability: "strength",
    properties: ["Versátil (1d10)"],
    category: "martial_melee",
  },
  {
    id: "longsword",
    name: "Espada Longa",
    damage_dice: "1d8",
    damage_type: "cortante",
    ability: "strength",
    properties: ["Versátil (1d10)"],
    category: "martial_melee",
  },
  {
    id: "greatsword",
    name: "Espada Grande",
    damage_dice: "2d6",
    damage_type: "cortante",
    ability: "strength",
    properties: ["Pesada", "Duas Mãos"],
    category: "martial_melee",
  },
  {
    id: "rapier",
    name: "Rapieira",
    damage_dice: "1d8",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Acuidade"],
    category: "martial_melee",
  },
  {
    id: "scimitar",
    name: "Cimitarra",
    damage_dice: "1d6",
    damage_type: "cortante",
    ability: "dexterity",
    properties: ["Acuidade", "Leve"],
    category: "martial_melee",
  },
  {
    id: "warhammer",
    name: "Martelo de Guerra",
    damage_dice: "1d8",
    damage_type: "contundente",
    ability: "strength",
    properties: ["Versátil (1d10)"],
    category: "martial_melee",
  },
  {
    id: "maul",
    name: "Malho",
    damage_dice: "2d6",
    damage_type: "contundente",
    ability: "strength",
    properties: ["Pesada", "Duas Mãos"],
    category: "martial_melee",
  },
  {
    id: "greataxe",
    name: "Machado Grande",
    damage_dice: "1d12",
    damage_type: "cortante",
    ability: "strength",
    properties: ["Pesada", "Duas Mãos"],
    category: "martial_melee",
  },

  // Martial Ranged Weapons
  {
    id: "longbow",
    name: "Arco Longo",
    damage_dice: "1d8",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Munição (45/180m)", "Pesada", "Duas Mãos"],
    category: "martial_ranged",
    range: "45/180m",
  },
  {
    id: "heavy_crossbow",
    name: "Besta Pesada",
    damage_dice: "1d10",
    damage_type: "perfurante",
    ability: "dexterity",
    properties: ["Munição (30/120m)", "Pesada", "Recarga", "Duas Mãos"],
    category: "martial_ranged",
    range: "30/120m",
  },

  // Unarmed Strike
  {
    id: "unarmed",
    name: "Ataque Desarmado",
    damage_dice: "1d4",
    damage_type: "contundente",
    ability: "strength",
    properties: [],
    category: "simple_melee",
  },
];

export const getWeaponById = (id: string): Weapon | undefined => {
  return DND_WEAPONS.find(w => w.id === id);
};

export const getWeaponsByCategory = (category: Weapon["category"]): Weapon[] => {
  return DND_WEAPONS.filter(w => w.category === category);
};
