-- Create merchant auctions table
CREATE TABLE public.merchant_auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  item_type text NOT NULL DEFAULT 'misc',
  description text,
  properties jsonb DEFAULT '{}',
  weight numeric NOT NULL DEFAULT 0,
  starting_price integer NOT NULL,
  current_price integer NOT NULL,
  current_bidder_id uuid REFERENCES public.characters(id),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create auction bids table
CREATE TABLE public.auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.merchant_auctions(id) ON DELETE CASCADE,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  bid_amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.merchant_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchant_auctions
CREATE POLICY "Players can view auctions in their room"
  ON public.merchant_auctions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.room_players
      WHERE room_players.room_id = merchant_auctions.room_id
      AND room_players.user_id = auth.uid()
    )
  );

CREATE POLICY "GM can create auctions in their room"
  ON public.merchant_auctions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = merchant_auctions.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can update auctions in their room"
  ON public.merchant_auctions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = merchant_auctions.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

CREATE POLICY "GM can delete auctions in their room"
  ON public.merchant_auctions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = merchant_auctions.room_id
      AND rooms.gm_id = auth.uid()
    )
  );

-- RLS policies for auction_bids
CREATE POLICY "Players can view bids in their room auctions"
  ON public.auction_bids
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.merchant_auctions ma
      JOIN public.room_players rp ON rp.room_id = ma.room_id
      WHERE ma.id = auction_bids.auction_id
      AND rp.user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create bids for their characters"
  ON public.auction_bids
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.characters
      WHERE characters.id = auction_bids.character_id
      AND characters.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_merchant_auctions_room_id ON public.merchant_auctions(room_id);
CREATE INDEX idx_merchant_auctions_status ON public.merchant_auctions(status);
CREATE INDEX idx_auction_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX idx_auction_bids_character_id ON public.auction_bids(character_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.merchant_auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auction_bids;