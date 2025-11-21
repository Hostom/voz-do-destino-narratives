/**
 * Shop pricing logic with rarity, quality, and NPC modifiers
 */

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type Quality = "broken" | "normal" | "refined" | "perfect" | "legendary";
export type Personality = "friendly" | "neutral" | "hostile";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  rarity: Rarity;
  quality: Quality;
  stock: number;
  attributes: Record<string, any>;
}

export interface ShopState {
  room_id: string;
  npc_name: string;
  npc_personality: Personality;
  npc_reputation: number;
  items: ShopItem[];
  updated_at: string;
}

/**
 * Calculate final price based on base price, rarity, quality, NPC personality, and reputation
 */
export function calculateFinalPrice(
  basePrice: number,
  rarity: Rarity,
  quality: Quality,
  personality: Personality,
  reputation: number
): number {
  // Rarity multipliers
  const rarityMultipliers: Record<Rarity, number> = {
    common: 1.0,
    uncommon: 1.5,
    rare: 2.5,
    epic: 5.0,
    legendary: 10.0,
  };

  // Quality multipliers
  const qualityMultipliers: Record<Quality, number> = {
    broken: 0.3,
    normal: 1.0,
    refined: 1.5,
    perfect: 2.0,
    legendary: 3.0,
  };

  // Personality modifiers (percentage)
  const personalityModifiers: Record<Personality, number> = {
    friendly: -0.10, // -10%
    neutral: 0.0,    // 0%
    hostile: 0.15,    // +15%
  };

  // Reputation modifier (each point = -2% price, max -50%)
  const reputationModifier = Math.min(reputation * 0.02, 0.50);

  // Calculate final price
  let finalPrice = basePrice;
  
  // Apply rarity multiplier
  finalPrice *= rarityMultipliers[rarity];
  
  // Apply quality multiplier
  finalPrice *= qualityMultipliers[quality];
  
  // Apply personality modifier
  finalPrice *= (1 + personalityModifiers[personality]);
  
  // Apply reputation modifier (subtract)
  finalPrice *= (1 - reputationModifier);

  // Round to nearest integer
  return Math.round(finalPrice);
}

/**
 * Get rarity color for UI
 */
export function getRarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: "text-gray-400",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-yellow-400",
  };
  return colors[rarity];
}

/**
 * Get rarity border color for UI
 */
export function getRarityBorderColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    common: "border-gray-500",
    uncommon: "border-green-500",
    rare: "border-blue-500",
    epic: "border-purple-500",
    legendary: "border-yellow-500",
  };
  return colors[rarity];
}

/**
 * Get quality stars (1-5)
 */
export function getQualityStars(quality: Quality): number {
  const stars: Record<Quality, number> = {
    broken: 1,
    normal: 2,
    refined: 3,
    perfect: 4,
    legendary: 5,
  };
  return stars[quality];
}

