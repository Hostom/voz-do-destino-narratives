import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestockRequest {
  roomId: string;
  shopId?: string; // Optional: restock specific shop, otherwise restock all shops in room
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RestockRequest = await req.json();
    const { roomId, shopId } = body;

    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'roomId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is GM of the room
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('gm_id, campaign_type')
      .eq('id', roomId)
      .single();

    if (roomError || !room || room.gm_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only GM can restock shops' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Restocking shops for room ${roomId}, campaign: ${room.campaign_type}`);

    // Get all shops for this campaign type
    let shopsQuery = supabaseClient
      .from('shops')
      .select('id')
      .eq('campaign_type', room.campaign_type);

    if (shopId) {
      shopsQuery = shopsQuery.eq('id', shopId);
    }

    const { data: shops, error: shopsError } = await shopsQuery;

    if (shopsError || !shops || shops.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No shops found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shopIds = shops.map(s => s.id);

    // Restock all shop_items for these shops
    // Set stock to original values based on rarity
    const { error: restockError } = await supabaseClient.rpc('restock_shops', {
      shop_ids: shopIds
    });

    if (restockError) {
      // If RPC doesn't exist, do manual update
      console.log('RPC not found, doing manual restock');
      
      // Get all shop_items for these shops
      const { data: shopItems, error: fetchError } = await supabaseClient
        .from('shop_items')
        .select('id, shop_id, item_id, items(rarity)')
        .in('shop_id', shopIds);

      if (fetchError || !shopItems) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch shop items' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update each shop_item with new stock
      for (const shopItem of shopItems) {
        const rarity = (shopItem as any).items?.rarity || 'common';
        let newStock = 10; // default for common/uncommon
        
        if (rarity === 'rare') {
          newStock = 5;
        } else if (rarity === 'very_rare' || rarity === 'legendary') {
          newStock = 2;
        }

        await supabaseClient
          .from('shop_items')
          .update({ 
            stock: newStock,
            last_restock: new Date().toISOString()
          })
          .eq('id', shopItem.id);
      }

      console.log(`Manually restocked ${shopItems.length} items`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Restocked ${shops.length} shop(s)`,
        restockedShops: shops.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in restock-shop function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
