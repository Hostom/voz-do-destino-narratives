import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MASTER_PROMPT = `Você é "Voz do Destino", um AI Game Master avançado projetado para narrar aventuras de RPG cinematográficas com voz, emoção e improvisação natural.
Sua missão é criar, mestrar e conduzir histórias interativas, reagindo às escolhas do jogador com lógica, criatividade e profundidade narrativa.

🎭 ESTILO DE NARRAÇÃO
• Cinematográfico, emocional e descritivo, como um narrador profissional
• Linguagem viva, com ritmo fluido e cenas ricas em detalhes sensoriais
• Alterna entre mistério, tensão, humor e drama conforme o momento
• Evite longos blocos narrativos; mantenha o jogador ativo
• Honre as escolhas do jogador; nunca as sobreponha
• NUNCA use asteriscos, negrito ou formatação markdown no texto - apenas texto puro e fluido
• Não destaque palavras com **negrito** ou __itálico__ - escreva naturalmente

⚡ FUNÇÕES PRINCIPAIS
• Criar mundos (ou utilizar o solicitado), mantendo coerência e física interna
• Narrar cenas com profundidade visual, sonora e emocional
• Interpretar NPCs com personalidades, vozes e intenções distintas
• Criar desafios: Combate, Enigmas, Exploração, Interações sociais, Tensão psicológica
• Gerenciar consequências e evolução dos eventos
• Improvisar com lógica interna, nunca quebrando a consistência do mundo

🎲 MECÂNICAS DO JOGO
• Quando uma ação exigir teste, APENAS SOLICITE o teste apropriado (ex: "Faça um teste de Atletismo CD 15")
• NUNCA role os dados pelo jogador - eles usarão o painel de testes para rolar
• Após o jogador rolar, você receberá o resultado e narrará as consequências
• Aplique vantagens/desvantagens quando a situação justificar
• O jogador sempre tem liberdade para ações criativas
• Não force regras — priorize fluidez narrativa

🧭 ESTRUTURA DE CONDUÇÃO
• Abertura / Gatilho inicial: introdução da ambientação e do conflito
• Complicação: apresentação de desafios, mistérios ou tensões
• Escolhas: ofereça 3–4 caminhos possíveis sem limitar ações livres
• Consequências: reação narrativa proporcional às escolhas
• Ganchos: novas direções para manter a história viva

🧠 INTELIGÊNCIA DO MESTRE
• Raciocínio contextual: lembre eventos anteriores
• Emoção equilibrada: intensidade sem exagero
• Improviso criativo, porém sempre coerente com o mundo
• Profundidade psicológica nos NPCs: desejos, conflitos, segredos
• Surpresas planejadas, não aleatórias

⚔️ DETECÇÃO DE COMBATE
• Quando houver um confronto, batalha, ou situação de combate, você DEVE incluir o marcador [INICIAR_COMBATE] no INÍCIO da sua resposta
• Após o marcador, continue narrando a cena de combate normalmente
• O sistema automaticamente ativará o modo de combate com iniciativa
• Exemplos de situações que requerem combate:
  - Encontro com inimigos hostis
  - Emboscada ou ataque surpresa
  - Duelo ou confronto direto
  - Monstros atacando
• Formato: "[INICIAR_COMBATE]\n\nOs orcs rugem e avançam em sua direção! Três guerreiros brutais empunham..."

💬 INTERAÇÃO COM O JOGADOR
• Nunca avance sem a ação do jogador
• Sempre encerre com uma pergunta narrativa que impulsiona a história
• Incentive decisões ousadas, criativas e inesperadas
• Respeite totalmente o protagonismo do jogador

🔒 ISOLAMENTO DE FICHAS EM MULTIPLAYER (CRÍTICO)
• Cada jogador possui uma ficha ÚNICA identificada por um Player ID
• NUNCA misture atributos, HP, habilidades ou equipamentos entre jogadores diferentes
• Quando receber fichas de múltiplos jogadores:
  - Identifique qual é o "JOGADOR ATIVO" (quem enviou a mensagem atual)
  - Use APENAS a ficha desse jogador ao responder perguntas pessoais como:
    * "Mostre meus atributos"
    * "Qual é minha vida?"
    * "Quem sou eu?"
    * "O que eu posso fazer?"
    * "Descreva meu personagem"
• Em cenas de grupo, use a ficha correta de cada jogador:
  - Se o Guerreiro ataca, use força/CA/HP/arma do GUERREIRO
  - Se o Mago lança magia, use INT/spell slots do MAGO
  - NUNCA confunda "ator" com "alvo" ou "observador"
• Cada ação deve ser baseada nos dados REAIS da ficha do personagem que executa a ação
• NUNCA invente, adivinhe ou improvise estatísticas
• Se não tiver certeza de qual ficha usar, pergunte ao jogador para esclarecer
• Mantenha dados consistentes: se um jogador tem 8 de Força, não narre feitos impossíveis para esse atributo

📋 SISTEMA DE IDENTIFICAÇÃO
• Você receberá um contexto com:
  - "JOGADOR ATIVO": o jogador que enviou a mensagem atual (identificado por nome e ID)
  - Lista completa de todos os jogadores na sala com suas fichas completas
  - Cada ficha contém: Player ID, Character ID, nome, raça, classe, atributos, HP, CA, armas, magias, condições
• Use o Player ID e Character ID para manter a integridade dos dados
• SEMPRE verifique qual jogador está agindo antes de consultar atributos

🎯 REGRAS DE NARRATIVA MULTIPLAYER
1. Quando UM jogador age sozinho → use APENAS sua ficha
2. Quando MÚLTIPLOS jogadores agem → use cada ficha apropriadamente
3. Ao descrever situações que afetam todos → mencione como cada um reage baseado em seus próprios atributos
4. Em combate → use iniciativa e atributos individuais de cada participante
5. Ao narrar consequências → considere as capacidades específicas de cada personagem

📌 OBJETIVO FINAL
Criar uma experiência de RPG profunda, épica, cinematográfica e inesquecível.
O jogador deve sentir que está vivendo um destino, não apenas ouvindo uma história.
Em sessões multiplayer, cada jogador deve sentir que SEU personagem é único e suas ações refletem SUA ficha individual.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages: clientMessages, roomId, characterName = 'Mestre do Jogo' } = await req.json();
    console.log("Received client messages:", clientMessages?.length || 0);
    console.log("Room ID:", roomId, "Character:", characterName);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build message history from gm_messages if roomId is provided
    // OPTIMIZATION: Limit context to last 30 messages to avoid token overflow
    // and maintain better performance while preserving recent context
    const MAX_CONTEXT_MESSAGES = 30;
    
    let messageHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: GAME_MASTER_PROMPT },
    ];

    // Get the character_id of the active player (who sent the current message)
    // This is critical for tool calling to update the correct character's stats
    let activeCharacterId: string | null = null;

    if (roomId) {
      console.log("Fetching conversation history for room:", roomId);
      
      // Get the last player message to identify who sent it
      const { data: lastPlayerMsg } = await supabase
        .from("gm_messages")
        .select("player_id")
        .eq("room_id", roomId)
        .eq("sender", "player")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (lastPlayerMsg?.player_id) {
        // Find the character_id for this player in this room
        const { data: roomPlayer } = await supabase
          .from("room_players")
          .select("character_id")
          .eq("room_id", roomId)
          .eq("user_id", lastPlayerMsg.player_id)
          .single();
        
        if (roomPlayer) {
          activeCharacterId = roomPlayer.character_id;
          console.log("Active character ID:", activeCharacterId);
        }
      }
      
      // Fetch ONLY the most recent messages to optimize token usage
      const { data: gmMessages, error: gmError } = await supabase
        .from("gm_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false }) // Get newest first
        .limit(MAX_CONTEXT_MESSAGES);

      if (!gmError && gmMessages && gmMessages.length > 0) {
        console.log(`Found ${gmMessages.length} messages, using last ${MAX_CONTEXT_MESSAGES} for context`);
        
        // Reverse to get chronological order (oldest to newest)
        const recentMessages = gmMessages.reverse();
        
        // Add context note if we're at the limit
        if (gmMessages.length >= MAX_CONTEXT_MESSAGES) {
          messageHistory.push({
            role: "system",
            content: `[CONTEXTO RECENTE: As últimas ${MAX_CONTEXT_MESSAGES} mensagens da sessão. Mantenha consistência com eventos e decisões recentes mencionadas nestas mensagens.]`
          });
        }
        
        // Convert gm_messages to chat format
        recentMessages.forEach((msg) => {
          if (msg.sender === "player") {
            messageHistory.push({
              role: "user",
              content: `[${msg.character_name}]: ${msg.content}`,
            });
          } else if (msg.sender === "GM") {
            messageHistory.push({
              role: "assistant",
              content: msg.content,
            });
          }
        });
        
        console.log("Context built with", messageHistory.length - 1, "messages (excluding system prompt)");
      }
    } else {
      // Fallback to client-provided messages if no roomId
      messageHistory.push(...(clientMessages || []));
    }

    console.log("Calling Lovable AI Gateway with", messageHistory.length, "messages...");
    
    // Define tool for structured extraction of game events
    const tools = [
      {
        type: "function",
            function: {
              name: "update_character_stats",
              description: "Atualiza HP, cura ou XP de um personagem baseado em eventos da narrativa. Use quando: o personagem tomar dano, ser curado, ganhar XP, descansar, etc.",
              parameters: {
                type: "object",
                properties: {
                  hp_change: {
                    type: "number",
                    description: "Mudança no HP (negativo para dano, positivo para cura). Ex: -5 para 5 de dano, +10 para 10 de cura"
                  },
                  xp_gain: {
                    type: "number",
                    description: "Quantidade de XP ganho (sempre positivo ou 0). Ex: 50 para derrotar inimigos, 25 para resolver puzzle"
                  },
                  reason: {
                    type: "string",
                    description: "Razão da mudança (ex: 'ataque de orc', 'descanso completo', 'derrotou bandidos')"
                  }
                },
                required: [],
                additionalProperties: false
              }
            }
      }
    ];
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messageHistory,
        tools: tools,
        tool_choice: "auto",
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    console.log("Streaming response from AI Gateway");
    
    // Collect the full response to save to database
    let fullResponse = "";
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("No response body");
    }

    // Create a custom stream that both passes through and collects the response
    let buffer = '';
    let toolCalls: any[] = [];
    let toolCallsById = new Map(); // Track tool calls by index and id
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Process any remaining buffer
              if (buffer.trim()) {
                const lines = buffer.split('\n').filter(l => l.trim());
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr && dataStr !== '[DONE]') {
                      try {
                        const data = JSON.parse(dataStr);
                        const content = data.choices?.[0]?.delta?.content;
                        if (content) {
                          fullResponse += content;
                        }
                        // Collect tool calls progressively
                        const delta = data.choices?.[0]?.delta;
                        if (delta?.tool_calls) {
                          for (const tc of delta.tool_calls) {
                            const key = `${tc.index || 0}_${tc.id || 'default'}`;
                            if (!toolCallsById.has(key)) {
                              toolCallsById.set(key, {
                                index: tc.index || 0,
                                id: tc.id || null,
                                type: tc.type || 'function',
                                function: {
                                  name: tc.function?.name || '',
                                  arguments: tc.function?.arguments || ''
                                }
                              });
                            } else {
                              // Append to existing tool call (streaming chunks)
                              const existing = toolCallsById.get(key);
                              if (tc.function?.name) {
                                existing.function.name += tc.function.name;
                              }
                              if (tc.function?.arguments) {
                                existing.function.arguments += tc.function.arguments;
                              }
                            }
                          }
                        }
                      } catch (e) {
                        console.error("Error parsing final buffer line:", e, "Line:", dataStr);
                      }
                    }
                  }
                }
              }
              
              // Convert map to array
              toolCalls = Array.from(toolCallsById.values());
              
              // Process tool calls BEFORE saving message
              if (toolCalls.length > 0 && activeCharacterId) {
                console.log("Processing tool calls:", toolCalls.length);
                for (const toolCall of toolCalls) {
                  if (toolCall.function?.name === "update_character_stats") {
                    try {
                      const args = JSON.parse(toolCall.function.arguments);
                      const { hp_change, xp_gain, reason } = args;
                      
                      console.log("Tool call args:", args);
                      console.log("Using active character ID:", activeCharacterId);

                      // Update HP if specified
                      if (hp_change !== undefined && hp_change !== 0) {
                        const { data: char } = await supabase
                          .from('characters')
                          .select('current_hp, max_hp, name')
                          .eq('id', activeCharacterId)
                          .single();

                        if (char) {
                          const newHP = Math.max(0, Math.min(char.max_hp, char.current_hp + hp_change));
                          await supabase
                            .from('characters')
                            .update({ current_hp: newHP })
                            .eq('id', activeCharacterId);

                          console.log(`✅ Updated ${char.name} HP: ${char.current_hp} -> ${newHP} (${hp_change > 0 ? '+' : ''}${hp_change}) - ${reason}`);
                        }
                      }

                      // Update XP if specified
                      if (xp_gain !== undefined && xp_gain > 0) {
                        const { data: char } = await supabase
                          .from('characters')
                          .select('experience_points, level, name')
                          .eq('id', activeCharacterId)
                          .single();

                        if (char) {
                          const newXP = (char.experience_points || 0) + xp_gain;
                          await supabase
                            .from('characters')
                            .update({ experience_points: newXP })
                            .eq('id', activeCharacterId);

                          console.log(`✅ Updated ${char.name} XP: +${xp_gain} (Total: ${newXP}) - ${reason}`);
                        }
                      }
                    } catch (toolError) {
                      console.error("❌ Error processing tool call:", toolError);
                    }
                  }
                }
              }
              
              // CRITICAL: ALWAYS save the complete GM response ONLY to gm_messages table
              // NEVER save to room_chat_messages or any other collection
              // This function MUST NEVER insert into room_chat_messages
              if (fullResponse && roomId) {
                console.log("Stream complete. Full response length:", fullResponse.length);
                console.log("Saving GM response to gm_messages ONLY...");
                console.log("⚠️ CRITICAL: This function will NEVER save to room_chat_messages");
                
                // Get the GM user id from the room
                const { data: room, error: roomError } = await supabase
                  .from('rooms')
                  .select('gm_id')
                  .eq('id', roomId)
                  .single();

                if (roomError) {
                  console.error("Error fetching room:", roomError);
                } else if (room) {
                  console.log("Room found. GM ID:", room.gm_id);
                  console.log("Attempting to insert GM response to gm_messages...");
                  console.log("Response length:", fullResponse.length);
                  console.log("Response preview (first 200 chars):", fullResponse.substring(0, 200));
                  
                  // CRITICAL: Insert ONLY into gm_messages - this is the single source of truth for GM narrations
                  // NEVER insert into room_chat_messages from this function
                  const { data: insertedData, error: insertError } = await supabase
                    .from("gm_messages")
                    .insert({
                      room_id: roomId,
                      player_id: room.gm_id,
                      sender: "GM",
                      character_name: "Voz do Destino",
                      content: fullResponse.trim(),
                      type: "gm",
                    })
                    .select();
                  
                  if (insertError) {
                    console.error("❌ Error saving GM message to gm_messages:", insertError);
                    console.error("Error details:", JSON.stringify(insertError, null, 2));
                    console.error("Attempted insert data:", {
                      room_id: roomId,
                      player_id: room.gm_id,
                      sender: "GM",
                      character_name: "Voz do Destino",
                      content_length: fullResponse.trim().length,
                      type: "gm",
                    });
                    // CRITICAL: Do NOT fallback to room_chat_messages - fail instead
                    console.error("⚠️ CRITICAL: Will NOT save to room_chat_messages as fallback");
                  } else {
                    console.log("✅ GM response saved to gm_messages successfully. ID:", insertedData?.[0]?.id);
                    console.log("Inserted data:", JSON.stringify(insertedData?.[0], null, 2));
                    console.log("Response preview:", fullResponse.substring(0, 100) + "...");
                    console.log("✅ Confirmed: Message saved ONLY to gm_messages, NOT to room_chat_messages");
                  }
                } else {
                  console.error("Room not found for roomId:", roomId);
                }
              } else {
                if (!fullResponse) {
                  console.warn("No fullResponse to save. Buffer was:", buffer);
                }
                if (!roomId) {
                  console.warn("No roomId provided");
                }
              }
              controller.close();
              break;
            }
            
            // Decode and collect the response
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                const dataStr = trimmedLine.slice(6).trim();
                if (dataStr && dataStr !== '[DONE]') {
                  try {
                    const data = JSON.parse(dataStr);
                    const content = data.choices?.[0]?.delta?.content;
                    if (content) {
                      fullResponse += content;
                    }
                    // Collect tool calls progressively
                    const delta = data.choices?.[0]?.delta;
                    if (delta?.tool_calls) {
                      for (const tc of delta.tool_calls) {
                        const key = `${tc.index || 0}_${tc.id || 'default'}`;
                        if (!toolCallsById.has(key)) {
                          toolCallsById.set(key, {
                            index: tc.index || 0,
                            id: tc.id || null,
                            type: tc.type || 'function',
                            function: {
                              name: tc.function?.name || '',
                              arguments: tc.function?.arguments || ''
                            }
                          });
                        } else {
                          // Append to existing tool call (streaming chunks)
                          const existing = toolCallsById.get(key);
                          if (tc.function?.name) {
                            existing.function.name += tc.function.name;
                          }
                          if (tc.function?.arguments) {
                            existing.function.arguments += tc.function.arguments;
                          }
                        }
                      }
                    }
                  } catch (e) {
                    console.error("Error parsing SSE line:", e, "Line:", dataStr);
                  }
                }
              }
            }
            
            // Pass through the chunk
            controller.enqueue(value);
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in game-master function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
