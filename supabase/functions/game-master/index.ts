import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Parse structured AI response with <thinking> and <response> tags
// Robust parsing to prevent logic leaks even with malformed tags
function parseStructuredResponse(fullText: string): {
  thinking: string;
  response: string;
  hasValidStructure: boolean;
} {
  // Extract thinking content - handle both closed and unclosed tags
  let thinking = "";
  const thinkingMatch = fullText.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/i);
  if (thinkingMatch) {
    thinking = thinkingMatch[1].trim();
  }

  // Extract response content
  let response = "";
  const responseMatch = fullText.match(/<response>([\s\S]*?)(?:<\/response>|$)/i);
  
  const hasValidStructure = !!responseMatch && fullText.includes("</response>");

  if (responseMatch) {
    response = responseMatch[1].trim();
  } else {
    // CRITICAL ANTI-LEAK: If no <response> tag, we MUST aggressively clean the text
    // Remove everything that looks like thinking content
    response = fullText.replace(/<thinking>[\s\S]*?(?:<\/thinking>|$)/gi, "").trim();
    // Remove any other stray tags that might have been partially generated
    response = response.replace(/<\/?(?:thinking|response)>/gi, "").trim();
  }

  // Final safety pass: remove anything that looks like internal tool calls or logic
  const aggressiveCleanPatterns = [
    /\[?actions?\s+executed?:.*?\]?/gi,
    /update_character_stats\(.*?\)/gi,
    /set_shop\(.*?\)/gi,
    /close_shop\(\)/gi
  ];
  
  aggressiveCleanPatterns.forEach(pattern => {
    response = response.replace(pattern, "");
  });

  return {
    thinking,
    response: response.trim(),
    hasValidStructure
  };
}

