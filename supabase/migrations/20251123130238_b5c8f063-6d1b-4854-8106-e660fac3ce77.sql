-- ============================================================================
-- COMPLETE SHOP SYSTEM REBUILD MIGRATION
-- Removes AI-generated shop system and replaces with database-driven system
-- ============================================================================

-- 1. DROP OLD SHOP SYSTEM
DROP TABLE IF EXISTS shop_states CASCADE;

-- 2. CREATE NEW ITEM SYSTEM
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'very_rare', 'legendary')),
  type TEXT NOT NULL, -- weapon, armor, consumable, misc
  atk INTEGER DEFAULT 0,
  def INTEGER DEFAULT 0,
  description TEXT,
  lore TEXT,
  price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. CREATE SHOPS TABLE
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1,
  shop_type TEXT NOT NULL, -- blacksmith, jewelry, general, alchemist
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE SHOP_ITEMS JUNCTION TABLE
CREATE TABLE shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  min_stage INTEGER NOT NULL DEFAULT 1,
  max_stage INTEGER DEFAULT NULL, -- NULL means available forever
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shop_id, item_id)
);

-- 5. EXTEND ROOMS TABLE
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS campaign_type TEXT DEFAULT 'fantasy',
ADD COLUMN IF NOT EXISTS story_stage INTEGER DEFAULT 1;

-- 6. RLS POLICIES
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view items
CREATE POLICY "Authenticated users can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can view shops
CREATE POLICY "Authenticated users can view shops"
  ON shops FOR SELECT
  TO authenticated
  USING (true);

-- Anyone authenticated can view shop_items
CREATE POLICY "Authenticated users can view shop_items"
  ON shop_items FOR SELECT
  TO authenticated
  USING (true);

-- 7. SEED INITIAL ITEMS (Fantasy Campaign)
INSERT INTO items (name, rarity, type, atk, def, price, description, lore) VALUES
-- Common Consumables
('Poção de Cura Menor', 'common', 'consumable', 0, 0, 50, 'Restaura 2d4+2 HP', 'Uma poção vermelha brilhante em uma garrafa de vidro'),
('Antídoto', 'common', 'consumable', 0, 0, 50, 'Cura veneno', 'Líquido verde-limão com cheiro pungente'),
('Ração (1 dia)', 'common', 'consumable', 0, 0, 5, 'Comida preservada', 'Pão seco, queijo e carne salgada'),
('Poção de Cura', 'uncommon', 'consumable', 0, 0, 150, 'Restaura 4d4+4 HP', 'Poção de qualidade superior, feita por alquimistas experientes'),

-- Common Weapons
('Adaga', 'common', 'weapon', 4, 0, 20, '1d4 de dano perfurante', 'Uma lâmina curta e afiada, fácil de esconder'),
('Espada Curta', 'common', 'weapon', 6, 0, 100, '1d6 de dano perfurante', 'Espada versátil, favorita de ladrões e exploradores'),
('Espada Longa', 'common', 'weapon', 8, 0, 150, '1d8 de dano cortante', 'A espada clássica de todo aventureiro'),
('Machado de Batalha', 'common', 'weapon', 8, 0, 100, '1d8 de dano cortante', 'Machado pesado usado por guerreiros brutais'),
('Arco Curto', 'common', 'weapon', 6, 0, 250, '1d6 de dano perfurante (alcance)', 'Arco leve e prático para caçadores'),

-- Uncommon Weapons
('Espada Longa +1', 'uncommon', 'weapon', 10, 0, 500, '1d8+1 de dano cortante', 'Espada encantada com runas mágicas fracas'),
('Arco Longo Élfico', 'uncommon', 'weapon', 10, 0, 800, '1d8+1 de dano perfurante (alcance)', 'Arco élfico feito de madeira das florestas antigas'),
('Machado de Guerra Anão', 'uncommon', 'weapon', 12, 0, 750, '1d10+1 de dano cortante', 'Forjado nas montanhas pelos mestres ferreiros anões'),

-- Rare Weapons
('Espada Flamejante', 'rare', 'weapon', 15, 0, 2500, '2d6+3 de dano ígneo', 'Lâmina que brilha com chamas eternas'),
('Arco do Caçador', 'rare', 'weapon', 14, 0, 3000, '1d8+3 de dano perfurante (alcance, +2 contra bestas)', 'Arco lendário usado por caçadores de monstros'),

-- Very Rare Weapons
('Lâmina do Dragão', 'very_rare', 'weapon', 20, 0, 8000, '2d8+5 de dano cortante', 'Forjada com escamas de dragão vermelho'),
('Martelo Trovejante', 'very_rare', 'weapon', 22, 0, 9000, '2d6+5 de dano elétrico', 'Martelo que invoca o poder das tempestades'),

-- Legendary Weapons
('Excalibur', 'legendary', 'weapon', 30, 0, 50000, '3d8+10 de dano radiante', 'A lendária espada dos reis, brilha com luz divina'),
('Arco Estelar', 'legendary', 'weapon', 28, 0, 45000, '3d6+10 de dano radiante (alcance infinito)', 'Arco forjado com fragmentos de estrelas caídas'),

