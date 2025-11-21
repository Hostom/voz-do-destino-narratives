import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ShopItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  finalPrice: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  quality: "broken" | "normal" | "refined" | "perfect" | "legendary";
  stock: number;
  attributes: Record<string, any>;
}

interface ShopUpdateRequest {
  roomId: string;
  npcName: string;
  npcPersonality: "friendly" | "neutral" | "hostile";
  npcReputation: number;
  items: ShopItem[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Check if this is a service role call (from game-master function)
    const isServiceRole = token === serviceRoleKey;
    
    let userId: string | null = null;
    
    if (!isServiceRole) {
      // Validate user token
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      userId = user.id;
    }

    const body: ShopUpdateRequest = await req.json();
    const { roomId, npcName, npcPersonality, npcReputation, items } = body;

    if (!roomId || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: "Invalid request: roomId and items array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has access to this room (GM or player) - skip for service role
    if (!isServiceRole && userId) {
      const { data: room, error: roomError } = await supabaseClient
        .from("rooms")
        .select("gm_id")
        .eq("id", roomId)
        .single();

      if (roomError || !room) {
        return new Response(
          JSON.stringify({ error: "Room not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isGM = room.gm_id === userId;
      const isPlayer = await supabaseClient
        .from("room_players")
        .select("id")
        .eq("room_id", roomId)
        .eq("user_id", userId)
        .single()
        .then(({ data }) => !!data);

      if (!isGM && !isPlayer) {
        return new Response(
          JSON.stringify({ error: "Access denied" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Upsert shop state
    const { data: shopState, error: upsertError } = await supabaseClient
      .from("shop_states")
      .upsert(
        {
          room_id: roomId,
          npc_name: npcName || "Mercador",
          npc_personality: npcPersonality || "neutral",
          npc_reputation: npcReputation || 0,
          items: items,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "room_id",
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting shop state:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to update shop state", details: upsertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Broadcast realtime event
    const channel = supabaseClient.channel(`room-shop:${roomId}`);
    await channel.send({
      type: "broadcast",
      event: "SHOP_UPDATE",
      payload: {
        roomId,
        npcName: npcName || "Mercador",
        npcPersonality: npcPersonality || "neutral",
        npcReputation: npcReputation || 0,
        items,
        updatedAt: shopState.updated_at,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        shopState,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in update-shop function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