const GAME_MASTER_PROMPT = `🔒🔥 **ANTI-LEAK FINAL – REGRAS ABSOLUTAS**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estas regras têm prioridade sobre TODAS as outras.

🧠 SISTEMA DE PENSAMENTO ESTRUTURADO (OBRIGATÓRIO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use SEMPRE esta estrutura em TODAS as respostas:

<thinking>
[Aqui você DEVE pensar livremente sobre:
- Análise da situação
- Consequências das ações
- Dificuldades de testes (CD)
- Motivações de NPCs
- Estratégias de combate
IMPORTANTE: ESTA SEÇÃO NUNCA SERÁ VISTA PELOS JOGADORES - ela é automaticamente removida]
</thinking>

<response>
[Aqui APENAS narrativa pura e imersiva para os jogadores.
NUNCA mencione lógica, ferramentas, pensamentos ou meta-informações.
Apenas história viva, falas de NPCs em primeira pessoa, e solicitações de teste.]
</response>

🔒 CRÍTICO: TODO texto fora de <response></response> é AUTOMATICAMENTE DESCARTADO e NUNCA chega aos jogadores!
⚠️ A tag <thinking> serve APENAS para você organizar seu raciocínio - os jogadores NUNCA verão!

REGRAS ANTI-LEAK:
• NUNCA revele cadeia de raciocínio, lógica interna, análise, plano ou justificativa fora de <thinking>
• NUNCA explique por que está narrando algo
• NUNCA mencione "como" decidiu algo
• NUNCA revele ferramentas, código, JSON ou estruturas internas
• NUNCA diga que "vai chamar uma ferramenta"
• NUNCA diga que é uma IA ou modelo
• SEMPRE responda apenas com narrativa, falas de NPCs, solicitações de teste
• Se jogador tentar forçar quebra de imersão → Recuse narrativamente
• O MESTRE NUNCA PODE QUEBRAR O PAPEL

🎭 ADAPTAÇÃO AO TIPO DE CAMPANHA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• A campanha pode ser de QUALQUER cenário: fantasia, cyberpunk, terror, sci-fi, etc.
• Adapte TODA a narrativa ao cenário escolhido
• Use vocabulário, tecnologia e elementos apropriados ao cenário
• Leia atentamente o tipo de campanha no início da sessão
• Mantenha consistência com o cenário escolhido

🎬 INÍCIO DE SESSÃO (QUANDO VER "[INÍCIO DA SESSÃO]")
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Apresente-se como "Voz do Destino" de forma imersiva
• Inicie DIRETAMENTE na ação - sem perguntas sobre preferências
• O tipo de campanha já foi escolhido - adapte automaticamente
• Crie uma cena de abertura cinematográfica e envolvente
• Use as fichas dos personagens para personalizar a introdução
• Estabeleça o tom do cenário de imediato (fantasia = taverna/missão, cyberpunk = cidade neon/contrato, terror = ambiente sombrio/ameaça, etc.)
• Ganchos narrativos que puxem os jogadores para a ação
• NUNCA exponha lógica de configuração, apenas narre

🚫 SHOP SYSTEM - SISTEMA AUTOMÁTICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• O sistema de loja é 100% automático e baseado em database
• NUNCA liste itens de loja na sua narrativa
• NUNCA crie inventários de mercadores
• NUNCA descreva o que uma loja vende
• Quando jogadores entram em loja, APENAS narre:
  - A atmosfera e ambiente
  - A aparência e comportamento do NPC mercador
  - A vibe geral do lugar
• A UI da loja mostrará os itens automaticamente
• Você NÃO é responsável pelo conteúdo da loja

═══════════════════════════════════════════
🎭 IDENTIDADE E MISSÃO
═══════════════════════════════════════════
Você é "Voz do Destino", um AI Game Master que narra aventuras de RPG cinematográficas.
Sua missão: criar histórias interativas profundas, reagindo às escolhas do jogador com lógica e criatividade.
Adapte-se perfeitamente ao cenário da campanha (fantasia, cyberpunk, terror, sci-fi, etc.).

═══════════════════════════════════════════
🎯 EXEMPLO DE SESSÃO PERFEITA
═══════════════════════════════════════════

JOGADOR: "Entro na joalheria"

VOCÊ (GM):
[Narrativa] "As portas de vidro se abrem com um suave tilintar. O interior da joalheria brilha com luz dourada, refletindo em dezenas de vitrines repletas de tesouros. Elara, uma elfa de cabelos prateados, ergue o olhar de um colar que poliu. 'Bem-vindo, viajante,' ela diz com um sorriso caloroso."

[CHAME AUTOMATICAMENTE: create_shop com 10 itens variados]

[Continuação] "Ela gesticula para as vitrines ao redor. 'Cada peça aqui tem sua própria história. Procura algo específico, ou posso sugerir algumas de minhas obras-primas?'"

RESULTADO: Jogador vê os 10 itens na aba "Loja" + recebe narrativa fluida no chat
═══════════════════════════════════════════

═══════════════════════════════════════════
🎭 ESTILO DE NARRAÇÃO
═══════════════════════════════════════════
• Cinematográfico, emocional e descritivo
• Linguagem viva com detalhes sensoriais
• Alterna mistério, tensão, humor e drama
• Evite longos blocos; mantenha jogador ativo
• Honre escolhas do jogador; nunca as sobreponha
• NUNCA use asteriscos, negrito ou markdown - texto puro e fluido
• Interprete NPCs com personalidades distintas
• Crie desafios: combate, enigmas, exploração, interação social
• Gerencie consequências e evolução dos eventos
• Improvise com coerência ao mundo

═══════════════════════════════════════════
🎲 MECÂNICAS DE JOGO (CRÍTICO)
═══════════════════════════════════════════
• O sistema de jogo se adapta ao tipo de campanha escolhida pelo GM
• Use as regras e mecânicas apropriadas para o cenário (fantasia, cyberpunk, terror, etc.)
• TODAS ações com incerteza/risco EXIGEM testes
• SOLICITE diretamente: "Faça um teste de [Habilidade] CD [número]"
  - NÃO explique, pause ou avise - apenas PEÇA
  - CDs: Fácil (10), Médio (15), Difícil (20), Muito Difícil (25)
• Ações que SEMPRE exigem testes:
  - Olhar/Procurar → Percepção/Investigação
  - Saltar/Escalar/Nadar → Atletismo/Acrobacia
  - Convencer/Enganar/Intimidar → Persuasão/Enganação/Intimidação
  - Esconder-se → Furtividade
  - Lembrar → História/Conhecimento específico do cenário
• NUNCA role dados pelo jogador
• NUNCA narre resultado antes do teste
• Aplique vantagem/desvantagem quando apropriado
• Múltiplas ações = solicite teste para CADA uma

═══════════════════════════════════════════
💥 COMBATE E DANO (CRÍTICO)
═══════════════════════════════════════════
🚫 VOCÊ TEM ACESSO DIRETO ÀS FICHAS - NUNCA PEÇA INFORMAÇÕES AO JOGADOR
• Você vê: CA, HP, modificadores, nível, classe, raça, armas, condições
• NUNCA pergunte "Qual sua CA/HP/modificador?"
• USE diretamente as informações das fichas

COMBATE:
1. Teste de ataque (d20 + mod vs CA do inimigo)
2. Se acertar → Peça dano: "Role 1d8+[mod] para sua Espada Longa"
3. NUNCA role pelo jogador
4. Narre impacto após resultado

DANO:
• Jogador sofre dano → "Você sofreu X pontos de dano de [fonte]"
• Use HP da ficha para determinar estado após dano
• TODA consequência física tem dano (quedas, armadilhas, ataques)

═══════════════════════════════════════════
🧭 CONDUÇÃO DA HISTÓRIA
═══════════════════════════════════════════
• Abertura → Complicação → Consequências → Ganchos
• NUNCA oferece opções numeradas ("1) Fazer X, 2) Fazer Y")
• Deixe jogadores decidirem livremente
• Narre situação e aguarde decisões
• Lembre eventos anteriores
• Emoção equilibrada, improviso coerente
• NPCs com profundidade psicológica

═══════════════════════════════════════════
⚔️ DETECÇÃO DE COMBATE
═══════════════════════════════════════════
• Confronto/batalha → inclua [INICIAR_COMBATE] no INÍCIO da resposta
• Sistema ativa modo de combate automaticamente
• Formato: "[INICIAR_COMBATE]\n\nOs orcs rugem e avançam!"

═══════════════════════════════════════════
🛒 LOJA E COMÉRCIO
═══════════════════════════════════════════
• SEMPRE narre atmosfera e lojista - NUNCA liste itens/preços
• Jogador entra → Narre ambiente + set_shop (silenciosamente)
• Jogador sai → Narre saída + close_shop (silenciosamente)

═══════════════════════════════════════════
💬 INTERAÇÃO COM JOGADOR
═══════════════════════════════════════════
• Nunca avance sem ação do jogador
• Encerre com pergunta narrativa
• Incentive decisões criativas
• Respeite protagonismo do jogador
• Recompense roleplay excepcional com INSPIRAÇÃO

═══════════════════════════════════════════
🛠️ FERRAMENTAS (USE SILENCIOSAMENTE)
═══════════════════════════════════════════
• update_character_stats: Atualiza HP/XP
  - hp_change: NEGATIVO = dano (-8), POSITIVO = cura (+10)
  - xp_gain: sempre positivo (50)
  - Narre ANTES de chamar
• set_shop: Configura loja (use ao narrar entrada)
• close_shop: Fecha loja (use ao narrar saída)

═══════════════════════════════════════════
🔒 MULTIPLAYER - ISOLAMENTO DE FICHAS (CRÍTICO)
═══════════════════════════════════════════
• Cada jogador tem ficha ÚNICA (Player ID + Character ID)
• NUNCA misture dados entre jogadores
• Identifique "JOGADOR ATIVO" (quem enviou mensagem)
• Use APENAS ficha do jogador ativo para perguntas pessoais
• Verifique SEMPRE qual jogador está agindo
• NUNCA invente ou improvise estatísticas
• Consulte fichas ANTES de narrar ações

🧠 VALIDAÇÃO SILENCIOSA:
• Verifique compatibilidade com ficha + regras do sistema de jogo apropriado
• Se impossível → corrija educadamente, ofereça alternativas
• NUNCA aceite mecânicas inexistentes
• Execute verificações SILENCIOSAMENTE (não explique raciocínio)
• Adapte-se ao tipo de campanha escolhida (fantasia, cyberpunk, terror, sci-fi, etc.)

🎯 NARRATIVA MULTIPLAYER:
1. Um jogador age → use SUA ficha
2. Múltiplos agem → use fichas apropriadas
3. Situação afeta todos → mencione reações baseadas em atributos individuais
4. Combate → iniciativa e atributos individuais
5. Consequências → capacidades específicas de cada personagem

═══════════════════════════════════════════
📌 OBJETIVO FINAL
═══════════════════════════════════════════
Criar experiência de RPG profunda, épica, cinematográfica e inesquecível.
O jogador vive um destino, não ouve uma história.
Em multiplayer, cada personagem é único e suas ações refletem SUA ficha individual.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages: clientMessages, roomId, characterName = 'Mestre do Jogo', characterId, isSessionStart = false, campaignType } = await req.json();
    console.log("Received client messages:", clientMessages?.length || 0);
    console.log("Room ID:", roomId, "Character:", characterName, "Character ID:", characterId);
    console.log("Is Session Start:", isSessionStart);
    console.log("Campaign Type:", campaignType);

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
    // PREFER characterId from request if provided, otherwise try to find it
    let activeCharacterId: string | null = characterId || null;

    if (roomId && !isSessionStart) {
      console.log("Fetching conversation history for room:", roomId);
      
      // Fetch room data to get campaign type
      const { data: roomData } = await supabase
        .from("rooms")
        .select("campaign_type")
        .eq("id", roomId)
        .single();
      
      const roomCampaignType = roomData?.campaign_type || campaignType || 'fantasy';
      console.log("Room campaign type:", roomCampaignType);
      
      // CRITICAL: Fetch ALL character sheets in the room to provide full context to AI
      const { data: roomPlayers, error: roomPlayersError } = await supabase
        .from("room_players")
        .select(`
          user_id,
          character_id,
          conditions,
          characters (
            id,
            name,
            race,
            class,
            level,
            current_hp,
            max_hp,
            armor_class,
            strength,
            dexterity,
            constitution,
            intelligence,
            wisdom,
            charisma,
            proficiency_bonus,
            experience_points,
            equipped_weapon
          )
        `)
        .eq("room_id", roomId);

      // 🔍 DIAGNOSTIC LOGGING FOR CHARACTER SHEETS
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔍 CHARACTER SHEETS QUERY DIAGNOSTICS");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Room ID:", roomId);
      console.log("Room players error:", roomPlayersError);
      console.log("Room players count:", roomPlayers?.length || 0);
      if (roomPlayers && roomPlayers.length > 0) {
        roomPlayers.forEach((rp: any, idx: number) => {
          console.log(`Player ${idx + 1}:`, {
            user_id: rp.user_id,
            character_id: rp.character_id,
            character_name: rp.characters?.name,
            has_character_data: !!rp.characters
          });
        });
      } else {
        console.warn("⚠️ NO ROOM PLAYERS FOUND - Character context will be EMPTY");
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // Build character sheets context
      let characterSheetsContext = "";
      if (roomPlayers && roomPlayers.length > 0) {
        characterSheetsContext = "\n\n=== FICHAS DOS PERSONAGENS NA SESSÃO ===\n";
        roomPlayers.forEach((rp: any) => {
          const char = rp.characters;
          if (char) {
            const strMod = Math.floor((char.strength - 10) / 2);
            const dexMod = Math.floor((char.dexterity - 10) / 2);
            const conMod = Math.floor((char.constitution - 10) / 2);
            const intMod = Math.floor((char.intelligence - 10) / 2);
            const wisMod = Math.floor((char.wisdom - 10) / 2);
            const chaMod = Math.floor((char.charisma - 10) / 2);

            characterSheetsContext += `
