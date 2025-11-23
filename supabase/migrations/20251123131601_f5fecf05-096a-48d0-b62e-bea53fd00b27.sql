-- Add stock management to shop_items
ALTER TABLE shop_items 
ADD COLUMN stock integer DEFAULT -1,
ADD COLUMN last_restock timestamptz DEFAULT now();

COMMENT ON COLUMN shop_items.stock IS 'Stock quantity. -1 means unlimited stock';
COMMENT ON COLUMN shop_items.last_restock IS 'Last time this item was restocked';

-- Update existing shop_items to have stock
UPDATE shop_items SET stock = 5 WHERE min_stage >= 5; -- Rare items have limited stock
UPDATE shop_items SET stock = 10 WHERE min_stage < 5; -- Common items have more stock

-- Insert SCI-FI campaign shops and items
INSERT INTO shops (id, campaign_type, stage, name, description, shop_type) VALUES
('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'scifi', 1, 'Tech Depot Alpha', 'A grimy tech shop filled with salvaged gear and energy weapons', 'general'),
('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'scifi', 1, 'Plasma Forge', 'High-tech weapon manufacturing facility with cutting-edge armaments', 'blacksmith'),
('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'scifi', 1, 'Cyber Implants Inc', 'Biotech enhancement center offering neural and physical upgrades', 'jewelry'),
('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'scifi', 1, 'Stim Station', 'Pharmaceutical supplier with combat stims and medical nanites', 'alchemist');

INSERT INTO items (name, rarity, type, atk, def, price, description, lore) VALUES
-- Sci-fi weapons
('Laser Pistol', 'common', 'weapon', 6, 0, 150, '1d6 energy damage, never needs reloading', 'Standard issue sidearm for spacers'),
('Plasma Rifle', 'uncommon', 'weapon', 12, 0, 800, '2d6 plasma damage, superheats targets', 'Military-grade energy weapon'),
('Railgun', 'rare', 'weapon', 20, 0, 2500, '3d8 kinetic damage, armor-piercing rounds', 'Electromagnetic accelerator cannon'),
('Fusion Blade', 'very_rare', 'weapon', 25, 0, 5000, '3d10 + 2d6 fire damage, molecular disruption', 'Superheated plasma-edged sword'),

-- Sci-fi armor
('Exo-Suit', 'common', 'armor', 0, 13, 200, 'AC 13, lightweight powered armor', 'Basic protective exoskeleton'),
('Combat Shield Generator', 'uncommon', 'armor', 0, 15, 1200, 'AC 15, energy shield that regenerates', 'Personal force field projector'),
('Titan Armor', 'rare', 'armor', 0, 18, 3500, 'AC 18, heavy powered armor with servos', 'Military-grade battle suit'),

-- Sci-fi consumables
('Medkit', 'common', 'consumable', 0, 0, 80, 'Heals 2d6+4 HP instantly', 'Emergency medical supplies'),
('Combat Stim', 'uncommon', 'consumable', 0, 0, 200, 'Grants +2 to attack rolls for 1 minute', 'Adrenaline booster injection'),
('Nano-Repair Injector', 'rare', 'consumable', 0, 0, 500, 'Heals 5d8+10 HP and removes 1 condition', 'Microscopic repair nanites');

-- Insert HORROR campaign shops and items
INSERT INTO shops (id, campaign_type, stage, name, description, shop_type) VALUES
('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'horror', 1, 'The Occult Emporium', 'A shadowy shop with dusty shelves and forbidden artifacts', 'general'),
('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'horror', 1, 'Ironwright''s Sanctuary', 'A fortified workshop crafting blessed weapons against the darkness', 'blacksmith'),
('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'horror', 1, 'Cursed Curios', 'A collection of powerful but dangerous enchanted items', 'jewelry'),
('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'horror', 1, 'Apothecary of Last Resort', 'Ancient remedies and potions brewed in desperation', 'alchemist');

INSERT INTO items (name, rarity, type, atk, def, price, description, lore) VALUES
-- Horror weapons
('Silver Dagger', 'common', 'weapon', 5, 0, 120, '1d4 + 2d6 vs undead/lycanthropes', 'Blessed silver blade'),
('Crossbow of Warding', 'uncommon', 'weapon', 10, 0, 600, '1d10 damage, bolts glow near evil', 'Fires consecrated bolts'),
('Exorcist''s Blade', 'rare', 'weapon', 18, 0, 2000, '2d8 + 3d6 vs demons/undead', 'Forged with holy water and prayers'),
('The Banisher', 'very_rare', 'weapon', 28, 0, 6000, '4d8 radiant damage, forces extraplanar creatures away', 'Legendary demon-slaying weapon'),

-- Horror armor
('Ward Cloak', 'common', 'armor', 0, 12, 150, 'AC 12, advantage vs fear effects', 'Woven with protective symbols'),
('Sanctified Mail', 'uncommon', 'armor', 0, 14, 900, 'AC 14, resistance to necrotic damage', 'Blessed by ancient rites'),
('Bulwark of Faith', 'rare', 'armor', 0, 17, 3000, 'AC 17, immunity to possession', 'Armor infused with divine power'),

-- Horror consumables
('Holy Water Vial', 'common', 'consumable', 0, 0, 60, '2d6 radiant damage to undead/fiends', 'Consecrated water from sacred springs'),
('Elixir of Courage', 'uncommon', 'consumable', 0, 0, 180, 'Immunity to fear for 10 minutes', 'Distilled from rare mountain herbs'),
('Resurrection Draught', 'rare', 'consumable', 0, 0, 800, 'Returns recently deceased to life (1 hour)', 'Miracle potion of last resort');

-- Insert CYBERPUNK campaign shops and items
INSERT INTO shops (id, campaign_type, stage, name, description, shop_type) VALUES
('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 'cyberpunk', 1, 'Night Market', 'Underground tech bazaar with black market gear', 'general'),
('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'cyberpunk', 1, 'Chrome & Steel', 'Street-level weapon modder specializing in smart guns', 'blacksmith'),
('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'cyberpunk', 1, 'Neural Link', 'Ripperdoc clinic offering illegal cyberware installations', 'jewelry'),
('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'cyberpunk', 1, 'Chem Lab', 'Back-alley pharmacist selling combat drugs and boosters', 'alchemist');

INSERT INTO items (name, rarity, type, atk, def, price, description, lore) VALUES
-- Cyberpunk weapons
('Smart Pistol', 'common', 'weapon', 7, 0, 180, '1d8 damage, auto-targeting system', 'Neural-linked handgun'),
('Mono-Wire Whip', 'uncommon', 'weapon', 13, 0, 750, '2d6 slashing, can disarm enemies', 'Molecular-edged filament weapon'),
('Mantis Blades', 'rare', 'weapon', 22, 0, 2800, '3d8 slashing, retractable arm blades', 'Cybernetic assassin implants'),
('Sandevistan Cannon', 'very_rare', 'weapon', 30, 0, 7000, '4d10 damage, slows time on critical hit', 'Experimental time-dilation weapon'),

-- Cyberpunk armor
('Kevlar Jacket', 'common', 'armor', 0, 13, 220, 'AC 13, stylish streetwear protection', 'Bulletproof fashion'),
('Subdermal Plating', 'uncommon', 'armor', 0, 15, 1100, 'AC 15, embedded armor layer', 'Cybernetic defense augmentation'),
('Military-Grade Exoskeleton', 'rare', 'armor', 0, 18, 4000, 'AC 18, enhanced strength +2', 'Corporate security cyberware'),

-- Cyberpunk consumables
('Bounce-Back', 'common', 'consumable', 0, 0, 90, 'Heals 2d8+2 HP, rapid healing nanotech', 'Street-grade healing injector'),
('Reflex Booster', 'uncommon', 'consumable', 0, 0, 250, '+3 to initiative and DEX saves for 5 minutes', 'Neural accelerator drug'),
('Chrome Crusher', 'rare', 'consumable', 0, 0, 600, 'Overclock cyberware for double output, 1 minute', 'Dangerous performance enhancer');

-- Link all sci-fi items to sci-fi shops
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage, stock) 
SELECT 
  s.id,
  i.id,
  CASE 
    WHEN i.rarity = 'common' THEN 1
    WHEN i.rarity = 'uncommon' THEN 3
    WHEN i.rarity = 'rare' THEN 5
    WHEN i.rarity = 'very_rare' THEN 8
    ELSE 10
  END,
  NULL,
  CASE 
    WHEN i.rarity IN ('common', 'uncommon') THEN 10
    WHEN i.rarity = 'rare' THEN 5
    ELSE 2
  END
FROM shops s
CROSS JOIN items i
WHERE s.campaign_type = 'scifi'
  AND ((s.shop_type = 'general' AND i.type IN ('consumable', 'weapon', 'armor'))
    OR (s.shop_type = 'blacksmith' AND i.type = 'weapon')
    OR (s.shop_type = 'jewelry' AND i.type = 'armor')
    OR (s.shop_type = 'alchemist' AND i.type = 'consumable'))
  AND i.name LIKE '%Laser%' OR i.name LIKE '%Plasma%' OR i.name LIKE '%Railgun%' 
    OR i.name LIKE '%Fusion%' OR i.name LIKE '%Exo-%' OR i.name LIKE '%Shield%'
    OR i.name LIKE '%Titan%' OR i.name LIKE '%Medkit%' OR i.name LIKE '%Stim%'
    OR i.name LIKE '%Nano-%';

-- Link all horror items to horror shops
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage, stock)
SELECT 
  s.id,
  i.id,
  CASE 
    WHEN i.rarity = 'common' THEN 1
    WHEN i.rarity = 'uncommon' THEN 3
    WHEN i.rarity = 'rare' THEN 5
    WHEN i.rarity = 'very_rare' THEN 8
    ELSE 10
  END,
  NULL,
  CASE 
    WHEN i.rarity IN ('common', 'uncommon') THEN 10
    WHEN i.rarity = 'rare' THEN 5
    ELSE 2
  END
FROM shops s
CROSS JOIN items i
WHERE s.campaign_type = 'horror'
  AND ((s.shop_type = 'general' AND i.type IN ('consumable', 'weapon', 'armor'))
    OR (s.shop_type = 'blacksmith' AND i.type = 'weapon')
    OR (s.shop_type = 'jewelry' AND i.type = 'armor')
    OR (s.shop_type = 'alchemist' AND i.type = 'consumable'))
  AND (i.name LIKE '%Silver%' OR i.name LIKE '%Crossbow%' OR i.name LIKE '%Exorcist%' 
    OR i.name LIKE '%Banisher%' OR i.name LIKE '%Ward%' OR i.name LIKE '%Sanctified%'
    OR i.name LIKE '%Bulwark%' OR i.name LIKE '%Holy%' OR i.name LIKE '%Elixir%'
    OR i.name LIKE '%Resurrection%');

-- Link all cyberpunk items to cyberpunk shops
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage, stock)
SELECT 
  s.id,
  i.id,
  CASE 
    WHEN i.rarity = 'common' THEN 1
    WHEN i.rarity = 'uncommon' THEN 3
    WHEN i.rarity = 'rare' THEN 5
    WHEN i.rarity = 'very_rare' THEN 8
    ELSE 10
  END,
  NULL,
  CASE 
    WHEN i.rarity IN ('common', 'uncommon') THEN 10
    WHEN i.rarity = 'rare' THEN 5
    ELSE 2
  END
FROM shops s
CROSS JOIN items i
WHERE s.campaign_type = 'cyberpunk'
  AND ((s.shop_type = 'general' AND i.type IN ('consumable', 'weapon', 'armor'))
    OR (s.shop_type = 'blacksmith' AND i.type = 'weapon')
    OR (s.shop_type = 'jewelry' AND i.type = 'armor')
    OR (s.shop_type = 'alchemist' AND i.type = 'consumable'))
  AND (i.name LIKE '%Smart%' OR i.name LIKE '%Mono-%' OR i.name LIKE '%Mantis%' 
    OR i.name LIKE '%Sandevistan%' OR i.name LIKE '%Kevlar%' OR i.name LIKE '%Subdermal%'
    OR i.name LIKE '%Exoskeleton%' OR i.name LIKE '%Bounce%' OR i.name LIKE '%Reflex%'
    OR i.name LIKE '%Chrome%');