// D&D 5e Spells Library
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  damage?: string;
  damage_type?: string;
  save?: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
}

export const DND_SPELLS: Spell[] = [
  // Cantrips (Level 0)
  {
    id: "fire_bolt",
    name: "Raio de Fogo",
    level: 0,
    school: "Evocação",
    casting_time: "1 ação",
    range: "36m",
    components: "V, S",
    duration: "Instantânea",
    description: "Você arremessa um raio de fogo em uma criatura ou objeto dentro do alcance. Faça um ataque à distância com magia contra o alvo. Se acertar, o alvo sofre 1d10 de dano de fogo.",
    damage: "1d10",
    damage_type: "fogo",
  },
  {
    id: "eldritch_blast",
    name: "Explosão Mística",
    level: 0,
    school: "Evocação",
    casting_time: "1 ação",
    range: "36m",
    components: "V, S",
    duration: "Instantânea",
    description: "Um raio de energia crepitante dispara em direção a uma criatura dentro do alcance. Faça um ataque à distância com magia contra o alvo. Se acertar, o alvo sofre 1d10 de dano de força.",
    damage: "1d10",
    damage_type: "força",
  },
  {
    id: "sacred_flame",
    name: "Chama Sagrada",
    level: 0,
    school: "Evocação",
    casting_time: "1 ação",
    range: "18m",
    components: "V, S",
    duration: "Instantânea",
    description: "Uma chama radiante desce sobre uma criatura que você possa ver. O alvo deve ser bem-sucedido em um teste de resistência de Destreza ou sofrerá 1d8 de dano radiante.",
    damage: "1d8",
    damage_type: "radiante",
    save: "dexterity",
  },

  // Level 1 Spells
  {
    id: "magic_missile",
    name: "Mísseis Mágicos",
    level: 1,
    school: "Evocação",
    casting_time: "1 ação",
    range: "36m",
    components: "V, S",
    duration: "Instantânea",
    description: "Você cria três dardos brilhantes de energia mágica. Cada dardo acerta uma criatura de sua escolha que você possa ver dentro do alcance. Um dardo causa 1d4+1 de dano de força ao alvo. Os dardos atingem simultaneamente.",
    damage: "3d4+3",
    damage_type: "força",
  },
  {
    id: "cure_wounds",
    name: "Curar Ferimentos",
    level: 1,
    school: "Evocação",
    casting_time: "1 ação",
    range: "Toque",
    components: "V, S",
    duration: "Instantânea",
    description: "Uma criatura que você tocar recupera um número de pontos de vida igual a 1d8 + seu modificador de habilidade de conjuração.",
    damage: "1d8",
    damage_type: "cura",
  },
  {
    id: "shield",
    name: "Escudo",
    level: 1,
    school: "Abjuração",
    casting_time: "1 reação",
    range: "Pessoal",
    components: "V, S",
    duration: "1 rodada",
    description: "Uma barreira invisível de força mágica aparece e o protege. Até o início do seu próximo turno, você tem +5 de bônus na CA.",
  },

  // Level 2 Spells
  {
    id: "scorching_ray",
    name: "Raio Chamuscante",
    level: 2,
    school: "Evocação",
    casting_time: "1 ação",
    range: "36m",
    components: "V, S",
    duration: "Instantânea",
    description: "Você cria três raios de fogo e os arremessa em alvos dentro do alcance. Faça um ataque à distância com magia para cada raio. Se acertar, o alvo sofre 2d6 de dano de fogo.",
    damage: "6d6",
    damage_type: "fogo",
  },
  {
    id: "hold_person",
    name: "Imobilizar Pessoa",
    level: 2,
    school: "Encantamento",
    casting_time: "1 ação",
    range: "18m",
    components: "V, S, M",
    duration: "Concentração, até 1 minuto",
    description: "Escolha um humanoide que você possa ver dentro do alcance. O alvo deve ser bem-sucedido em um teste de resistência de Sabedoria ou ficará paralisado pela duração.",
    save: "wisdom",
  },

  // Level 3 Spells
  {
    id: "fireball",
    name: "Bola de Fogo",
    level: 3,
    school: "Evocação",
    casting_time: "1 ação",
    range: "45m",
    components: "V, S, M",
    duration: "Instantânea",
    description: "Um raio brilhante lampeja de seu dedo apontado para um ponto que você escolher dentro do alcance e então eclode em uma explosão de chamas. Cada criatura em uma esfera de 6 metros de raio centrada naquele ponto deve fazer um teste de resistência de Destreza. Um alvo sofre 8d6 de dano de fogo em uma falha, ou metade em um sucesso.",
    damage: "8d6",
    damage_type: "fogo",
    save: "dexterity",
  },
  {
    id: "lightning_bolt",
    name: "Relâmpago",
    level: 3,
    school: "Evocação",
    casting_time: "1 ação",
    range: "Pessoal (linha de 30m)",
    components: "V, S, M",
    duration: "Instantânea",
    description: "Um raio de luz lampeja em uma linha de 30 metros de comprimento e 1,5 metro de largura. Cada criatura na linha deve fazer um teste de resistência de Destreza. Uma criatura sofre 8d6 de dano elétrico em uma falha, ou metade em um sucesso.",
    damage: "8d6",
    damage_type: "elétrico",
    save: "dexterity",
  },

  // Level 4 Spells
  {
    id: "ice_storm",
    name: "Tempestade de Gelo",
    level: 4,
    school: "Evocação",
    casting_time: "1 ação",
    range: "90m",
    components: "V, S, M",
    duration: "Instantânea",
    description: "Uma chuva de granizo congelante cai em um cilindro de 6 metros de raio e 12 metros de altura centrado em um ponto dentro do alcance. Cada criatura no cilindro deve fazer um teste de resistência de Destreza. Uma criatura sofre 2d8 de dano de concussão e 4d6 de dano de frio em uma falha, ou metade em um sucesso.",
    damage: "2d8 + 4d6",
    damage_type: "frio/concussão",
    save: "dexterity",
  },

  // Level 5 Spells
  {
    id: "cone_of_cold",
    name: "Cone de Frio",
    level: 5,
    school: "Evocação",
    casting_time: "1 ação",
    range: "Pessoal (cone de 18m)",
    components: "V, S, M",
    duration: "Instantânea",
    description: "Uma rajada de ar frio irrompe de suas mãos. Cada criatura em um cone de 18 metros deve fazer um teste de resistência de Constituição. Uma criatura sofre 8d8 de dano de frio em uma falha, ou metade em um sucesso.",
    damage: "8d8",
    damage_type: "frio",
    save: "constitution",
  },
];

export const getSpellById = (id: string): Spell | undefined => {
  return DND_SPELLS.find(s => s.id === id);
};

export const getSpellsByLevel = (level: number): Spell[] => {
  return DND_SPELLS.filter(s => s.level === level);
};