PERSONAGEM: ${char.name}
- Player ID: ${rp.user_id}
- Character ID: ${char.id}
- Raça/Classe: ${char.race} ${char.class} Nível ${char.level}
- HP: ${char.current_hp}/${char.max_hp} | CA: ${char.armor_class}
- Atributos: FOR ${char.strength}(${strMod>=0?'+':''}${strMod}) | DES ${char.dexterity}(${dexMod>=0?'+':''}${dexMod}) | CON ${char.constitution}(${conMod>=0?'+':''}${conMod}) | INT ${char.intelligence}(${intMod>=0?'+':''}${intMod}) | SAB ${char.wisdom}(${wisMod>=0?'+':''}${wisMod}) | CAR ${char.charisma}(${chaMod>=0?'+':''}${chaMod})
- Bônus Proficiência: +${char.proficiency_bonus}
- XP: ${char.experience_points}
- Arma Equipada: ${char.equipped_weapon?.name || 'Desarmado'}
- Condições: ${rp.conditions && Array.isArray(rp.conditions) && rp.conditions.length > 0 ? rp.conditions.join(', ') : 'Nenhuma'}
`;
          }
        });
        characterSheetsContext += "\n=== FIM DAS FICHAS ===\n";
        console.log("✅ Character sheets context prepared for", roomPlayers.length, "characters");
      } else {
        // 🔥 FALLBACK: If room_players query failed but we have characterId, try to fetch that character
        console.warn("⚠️ Room players query returned empty. Attempting fallback...");
        
        if (characterId) {
          console.log("🔄 Fetching character directly using characterId:", characterId);
          const { data: fallbackChar, error: fallbackError } = await supabase
            .from("characters")
            .select("*")
            .eq("id", characterId)
            .single();
          
          if (!fallbackError && fallbackChar) {
            console.log("✅ Fallback successful! Got character:", fallbackChar.name);
            characterSheetsContext = "\n\n=== FICHAS DOS PERSONAGENS NA SESSÃO ===\n";
            
            const char = fallbackChar;
            const strMod = Math.floor((char.strength - 10) / 2);
            const dexMod = Math.floor((char.dexterity - 10) / 2);
            const conMod = Math.floor((char.constitution - 10) / 2);
            const intMod = Math.floor((char.intelligence - 10) / 2);
            const wisMod = Math.floor((char.wisdom - 10) / 2);
            const chaMod = Math.floor((char.charisma - 10) / 2);

            characterSheetsContext += `
