/**
 * Extracts shop items from GM narration text.
 * Detects item lists in various formats (bullet points, numbered lists, etc.)
 * and returns structured item data along with cleaned narration text.
 */

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  stats: string | null;
  price: string | null;
  raw: string;
}

export interface ExtractShopItemsResult {
  items: ShopItem[];
  cleanedText: string;
}

/**
 * Extracts shop items from text and returns structured data.
 * Supports multiple formats:
 * - Bullet points: • Item name: price (stats)
 * - Numbered lists: 1. Item name: price (stats)
 * - Dash lists: - Item name: price (stats)
 * - Lines with colons and prices (PO, GP, etc.)
 * - Lines with parentheses containing stats
 */
export function extractShopItems(text: string): ExtractShopItemsResult {
  if (!text || typeof text !== 'string') {
    return { items: [], cleanedText: text };
  }

  const items: ShopItem[] = [];
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let inItemList = false;
  let itemListStartIndex = -1;
  let itemListEndIndex = -1;
  let consecutiveItemLines = 0;

  // Patterns to detect item lists - more flexible
  const itemPatterns = [
    /^[\s]*[•\-\*]\s+(.+)$/, // Bullet points: •, -, *
    /^[\s]*\d+[\.\)]\s+(.+)$/, // Numbered: 1. or 1)
    /^[\s]*[-–—]\s+(.+)$/, // Dashes: -, –, —
    /^[\s]*[▪▫▸▹▻►]\s+(.+)$/, // Other bullet types
  ];

  // Pattern to detect shop-related keywords that might indicate a list is coming
  const shopKeywords = /(itens?|loja|mercador|vendedor|comprar|preço|preços|disponível|estoque|inventário|catálogo|comuns?|raros?|especiais?)/i;

  // Pattern to extract price (PO, GP, PP, etc.) - more flexible
  const pricePattern = /:?\s*(\d+[\.,]?\d*\s*(PO|GP|PP|PE|PC|PL|Peças?\s+de\s+Ouro|Gold\s+Pieces?|moedas?|coins?|ouro|prata|cobre|platina|electrum))/i;
  
  // Pattern to extract stats from parentheses
  const statsPattern = /\(([^)]+)\)/;

  // First pass: identify item list boundaries with better detection
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line matches an item pattern
    const isItemLine = itemPatterns.some(pattern => pattern.test(line));
    
    // Also check if line looks like an item (has colon and price-like text, or starts with item-like pattern)
    // More flexible: detect items that have name: price format or name (description) format
    const hasNamePriceFormat = /^[\s]*[•\-\*\d]?[\s]*[A-Za-zÀ-ÿ][^:]*:\s*\d+/.test(line);
    const hasPricePattern = pricePattern.test(line);
    const hasBulletStart = /^[\s]*[•\-\*\d]/.test(line);
    const looksLikeItem = hasNamePriceFormat || 
                         (hasPricePattern && hasBulletStart) ||
                         (/^[\s]*[•\-\*]\s*[A-Za-zÀ-ÿ]/.test(line) && line.length > 5 && line.length < 150) ||
                         // Also detect lines that start with capital letter, have colon and numbers (price)
                         (/^[A-ZÀ-Ÿ][^:]*:\s*\d+/.test(line) && line.length < 150);
    
    const isItem = isItemLine || looksLikeItem;
    
    if (isItem && !inItemList) {
      // Start of item list
      inItemList = true;
      itemListStartIndex = i;
      consecutiveItemLines = 1;
    } else if (isItem && inItemList) {
      // Continue item list
      consecutiveItemLines++;
    } else if (inItemList && !isItem && line.length > 0) {
      // Check if this might be a section header (like "Itens Comuns:")
      const isSectionHeader = /^[A-ZÀ-Ÿ][^:]*:?\s*$/.test(line) && 
                              (shopKeywords.test(line) || line.length < 50);
      
      if (!isSectionHeader && consecutiveItemLines >= 2) {
        // End of item list (non-empty line that doesn't match pattern, and we had at least 2 items)
        itemListEndIndex = i;
        inItemList = false;
        consecutiveItemLines = 0;
      } else if (isSectionHeader) {
        // Section header, continue but reset counter
        consecutiveItemLines = 0;
      } else {
        // Might be continuation, but reset counter
        consecutiveItemLines = 0;
      }
    } else if (inItemList && line.length === 0 && consecutiveItemLines >= 2) {
      // Empty line after items - end of list if we had enough items
      itemListEndIndex = i;
      inItemList = false;
      consecutiveItemLines = 0;
    }
  }

  // If we're still in a list at the end, mark the end
  if (inItemList && consecutiveItemLines >= 2) {
    itemListEndIndex = lines.length;
  }

  // Second pass: extract items and build cleaned text
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if this line is part of the item list
    if (i >= itemListStartIndex && i < itemListEndIndex && itemListStartIndex >= 0) {
      // Skip section headers
      const isSectionHeader = /^[A-ZÀ-Ÿ][^:]*:?\s*$/.test(trimmedLine) && 
                              (shopKeywords.test(trimmedLine) || trimmedLine.length < 50);
      
      if (isSectionHeader) {
        // Keep section headers in cleaned text for context
        cleanedLines.push(line);
        continue;
      }

      // Try to parse as an item
      let itemText = '';
      let matched = false;

      for (const pattern of itemPatterns) {
        const match = trimmedLine.match(pattern);
        if (match) {
          itemText = match[1].trim();
          matched = true;
          break;
        }
      }

      // If no pattern matched but line looks like an item, try to extract directly
      if (!matched) {
        // Try to extract from lines that look like items (name: price or name (stats))
        if (/^[\s]*[•\-\*\d]?[\s]*[A-Za-zÀ-ÿ]/.test(trimmedLine) || 
            /^[A-ZÀ-Ÿ][^:]*:\s*\d+/.test(trimmedLine)) {
          // Remove leading bullet/number markers
          itemText = trimmedLine.replace(/^[\s]*[•\-\*\d]+[\.\)]?\s*/, '').trim();
          matched = true;
        }
      }

      if (matched && itemText.length > 0) {
        // Extract price
        const priceMatch = itemText.match(pricePattern);
        let price: string | null = null;
        let nameAndStats = itemText;
        
        if (priceMatch) {
          price = priceMatch[1].trim();
          nameAndStats = itemText.replace(priceMatch[0], '').trim();
          // Clean up any trailing colons or spaces
          nameAndStats = nameAndStats.replace(/[:,\s]+$/, '').trim();
        }
        
        // Extract stats from parentheses
        const statsMatch = nameAndStats.match(statsPattern);
        let name = nameAndStats;
        let stats: string | null = null;
        
        if (statsMatch) {
          stats = statsMatch[1];
          name = nameAndStats.replace(statsPattern, '').trim();
          // Clean up any trailing spaces or commas
          name = name.replace(/[,\s]+$/, '').trim();
        }

        // Build description from price and stats
        const descriptionParts: string[] = [];
        if (price) descriptionParts.push(price);
        if (stats) descriptionParts.push(stats);
        const description = descriptionParts.join(' - ');

        // Only add if we have a name
        if (name.length > 0) {
          items.push({
            id: `item-${i}-${Date.now()}`,
            name,
            description: description || '',
            stats: stats || price, // Use stats if available, otherwise price
            price,
            raw: itemText,
          });
        }
        
        // Don't add this line to cleaned text
        continue;
      }
    }
    
    // Not an item line, add to cleaned text
    cleanedLines.push(line);
  }

  // Return items if:
  // - We found at least 2 items (strong signal of a list)
  // - OR we found 1 item with price or stats (likely a shop item)
  const hasItemsWithPriceOrStats = items.some(item => item.price !== null || item.stats !== null);
  const finalItems = (items.length >= 2 || (items.length === 1 && hasItemsWithPriceOrStats)) ? items : [];

  // Join cleaned lines, preserving original line breaks
  const cleanedText = cleanedLines.join('\n').trim();

  return {
    items: finalItems,
    cleanedText: cleanedText || text, // Fallback to original if cleaning removed everything
  };
}

