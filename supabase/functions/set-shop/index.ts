import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopItem {
  id: string;
  name: string;
  basePrice: number;
  finalPrice: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  quality: "broken" | "normal" | "refined" | "perfect" | "legendary";
  category?: string;
  description?: string;
  stock?: number;
  attributes?: {
    attack?: number;
    defense?: number;
    magic?: number;
    hp?: number;
    custom?: string;
  };
}

interface SetShopRequest {
  roomId: string;
  npcName: string;
  npcDescription: string;
  npcPersonality?: "friendly" | "neutral" | "hostile";
  npcReputation?: number;
  items: ShopItem[];
}

serve(async (req) => {
  // Handle CORS preflight
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SetShopRequest = await req.json();
    const { roomId, npcName, npcDescription, npcPersonality, npcReputation, items } = body;

    if (!roomId || !items) {
      return new Response(
        JSON.stringify({ error: 'roomId and items are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Setting shop for room ${roomId} with ${items.length} items`);

    // Verify user is GM of this room
    const { data: room, error: roomError } = await supabaseClient
      .from('rooms')
      .select('gm_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      console.error('Room error:', roomError);
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (room.gm_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Only the GM can set the shop' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert shop state
    const shopData = {
      room_id: roomId,
      npc_name: npcName || 'Mercador',
      npc_personality: npcPersonality || 'neutral',
      npc_reputation: npcReputation || 0,
      items: items,
      updated_at: new Date().toISOString(),
    };

    const { data: shopState, error: upsertError } = await supabaseClient
      .from('shop_states')
      .upsert(shopData, { onConflict: 'room_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to update shop', details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shop updated successfully:', shopState);

    // Broadcast realtime update
    const channel = supabaseClient.channel(`shop:${roomId}`);
    await channel.send({
      type: 'broadcast',
      event: 'SHOP_UPDATE',
      payload: shopState,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        shop: shopState,
        message: `Shop updated with ${items.length} items`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in set-shop function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
