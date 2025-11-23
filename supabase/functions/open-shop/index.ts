import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OpenShopRequest {
  roomId: string;
  shopType: 'blacksmith' | 'jewelry' | 'general' | 'alchemist';
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

    const body: OpenShopRequest = await req.json();
    const { roomId, shopType } = body;

    if (!roomId || !shopType) {
      return new Response(
        JSON.stringify({ error: 'roomId and shopType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Opening shop: ${shopType} for room ${roomId}`);

    // Verify user is in the room
    const { data: roomPlayer, error: roomError } = await supabaseClient
      .from('room_players')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (roomError || !roomPlayer) {
      return new Response(
        JSON.stringify({ error: 'User not in room' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get room's campaign type and story stage
    const { data: room, error: roomFetchError } = await supabaseClient
      .from('rooms')
      .select('campaign_type, story_stage')
      .eq('id', roomId)
      .single();

    if (roomFetchError || !room) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { campaign_type, story_stage } = room;

    console.log(`Campaign: ${campaign_type}, Stage: ${story_stage}`);

    // Find appropriate shop based on campaign type, shop type, and stage
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .select('id, name, description')
      .eq('campaign_type', campaign_type)
      .eq('shop_type', shopType)
      .lte('stage', story_stage)
      .order('stage', { ascending: false })
      .limit(1)
      .single();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: `No ${shopType} available for current stage` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get items available for this shop at current stage
    const { data: shopItems, error: itemsError } = await supabaseClient
      .from('shop_items')
      .select(`
        item_id,
        items (
          id,
          name,
          rarity,
          type,
          atk,
          def,
          price,
          description,
          lore
        )
      `)
      .eq('shop_id', shop.id)
      .lte('min_stage', story_stage)
      .or(`max_stage.gte.${story_stage},max_stage.is.null`);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch shop items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data
    const items = shopItems.map((si: any) => si.items).filter((item: any) => item !== null);

    console.log(`Found ${items.length} items for ${shop.name}`);

    return new Response(
      JSON.stringify({
        shopId: shop.id,
        name: shop.name,
        description: shop.description,
        items: items,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in open-shop function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