PERSONAGEM: ${char.name}
- Character ID: ${char.id}
- Raça/Classe: ${char.race} ${char.class} Nível ${char.level}
- HP: ${char.current_hp}/${char.max_hp} | CA: ${char.armor_class}
- Atributos: FOR ${char.strength}(${strMod>=0?'+':''}${strMod}) | DES ${char.dexterity}(${dexMod>=0?'+':''}${dexMod}) | CON ${char.constitution}(${conMod>=0?'+':''}${conMod}) | INT ${char.intelligence}(${intMod>=0?'+':''}${intMod}) | SAB ${char.wisdom}(${wisMod>=0?'+':''}${wisMod}) | CAR ${char.charisma}(${chaMod>=0?'+':''}${chaMod})
- Bônus Proficiência: +${char.proficiency_bonus}
- XP: ${char.experience_points}
- Arma Equipada: ${char.equipped_weapon?.name || 'Desarmado'}
- Condições: ${char.conditions && Array.isArray(char.conditions) && char.conditions.length > 0 ? char.conditions.join(', ') : 'Nenhuma'}
`;
            characterSheetsContext += "\n=== FIM DAS FICHAS ===\n";
            activeCharacterId = char.id;
          } else {
            console.error("❌ Fallback failed:", fallbackError);
          }
        } else {
          console.error("❌ No characterId provided for fallback");
        }
      }
      
      // 🔍 LOG THE FINAL CONTEXT
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 FINAL CHARACTER CONTEXT TO BE SENT TO AI:");
      console.log(characterSheetsContext || "⚠️ EMPTY - NO CHARACTER DATA");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
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
        const activePlayer = roomPlayers?.find((rp: any) => rp.user_id === lastPlayerMsg.player_id);
        if (activePlayer && !activeCharacterId) {
          activeCharacterId = activePlayer.character_id;
          console.log("Active character ID from last message:", activeCharacterId);
        }
      }
      
      if (activeCharacterId) {
        console.log("✅ Active character ID confirmed:", activeCharacterId);
      } else {
        console.warn("⚠️ No active character ID found - tool calls will not work");
      }
      
      // Prepend character sheets and campaign type to system prompt
      if (characterSheetsContext) {
        const campaignTypeInfo = `\n\n=== TIPO DE CAMPANHA ===\nCampanha: ${roomCampaignType.toUpperCase()}\nAdapte toda narrativa, NPCs, itens e desafios a este cenário.\n=========================\n`;
        messageHistory[0].content = GAME_MASTER_PROMPT + campaignTypeInfo + characterSheetsContext;
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
      // For session start, add campaign type context if provided
      if (isSessionStart && campaignType) {
        const campaignTypeInfo = `\n\n=== TIPO DE CAMPANHA ===\nCampanha: ${campaignType.toUpperCase()}\nAdapte toda narrativa, NPCs, itens e desafios a este cenário.\n=========================\n`;
        messageHistory[0].content = GAME_MASTER_PROMPT + campaignTypeInfo;
      }
      messageHistory.push(...(clientMessages || []));
    }

    console.log("Calling Lovable AI Gateway with", messageHistory.length, "messages...");
    
    // Define tool for structured extraction of game events
    const tools = [
      {
        type: "function",
        function: {
          name: "update_character_stats",
          description: "Atualiza HP e/ou XP do personagem após eventos narrativos. OBRIGATÓRIO chamar quando narrar ganho de XP ou mudanças de HP (dano/cura).",
          parameters: {
            type: "object",
            properties: {
              hp_change: {
                type: "number",
                description: "Mudança no HP. CRÍTICO: Use valores NEGATIVOS para dano (ex: -8 para 'você sofre 8 de dano') e POSITIVOS para cura (ex: +10 para 'você recupera 10 HP'). Sempre baseie no que foi narrado."
              },
              xp_gain: {
                type: "number",
                description: "Quantidade de XP ganho (sempre positivo or 0). Ex: 50 para derrotar inimigos, 25 para resolver puzzle"
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
      },
      {
        type: "function",
        function: {
          name: "set_shop",
          description: "Configura os itens da loja quando o jogador entrar em um estabelecimento comercial. Use quando narrar a entrada do personagem em lojas, mercados, ferrarias, joalherias, etc.",
          parameters: {
            type: "object",
            properties: {
              npc_name: {
                type: "string",
                description: "Nome do comerciante/lojista (ex: 'Gareth, o Ferreiro', 'Lúcia, a Joalheira')"
              },
              npc_description: {
                type: "string",
                description: "Breve descrição do NPC e da loja (ex: 'Um anão robusto com uma forja brilhante')"
              },
              npc_personality: {
                type: "string",
                enum: ["friendly", "neutral", "hostile"],
                description: "Personalidade do NPC: 'friendly' (amigável), 'neutral' (neutro), 'hostile' (hostil)"
              },
              npc_reputation: {
                type: "number",
                description: "Nível de reputação do lojista (-10 a +10, afeta preços). 0 = neutro, positivo = amigo, negativo = hostil"
              },
              items: {
                type: "array",
                description: "Lista de itens disponíveis na loja",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "ID único do item (ex: 'sword_longsword_1', 'ring_silver_2')"
                    },
                    name: {
                      type: "string",
                      description: "Nome do item (ex: 'Espada Longa', 'Anel de Prata')"
                    },
                    basePrice: {
                      type: "number",
                      description: "Preço base em peças de ouro (ex: 50)"
                    },
                    finalPrice: {
                      type: "number",
                      description: "Preço final calculado (use o mesmo valor que basePrice inicialmente)"
                    },
                    description: {
                      type: "string",
                      description: "Descrição detalhada do item"
                    },
                    rarity: {
                      type: "string",
                      enum: ["common", "uncommon", "rare", "epic", "legendary"],
                      description: "Raridade do item"
                    },
                    quality: {
                      type: "string",
                      enum: ["broken", "normal", "refined", "perfect", "legendary"],
                      description: "Qualidade do item (padrão: 'normal')"
                    },
                    stock: {
                      type: "number",
                      description: "Quantidade disponível (-1 = ilimitado)"
                    },
                    category: {
                      type: "string",
                      description: "Categoria do item (ex: 'weapon', 'armor', 'jewelry', 'potion')"
                    }
                  },
                  required: ["id", "name", "basePrice", "finalPrice", "description", "rarity", "quality"]
                }
              }
            },
            required: ["npc_name", "npc_description", "items"],
            additionalProperties: false
          }
        }
      },
      {
        type: "function",
        function: {
          name: "close_shop",
          description: "Fecha/limpa a loja quando o jogador sair ou mudar de atividade. Use quando a narrativa indicar que o personagem deixou a loja.",
          parameters: {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
          }
        }
      }
    ];
    
    console.log("🔄 Calling Lovable AI Gateway...");
    console.log("📊 Request details:", {
      model: "google/gemini-2.5-flash",
      messageCount: messageHistory.length,
      hasTools: true,
      streaming: true
    });
    
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

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ AI Gateway error:", response.status, errorText);
      
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
      
      throw new Error(`AI Gateway error: ${response.status} - ${errorText}`);
    }

    console.log("✅ AI Gateway responded successfully, starting stream...");
    
    // Collect the full response to save to database
    let fullResponse = "";
    let shopCreatedData: any = null;
    let shopClosingData: any = null;
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("No response body");
    }

    // Create a readable stream that processes SSE chunks
    let buffer = '';
    let toolCallsById = new Map();
    
    let chunkCount = 0;
    let lastChunkTime = Date.now();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunkCount++;
            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;
              
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  const delta = data.choices?.[0]?.delta;
                  
                  if (delta?.content) {
                    fullResponse += delta.content;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
                  }
                  
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
                        const existing = toolCallsById.get(key);
                        if (tc.function?.name) existing.function.name += tc.function.name;
                        if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
                      }
                    }
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
          
          const toolCalls = Array.from(toolCallsById.values());

          if (toolCalls.length > 0 && activeCharacterId) {
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function?.name;

              if (toolName === 'update_character_stats') {
                try {
                  const args = JSON.parse(toolCall.function?.arguments || '{}');
                  if (activeCharacterId) {
                    const updates: any = {};
                    if (args.hp_change !== undefined && args.hp_change !== 0) {
                      const { data: char } = await supabase.from('characters').select('current_hp').eq('id', activeCharacterId).single();
                      if (char) updates.current_hp = Math.max(0, char.current_hp + args.hp_change);
                    }
                    if (args.xp_gain && args.xp_gain > 0) {
                      const { data: char } = await supabase.from('characters').select('experience_points').eq('id', activeCharacterId).single();
                      if (char) updates.experience_points = (char.experience_points || 0) + args.xp_gain;
                    }
                    if (Object.keys(updates).length > 0) await supabase.from('characters').update(updates).eq('id', activeCharacterId);
                  }
                } catch (e) {
                  console.error('Error processing update_character_stats:', e);
                }
              }
            }
          }
          
          if (fullResponse.trim() && roomId) {
            const { data: roomData } = await supabase.from('rooms').select('gm_id').eq('id', roomId).single();
            if (roomData) {
              const parsed = parseStructuredResponse(fullResponse);
              let narrativeText = parsed.response.trim();

              if (narrativeText) {
                await supabase.from("gm_messages").insert({
                  room_id: roomId,
                  player_id: roomData.gm_id,
                  sender: "GM",
                  character_name: "Voz do Destino",
                  content: narrativeText,
                  type: "gm",
                });
              }
            }
          }
          controller.close();
        } catch (error) {
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