-- Common Armor
('Armadura de Couro', 'common', 'armor', 0, 11, 100, 'CA 11 + DES', 'Armadura leve e flexível'),
('Armadura de Couro Batido', 'common', 'armor', 0, 12, 450, 'CA 12 + DES', 'Couro reforçado com placas metálicas'),
('Cota de Malha', 'common', 'armor', 0, 13, 750, 'CA 13', 'Anéis de metal entrelaçados'),
('Armadura de Placas', 'common', 'armor', 0, 16, 1500, 'CA 16', 'Armadura pesada de aço completo'),

-- Uncommon Armor
('Armadura de Placas +1', 'uncommon', 'armor', 0, 17, 3000, 'CA 17', 'Armadura encantada com proteção mágica'),
('Cota Élfica', 'uncommon', 'armor', 0, 14, 2500, 'CA 14 + DES (sem desvantagem em furtividade)', 'Cota de malha élfica leve como seda'),

-- Rare Armor
('Armadura do Guardião', 'rare', 'armor', 0, 18, 8000, 'CA 18 + resistência a dano', 'Armadura abençoada por deuses protetores'),
('Manto das Sombras', 'rare', 'armor', 0, 13, 6000, 'CA 13 + DES + invisibilidade 1x/dia', 'Manto negro que se funde com as trevas'),

-- Very Rare Armor
('Armadura de Dragão', 'very_rare', 'armor', 0, 20, 25000, 'CA 20 + resistência a fogo', 'Feita com escamas de dragão ancião'),

-- Legendary Armor
('Aegis Divino', 'legendary', 'armor', 0, 22, 100000, 'CA 22 + imunidade a veneno e doenças', 'Escudo dos deuses, concedido apenas aos mais dignos'),

-- Misc Items
('Corda (15m)', 'common', 'misc', 0, 0, 10, 'Corda resistente', 'Útil para escaladas e armadilhas'),
('Tocha', 'common', 'misc', 0, 0, 1, 'Ilumina 6m por 1 hora', 'Tocha simples de madeira'),
('Kit de Ferramentas de Ladrão', 'common', 'misc', 0, 0, 250, '+2 em testes de arrombamento', 'Ganzuas e ferramentas precisas'),
('Pergaminho de Bola de Fogo', 'rare', 'misc', 0, 0, 1500, 'Lança bola de fogo (8d6)', 'Pergaminho mágico de uso único'),
('Poção de Invisibilidade', 'very_rare', 'consumable', 0, 0, 5000, 'Torna invisível por 1 hora', 'Poção transparente que reflete a luz'),
('Elixir da Vida', 'legendary', 'consumable', 0, 0, 50000, 'Restaura completamente HP e remove todas condições', 'Líquido dourado que pulsa com energia vital');

-- 8. CREATE SHOPS (Fantasy Campaign)
INSERT INTO shops (campaign_type, stage, shop_type, name, description) VALUES
('fantasy', 1, 'blacksmith', 'Forja de Ulgar', 'Uma forja barulhenta e quente, repleta de armas e armaduras'),
('fantasy', 1, 'general', 'Mercado de Aventureiros', 'Uma loja geral que vende de tudo para aventureiros'),
('fantasy', 3, 'jewelry', 'Joalheria de Margot', 'Uma loja elegante com itens mágicos e joias raras'),
('fantasy', 5, 'alchemist', 'Alquimia Arcana', 'Um laboratório misterioso com poções e pergaminhos'),
('fantasy', 10, 'blacksmith', 'Forja Lendária de Thrain', 'A forja mais famosa do reino, onde são criadas armas lendárias');

-- 9. LINK ITEMS TO SHOPS (stage-based availability)
-- Blacksmith (Stage 1) - Common weapons and armor
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage)
SELECT s.id, i.id, 1, NULL
FROM shops s, items i
WHERE s.shop_type = 'blacksmith' AND s.stage = 1
AND i.name IN ('Adaga', 'Espada Curta', 'Espada Longa', 'Machado de Batalha', 'Arco Curto', 'Armadura de Couro', 'Armadura de Couro Batido', 'Cota de Malha', 'Armadura de Placas');

-- General Store (Stage 1) - Consumables and misc
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage)
SELECT s.id, i.id, 1, NULL
FROM shops s, items i
WHERE s.shop_type = 'general' AND s.stage = 1
AND i.name IN ('Poção de Cura Menor', 'Antídoto', 'Ração (1 dia)', 'Corda (15m)', 'Tocha', 'Kit de Ferramentas de Ladrão');

-- Jewelry (Stage 3) - Uncommon items
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage)
SELECT s.id, i.id, 3, NULL
FROM shops s, items i
WHERE s.shop_type = 'jewelry' AND s.stage = 3
AND i.rarity IN ('uncommon', 'rare') AND i.type IN ('weapon', 'armor');

-- Alchemist (Stage 5) - Rare consumables
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage)
SELECT s.id, i.id, 5, NULL
FROM shops s, items i
WHERE s.shop_type = 'alchemist' AND s.stage = 5
AND i.name IN ('Poção de Cura', 'Pergaminho de Bola de Fogo', 'Poção de Invisibilidade');

-- Legendary Blacksmith (Stage 10) - Legendary items
INSERT INTO shop_items (shop_id, item_id, min_stage, max_stage)
SELECT s.id, i.id, 10, NULL
FROM shops s, items i
WHERE s.shop_type = 'blacksmith' AND s.stage = 10
AND i.rarity IN ('very_rare', 'legendary');