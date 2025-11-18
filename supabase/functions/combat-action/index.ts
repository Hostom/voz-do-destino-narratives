import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { actionType, roomId, actorId, targetId, spellLevel, weaponOverride } = await req.json();

    console.log("Combat action:", { actionType, roomId, actorId, targetId });

    // Get room and validate
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      throw new Error("Room not found");
    }

    const { data: actor, error: actorError } = await supabase
      .from("room_players")
      .select(`
        *,
        characters (
          id, name, class, level,
          strength, dexterity, constitution, intelligence, wisdom, charisma,
          proficiency_bonus, equipped_weapon, spell_slots, current_spell_slots,
          saving_throws, current_hp, max_hp
        )
      `)
      .eq("id", actorId)
      .single();

    if (actorError || !actor) {
      throw new Error("Actor not found");
    }

    const character = actor.characters as any;
    
    // Calculate round number
    const playersCount = await supabase
      .from("room_players")
      .select("id")
      .eq("room_id", roomId);
    const totalPlayers = playersCount.data?.length || 1;
    const roundNumber = Math.floor(room.current_turn / totalPlayers) + 1;

    let logEntry: any = {
      room_id: roomId,
      round_number: roundNumber,
      character_name: character.name,
      action_type: actionType,
    };

    // ATTACK ACTION
    if (actionType === "attack") {
      if (!targetId) throw new Error("Target required for attack");

      // Get target
      const { data: target, error: targetError } = await supabase
        .from("room_players")
        .select(`
          *,
          characters (id, name, armor_class, current_hp, max_hp)
        `)
        .eq("id", targetId)
        .single();

      if (targetError || !target) {
        throw new Error("Target not found");
      }

      // Determine weapon
      const weapon = weaponOverride || character.equipped_weapon || {
        name: "Ataque Desarmado",
        damage_dice: "1d4",
        damage_type: "contundente",
        ability: "strength"
      };

      // Check conditions for advantage/disadvantage
      const actorConditions = (actor.conditions as any[]) || [];
      const targetConditions = (target.conditions as any[]) || [];
      
      let hasAdvantage = false;
      let hasDisadvantage = false;

      // Actor conditions affecting attacks
      if (actorConditions.some(c => c.id === "poisoned")) hasDisadvantage = true;
      if (actorConditions.some(c => c.id === "frightened")) hasDisadvantage = true;
      if (actorConditions.some(c => c.id === "invisible")) hasAdvantage = true;

      // Target conditions affecting attacks
      if (targetConditions.some(c => c.id === "prone")) hasAdvantage = true; // for melee
      if (targetConditions.some(c => c.id === "paralyzed")) hasAdvantage = true;
      if (targetConditions.some(c => c.id === "stunned")) hasAdvantage = true;
      if (targetConditions.some(c => c.id === "unconscious")) hasAdvantage = true;
      if (targetConditions.some(c => c.id === "invisible")) hasDisadvantage = true;
      if (targetConditions.some(c => c.id === "restrained")) hasAdvantage = true;

      // Calculate attack roll with advantage/disadvantage
      const abilityScore = character[weapon.ability] || character.strength;
      const abilityMod = Math.floor((abilityScore - 10) / 2);
      
      let attackRoll: number;
      if (hasAdvantage && !hasDisadvantage) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        attackRoll = Math.max(roll1, roll2);
        logEntry.description = `[Vantagem: rolou ${roll1} e ${roll2}] `;
      } else if (hasDisadvantage && !hasAdvantage) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        attackRoll = Math.min(roll1, roll2);
        logEntry.description = `[Desvantagem: rolou ${roll1} e ${roll2}] `;
      } else {
        attackRoll = Math.floor(Math.random() * 20) + 1;
        logEntry.description = "";
      }
      
      const attackTotal = attackRoll + abilityMod + character.proficiency_bonus;

      logEntry.target_name = target.characters.name;
      logEntry.roll_result = attackRoll;

      // Check if hit
      if (attackRoll === 1) {
        // Critical miss
        logEntry.description += `${character.name} atacou ${target.characters.name} com ${weapon.name} e teve uma FALHA CRÍTICA! (rolou 1)`;
        logEntry.damage = 0;
      } else if (attackRoll === 20 || attackTotal >= target.characters.armor_class) {
        // Hit or critical hit
        const isCritical = attackRoll === 20;
        
        // Roll damage
        const [diceCount, diceSize] = weapon.damage_dice.split("d").map(Number);
        let totalDamage = 0;
        
        const rolls = isCritical ? diceCount * 2 : diceCount;
        for (let i = 0; i < rolls; i++) {
          totalDamage += Math.floor(Math.random() * diceSize) + 1;
        }
        totalDamage += abilityMod;

        // Apply damage
        const newHp = Math.max(0, target.characters.current_hp - totalDamage);
        await supabase
          .from("characters")
          .update({ current_hp: newHp })
          .eq("id", target.characters.id);

        logEntry.damage = totalDamage;
        logEntry.description += isCritical
          ? `${character.name} acertou um ACERTO CRÍTICO em ${target.characters.name}! Rolou ${attackRoll} no ataque. Causou ${totalDamage} de dano ${weapon.damage_type}! (HP: ${target.characters.current_hp} → ${newHp})`
          : `${character.name} acertou ${target.characters.name} com ${weapon.name}! Rolou ${attackRoll} + ${abilityMod + character.proficiency_bonus} = ${attackTotal} vs AC ${target.characters.armor_class}. Causou ${totalDamage} de dano ${weapon.damage_type}! (HP: ${target.characters.current_hp} → ${newHp})`;
      } else {
        // Miss
        logEntry.description += `${character.name} atacou ${target.characters.name} com ${weapon.name} e ERROU! Rolou ${attackRoll} + ${abilityMod + character.proficiency_bonus} = ${attackTotal} vs AC ${target.characters.armor_class}`;
        logEntry.damage = 0;
      }
    }

    // CAST SPELL ACTION
    else if (actionType === "cast_spell") {
      if (!targetId) throw new Error("Target required for spell");
      if (!spellLevel) throw new Error("Spell level required");

      // Verify spell slots
      const currentSlots = character.current_spell_slots?.[spellLevel] || 0;
      if (currentSlots <= 0) {
        throw new Error("No spell slots available");
      }

      // Get target
      const { data: target, error: targetError } = await supabase
        .from("room_players")
        .select(`
          *,
          characters (id, name, dexterity, current_hp, max_hp)
        `)
        .eq("id", targetId)
        .single();

      if (targetError || !target) {
        throw new Error("Target not found");
      }

      // Simple spell damage calculation (can be expanded)
      const spellDamageDice = spellLevel + 1;
      let totalDamage = 0;
      for (let i = 0; i < spellDamageDice; i++) {
        totalDamage += Math.floor(Math.random() * 6) + 1;
      }

      // Saving throw
      const spellAbility = ["wizard", "sorcerer", "warlock"].includes(character.class) ? "intelligence" :
                           ["cleric", "druid", "ranger"].includes(character.class) ? "wisdom" : "charisma";
      const spellSaveDC = 8 + character.proficiency_bonus + Math.floor((character[spellAbility] - 10) / 2);
      
      const savingThrow = Math.floor(Math.random() * 20) + 1;
      const dexMod = Math.floor((target.characters.dexterity - 10) / 2);
      const saveTotal = savingThrow + dexMod;

      const saved = saveTotal >= spellSaveDC;
      if (saved) {
        totalDamage = Math.floor(totalDamage / 2);
      }

      // Apply damage
      const newHp = Math.max(0, target.characters.current_hp - totalDamage);
      await supabase
        .from("characters")
        .update({ current_hp: newHp })
        .eq("id", target.characters.id);

      // Consume spell slot
      const newSlots = { ...character.current_spell_slots };
      newSlots[spellLevel] = currentSlots - 1;
      await supabase
        .from("characters")
        .update({ current_spell_slots: newSlots })
        .eq("id", character.id);

      logEntry.target_name = target.characters.name;
      logEntry.roll_result = savingThrow;
      logEntry.damage = totalDamage;
      logEntry.description = saved
        ? `${character.name} lançou uma magia de nível ${spellLevel} em ${target.characters.name}! ${target.characters.name} passou no teste de resistência (${saveTotal} vs DC ${spellSaveDC}) e recebeu metade do dano: ${totalDamage}! (HP: ${target.characters.current_hp} → ${newHp})`
        : `${character.name} lançou uma magia de nível ${spellLevel} em ${target.characters.name}! ${target.characters.name} falhou no teste de resistência (${saveTotal} vs DC ${spellSaveDC}) e recebeu ${totalDamage} de dano! (HP: ${target.characters.current_hp} → ${newHp})`;
    }

    // DODGE ACTION
    else if (actionType === "dodge") {
      logEntry.description = `${character.name} assume uma postura defensiva, esquivando-se de ataques!`;
      logEntry.damage = 0;
    }

    // DISENGAGE ACTION
    else if (actionType === "disengage") {
      logEntry.description = `${character.name} se desengaja do combate corpo a corpo com cuidado!`;
      logEntry.damage = 0;
    }

    // DASH ACTION
    else if (actionType === "dash") {
      logEntry.description = `${character.name} corre rapidamente, dobrando seu movimento!`;
      logEntry.damage = 0;
    }

    // HELP ACTION
    else if (actionType === "help") {
      if (!targetId) throw new Error("Target required for help");
      
      const { data: target } = await supabase
        .from("room_players")
        .select("characters(name)")
        .eq("id", targetId)
        .single();

      const targetCharacter = target?.characters as any;
      logEntry.target_name = targetCharacter?.name || "Aliado";
      logEntry.description = `${character.name} ajuda ${logEntry.target_name}, concedendo vantagem na próxima ação!`;
      logEntry.damage = 0;
    }

    // Save log entry
    const { error: logError } = await supabase
      .from("combat_log")
      .insert(logEntry);

    if (logError) {
      console.error("Error saving log:", logError);
    }

    // Get AI narration from game master
    let narrativeMessage = '';
    try {
      const narrativePrompt = `Narre brevemente esta ação de combate de D&D 5e de forma cinematográfica (máximo 2-3 frases):

Personagem: ${logEntry.character_name}
Ação: ${actionType}
${logEntry.target_name ? `Alvo: ${logEntry.target_name}` : ''}
${logEntry.roll_result ? `Rolagem: ${logEntry.roll_result}` : ''}
${logEntry.damage ? `Dano: ${logEntry.damage}` : ''}
Resultado: ${logEntry.description}

Seja dramático, descritivo e épico. Não use asteriscos ou formatação, apenas texto puro e fluido.`;

      const gmResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/game-master`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: narrativePrompt }
          ]
        })
      });

      if (gmResponse.ok) {
        const reader = gmResponse.body?.getReader();
        const decoder = new TextDecoder();
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    narrativeMessage += content;
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting narrative:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        log: logEntry,
        narrative: narrativeMessage || null,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in combat-action:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
