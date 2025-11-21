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
  if (!text) {
    console.log('[NPCShop] parseItemList: empty text');
    return [];
  }

  console.log('[NPCShop] parseItemList called with text:', text.substring(0, 200));

  const items: ShopItem[] = [];
  
  // Match bullet points with optional stats in parentheses or asterisks
  // This regex now handles: "• item *(stats)*" and "• item (stats)"
  const itemRegex = /^[•*-]\s*(.+?)(?:\s*\*?\(([^)]+)\)\*?)?$/gm;
  
  let match;
  let index = 0;
  
  while ((match = itemRegex.exec(text)) !== null) {
    console.log('[NPCShop] Regex match found:', match);
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
    
    const item = {
      id: `item-${index++}-${Date.now()}`,
      name,
      description: restDescription || description,
      stats,
      type,
      price,
      rarity,
      weight,
    };
    
    console.log('[NPCShop] Parsed item:', item);
    items.push(item);
  }
  
  console.log('[NPCShop] Total items parsed:', items.length);
  return items;
}

/**
 * Checks if a message contains potential shop items
 */
export function hasShopItems(text: string): boolean {
  if (!text) return false;
  
  console.log('[NPCShop] hasShopItems called');
  
  // Check for bullet points
  const hasBullets = /^[•*-]\s+/m.test(text);
  console.log('[NPCShop] hasBullets:', hasBullets);
  
  // Check for item-related keywords
  const hasItemKeywords = /\b(sword|shield|potion|dagger|armor|weapon|tool|item|equipment|espada|escudo|poção|adaga|armadura|arma|ferramenta|equipamento)\b/i.test(text);
  console.log('[NPCShop] hasItemKeywords:', hasItemKeywords);
  
  // Check for stats patterns
  const hasStatsPattern = /\(\s*[\w\s,+\d]+\s*\)/.test(text);
  console.log('[NPCShop] hasStatsPattern:', hasStatsPattern);
  
  const result = hasBullets && (hasItemKeywords || hasStatsPattern);
  console.log('[NPCShop] hasShopItems result:', result);
  
  return result;
}
