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

  console.log('[NPCShop] parseItemList called with text length:', text.length);
  console.log('[NPCShop] First 300 chars:', text.substring(0, 300));
  console.log('[NPCShop] Text contains bullet •:', text.includes('•'));
  console.log('[NPCShop] Text contains dash -:', text.includes('-'));
  console.log('[NPCShop] Text contains asterisk *:', text.includes('*'));

  const items: ShopItem[] = [];
  
  // Split text into lines and process each line
  const lines = text.split('\n');
  console.log('[NPCShop] Total lines:', lines.length);
  
  // Match bullet points with optional stats in parentheses or asterisks
  // Updated regex to be more flexible with whitespace and formatting
  const itemRegex = /^[•\u2022\u2023\u25E6\u2043\u2219*\-–—]\s*(.+?)(?:\s*\*?\(([^)]+)\)\*?)?$/;
  
  let index = 0;
  
  // Process each line individually
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    const match = itemRegex.exec(trimmedLine);
    if (!match) continue;
    
    console.log('[NPCShop] Line matched:', trimmedLine);
    console.log('[NPCShop] Regex match:', match);
    
    const fullText = match[1]?.trim();
    const statsText = match[2]?.trim();
    
    if (!fullText) continue;
    
    // Extract price patterns (e.g., "for 20 gold", "costs 15 silver", "50gp", "15 PO")
    const pricePatterns = [
      /(?:for|costs?|price:?)\s*(\d+)\s*(gold|silver|copper|gp|sp|cp|po|pp|ouro|prata|cobre)/i,
      /(\d+)\s*(gold|silver|copper|gp|sp|cp|po|pp|ouro|prata|cobre)/i,
      /(\d+)\s*PO/i,
    ];
    
    let price: string | null = null;
    let description = fullText;
    
    for (const pattern of pricePatterns) {
      const priceMatch = fullText.match(pattern);
      if (priceMatch) {
        price = `${priceMatch[1]} ${priceMatch[2]}`;
        // Remove price from description
        description = fullText.replace(priceMatch[0], '').trim();
        // Remove trailing colon if present
        description = description.replace(/:\s*$/, '').trim();
        break;
      }
    }
    
    // Extract name (first part before comma or ellipsis or colon)
    const nameParts = description.split(/[,:…]/);
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
    
    if (lowerStats.includes('longsword') || lowerDesc.includes('sword') || lowerDesc.includes('espada')) {
      type = 'weapon';
    } else if (lowerStats.includes('shield') || lowerDesc.includes('shield') || lowerDesc.includes('escudo')) {
      type = 'armor';
    } else if (lowerStats.includes('dagger') || lowerDesc.includes('dagger') || lowerDesc.includes('adaga')) {
      type = 'weapon';
    } else if (lowerStats.includes('tools') || lowerDesc.includes('tools') || lowerDesc.includes('ferramentas')) {
      type = 'tool';
    } else if (lowerDesc.includes('potion') || lowerDesc.includes('elixir') || lowerDesc.includes('poção')) {
      type = 'consumable';
    } else if (lowerStats.match(/\+?\d+\s*ac/i)) {
      type = 'armor';
    } else if (lowerStats.match(/\d+d\d+/i)) {
      type = 'weapon';
    } else if (lowerDesc.includes('machado') || lowerDesc.includes('axe')) {
      type = 'weapon';
    } else if (lowerDesc.includes('cota') || lowerDesc.includes('malha') || lowerDesc.includes('armor') || lowerDesc.includes('armadura')) {
      type = 'armor';
    } else if (lowerDesc.includes('anel') || lowerDesc.includes('ring')) {
      type = 'accessory';
    } else if (lowerDesc.includes('ferro') || lowerDesc.includes('aço') || lowerDesc.includes('iron') || lowerDesc.includes('steel')) {
      type = 'material';
    }
    
    // Infer rarity from description
    let rarity: string | null = null;
    const rarityKeywords = ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact', 'comum', 'incomum', 'raro', 'muito raro', 'lendário'];
    for (const keyword of rarityKeywords) {
      if (lowerDesc.includes(keyword)) {
        rarity = keyword.charAt(0).toUpperCase() + keyword.slice(1);
        break;
      }
    }
    
    // Infer rarity from price if not found
    if (!rarity && price) {
      const priceValue = parseInt(price.match(/\d+/)?.[0] || '0');
      if (priceValue >= 1000) {
        rarity = 'Rare';
      } else if (priceValue >= 100) {
        rarity = 'Uncommon';
      } else {
        rarity = 'Common';
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
  
  console.log('[NPCShop] hasShopItems called with text length:', text.length);
  
  // Check for bullet points (more comprehensive unicode check)
  const hasBullets = /^[•\u2022\u2023\u25E6\u2043\u2219*\-–—]\s+/m.test(text);
  console.log('[NPCShop] hasBullets:', hasBullets);
  
  // Check for item-related keywords (more comprehensive)
  const hasItemKeywords = /\b(sword|shield|potion|dagger|armor|weapon|tool|item|equipment|espada|escudo|poção|po|adaga|armadura|arma|ferramenta|equipamento|loja|shop|itens|items)\b/i.test(text);
  console.log('[NPCShop] hasItemKeywords:', hasItemKeywords);
  
  // Check for stats patterns or price patterns
  const hasStatsPattern = /\(\s*[\w\s,+\d]+\s*\)/.test(text);
  const hasPricePattern = /\d+\s*(po|gp|gold|ouro|peças)/i.test(text);
  console.log('[NPCShop] hasStatsPattern:', hasStatsPattern);
  console.log('[NPCShop] hasPricePattern:', hasPricePattern);
  
  const result = hasBullets && (hasItemKeywords || hasStatsPattern || hasPricePattern);
  console.log('[NPCShop] hasShopItems result:', result);
  
  return result;
}
