export interface ShopItem {
  id: string;
  name: string;
  description: string;
  stats: string[];
  type: string | null;
  price?: number | string | null;
  rarity?: string | null;
  weight?: string | null;
}

/**
 * Parses GM narrative text to extract shop items
 * Detects bullet-list items and extracts name, description, stats, price, etc.
 */
export function parseItemList(text: string): ShopItem[] {
  if (!text) return [];

  const items: ShopItem[] = [];
  
  // Match bullet points with optional stats in parentheses
  const itemRegex = /^[•*-]\s*(.+?)(?:\s*\*?\(([^)]+)\)\*?)?$/gm;
  
  let match;
  let index = 0;
  
  while ((match = itemRegex.exec(text)) !== null) {
    const fullText = match[1]?.trim();
    const statsText = match[2]?.trim();
    
    if (!fullText) continue;
    
    // Extract price patterns (e.g., "for 20 gold", "costs 15 silver", "50gp")
    const pricePatterns = [
      /(?:for|costs?|price:?)\s*(\d+)\s*(gold|silver|copper|gp|sp|cp|po|pp)/i,
      /(\d+)\s*(gold|silver|copper|gp|sp|cp|po|pp)/i,
    ];
    
    let price: string | null = null;
    let description = fullText;
    
    for (const pattern of pricePatterns) {
      const priceMatch = fullText.match(pattern);
      if (priceMatch) {
        price = `${priceMatch[1]} ${priceMatch[2]}`;
        // Remove price from description
        description = fullText.replace(priceMatch[0], '').trim();
        break;
      }
    }
    
    // Extract name (first part before comma or ellipsis)
    const nameParts = description.split(/[,…]/);
    const name = nameParts[0]?.trim() || description;
    const restDescription = nameParts.slice(1).join(',').trim();
    
    // Parse stats from parentheses
    const stats: string[] = [];
    if (statsText) {
      // Split by comma and clean up
      stats.push(...statsText.split(',').map(s => s.trim()).filter(Boolean));
    }
    
    // Infer type from stats or description
    let type: string | null = null;
    const lowerStats = statsText?.toLowerCase() || '';
    const lowerDesc = description.toLowerCase();
    
    if (lowerStats.includes('longsword') || lowerDesc.includes('sword')) {
      type = 'weapon';
    } else if (lowerStats.includes('shield') || lowerDesc.includes('shield')) {
      type = 'armor';
    } else if (lowerStats.includes('dagger') || lowerDesc.includes('dagger')) {
      type = 'weapon';
    } else if (lowerStats.includes('tools') || lowerDesc.includes('tools')) {
      type = 'tool';
    } else if (lowerDesc.includes('potion') || lowerDesc.includes('elixir')) {
      type = 'consumable';
    } else if (lowerStats.match(/\+?\d+\s*ac/i)) {
      type = 'armor';
    } else if (lowerStats.match(/\d+d\d+/i)) {
      type = 'weapon';
    }
    
    // Infer rarity from description
    let rarity: string | null = null;
    const rarityKeywords = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'];
    for (const keyword of rarityKeywords) {
      if (lowerDesc.includes(keyword)) {
        rarity = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
    
    // Extract weight if mentioned
    let weight: string | null = null;
    const weightMatch = fullText.match(/(\d+\.?\d*)\s*(lb|kg|pounds?|kilos?)/i);
    if (weightMatch) {
      weight = `${weightMatch[1]} ${weightMatch[2]}`;
    }
    
    items.push({
      id: `item-${index++}-${Date.now()}`,
      name,
      description: restDescription || description,
      stats,
      type,
      price,
      rarity,
      weight,
    });
  }
  
  return items;
}

/**
 * Checks if a message contains potential shop items
 */
export function hasShopItems(text: string): boolean {
  if (!text) return false;
  
  // Check for bullet points
  const hasBullets = /^[•*-]\s+/m.test(text);
  
  // Check for item-related keywords
  const hasItemKeywords = /\b(sword|shield|potion|dagger|armor|weapon|tool|item|equipment)\b/i.test(text);
  
  // Check for stats patterns
  const hasStatsPattern = /\(\s*[\w\s,+\d]+\s*\)/.test(text);
  
  return hasBullets && (hasItemKeywords || hasStatsPattern);
}
