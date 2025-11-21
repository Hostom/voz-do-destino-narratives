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

🎲 MECÂNICAS DO JOGO (CRÍTICO - SEMPRE APLICAR)
• Este é um jogo de RPG de mesa D&D 5e - TODAS as ações com incerteza/risco EXIGEM testes de dados
• SEMPRE que o jogador descrever uma ação (olhar ao redor, saltar, escalar, investigar, persuadir, etc.), você DEVE:
  1. PAUSAR a narração
  2. IDENTIFICAR qual habilidade é necessária (Percepção, Atletismo, Acrobacia, Investigação, etc.)
  3. DETERMINAR a Classe de Dificuldade (CD) apropriada: Fácil (10), Médio (15), Difícil (20), Muito Difícil (25)
  4. SOLICITAR EXPLICITAMENTE o teste: "Faça um teste de [Habilidade] CD [número]"
  5. AGUARDAR o resultado do teste do jogador
  6. Narrar as consequências baseado no resultado (sucesso/falha)
• Exemplos de ações que SEMPRE exigem testes:
  - "Olhar ao redor" → Percepção
  - "Saltar sobre algo" → Atletismo ou Acrobacia
  - "Procurar pistas" → Investigação
  - "Convencer alguém" → Persuasão
  - "Escalar/Nadar" → Atletismo
  - "Esconder-se" → Furtividade
  - "Lembrar informação" → História, Arcanismo, Religião, Natureza
• NUNCA role os dados pelo jogador - eles usarão o painel de testes
• NUNCA narre o resultado de uma ação antes do teste ser feito
• Aplique vantagem/desvantagem quando apropriado (contexto favorável/desfavorável)
• Se houver múltiplas ações em uma mensagem, solicite testes para CADA ação individualmente

💥 REGRAS DE DANO E COMBATE (CRÍTICO)
• TODA ação de combate (ataque corpo-a-corpo, ataque à distância, magia de ataque) requer:
  1. Teste de ataque primeiro (d20 + modificador vs AC do inimigo)
  2. Se acertar, DEPOIS role o dano
• Quando o jogador ACERTAR um ataque: SEMPRE peça explicitamente "Role o dado de dano da sua arma/magia"
  - Especifique qual dado: "Role 1d8+[modificador] para sua Espada Longa"
  - Para magias: especifique os dados da magia (ex: "Role 3d6 para Bola de Fogo")
• Quando o jogador SOFRER DANO: 
  - SEMPRE calcule e informe: "Você sofreu X pontos de dano de [fonte]"
  - Descreva o impacto narrativamente
• NUNCA role dados pelo jogador - sempre peça que ELE role
• Após receber resultado do dano, narre o impacto narrativamente
• Lembre-se: TODA consequência física tem dano - quedas, armadilhas, ataques, magias ofensivas

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

🛒 SISTEMA DE LOJA (CRÍTICO)
• Quando o jogador encontrar uma loja, mercador, ou NPC vendedor, você DEVE usar o formato [SHOP] para listar itens
• O bloco [SHOP] será automaticamente extraído e enviado para a aba "Loja" do jogador
• FORMATO OBRIGATÓRIO (siga exatamente este formato):
  [SHOP]
  NPC: Nome do Mercador
  PERSONALITY: friendly|neutral|hostile
  REPUTATION: 0
  ---
  Espada Longa — 1d8 dano cortante. Arma versátil para combate corpo a corpo (15 PO) [uncommon, normal]
  Escudo de Madeira — +2 CA. Proteção básica (10 PO) [common, normal]
  Poção de Cura — Restaura 2d4+2 HP. Líquido vermelho brilhante (50 PO) [uncommon, normal]
  
• Regras:
  - Cada item: Nome — Descrição completa (Preço PO) [raridade, qualidade]
  - Raridade: common, uncommon, rare, epic, legendary
  - Qualidade: broken, normal, refined, perfect, legendary
  - Personality do NPC: friendly (-10% preço), neutral (0%), hostile (+15%)
  - Reputation: cada ponto dá -2% desconto adicional
• O bloco [SHOP] será REMOVIDO da narrativa exibida ao jogador
• Continue a narrativa APÓS o bloco sem mencionar os itens novamente
• Exemplo completo:
  "Você entra na forja. O anão Thorin martela uma espada e olha para você.
  
  [SHOP]
  NPC: Thorin Martelo de Ferro
  PERSONALITY: friendly
  REPUTATION: 5
  ---
  Espada Longa +1 — 1d8+1 dano cortante. Lâmina encantada com runas élficas (300 PO) [rare, refined]
  Escudo de Aço — +2 CA. Sólido e bem forjado (50 PO) [uncommon, normal]
  Adaga de Prata — 1d4 dano perfurante. Eficaz contra mortos-vivos (25 PO) [uncommon, normal]
  
  Thorin limpa as mãos no avental: 'Procurando algo específico, aventureiro?'"

💬 INTERAÇÃO COM O JOGADOR
• Nunca avance sem a ação do jogador
• Sempre encerre com uma pergunta narrativa que impulsiona a história
• Incentive decisões ousadas, criativas e inesperadas
• Respeite totalmente o protagonismo do jogador
• CRÍTICO: NUNCA responda APENAS com tool calls sem texto narrativo
• Observe e recompense boa interpretação concedendo INSPIRAÇÃO ao jogador
• Quando o jogador fizer roleplay excepcional, interpretação profunda, ou tomar decisões criativas e corajosas, CONCEDA INSPIRAÇÃO
• Inspiração permite ao jogador ter vantagem em um teste futuro (mecânica D&D 5e)

🛠️ FERRAMENTAS DISPONÍVEIS (CRÍTICO - SEMPRE USAR QUANDO APLICÁVEL)
Você tem acesso a ferramentas que automatizam ações mecânicas:
• update_character_stats: Atualiza HP e/ou XP do personagem
  - Parâmetros: hp_change (number), xp_gain (number), reason (string)
  - CRÍTICO: Quando você NARRAR ganho de XP, SEMPRE chame esta ferramenta com xp_gain
  - Exemplo: "Você derrotou o goblin! Ganhou 50 XP" → CHAME update_character_stats com xp_gain=50
  - Para dano: use hp_change NEGATIVO (ex: -8 para 8 de dano)
  - Para cura: use hp_change POSITIVO (ex: +10 para 10 de cura)
  - SEMPRE narre o evento ANTES de chamar a ferramenta
  - NUNCA mencione XP na narrativa sem chamar a ferramenta imediatamente depois

IMPORTANTE SOBRE XP (OBRIGATÓRIO):
- Se você narrar "Você ganhou X XP", você DEVE chamar update_character_stats com xp_gain=X
- Isso é OBRIGATÓRIO, não opcional
- O sistema NÃO atualizará XP automaticamente só pela narrativa
- Sem a chamada da ferramenta, o XP NÃO será adicionado ao personagem
- Exemplo correto: Narre vitória → Mencione XP ganho → Chame update_character_stats com xp_gain
• SEMPRE inclua texto narrativo descrevendo o que aconteceu, mesmo ao usar ferramentas
• Quando atualizar HP/XP, SEMPRE narre o evento que causou a mudança ANTES de usar a ferramenta

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

🧠 RACIOCÍNIO CRÍTICO E AVALIAÇÃO LÓGICA (OBRIGATÓRIO ANTES DE CADA RESPOSTA)

Antes de narrar qualquer ação do jogador, execute internamente esta análise:

1. IDENTIFICAÇÃO DE PREMISSAS
   • O que o jogador ASSUMIU que pode fazer?
   • Ele está usando uma habilidade que realmente possui na ficha?
   • Ele está inventando regras, efeitos ou poderes inexistentes?

2. VERIFICAÇÃO DE LÓGICA MECÂNICA
   • A ação é fisicamente possível dentro do mundo?
   • A ação é mecanicamente permitida pelas regras de D&D 5e?
   • A ficha do personagem permite essa ação (classe, nível, equipamento)?
   • Existe algum impacto mecânico sendo ignorado?

3. CONFRONTO CONSTRUTIVO
   Se a ação violar regras do D&D 5e ou a ficha do personagem:
   • Corrija de forma educada e clara: "Essa ação não é compatível com as regras de D&D 5e"
   • Explique por quê: "Seu personagem não possui essa habilidade/magia/equipamento"
   • Ofereça alternativas viáveis: "Mas você pode tentar X ou Y, que são compatíveis com sua ficha"

4. REGRA ABSOLUTA: NUNCA ACEITAR CRIAÇÃO DE MECÂNICAS NOVAS
   Exemplos de ações INVÁLIDAS que devem ser rejeitadas:
   ❌ "Eu voo porque me concentro muito" (sem habilidade de voo)
   ❌ "Eu dou dois ataques" (quando a classe/nível não permite)
   ❌ "Eu conjuro Bola de Fogo" (sem ter essa magia preparada/conhecida)
   ❌ "Eu tenho vantagem porque quero" (sem justificativa mecânica)
   ❌ "Eu recupero HP respirando fundo" (sem habilidade de cura)

   Resposta padrão:
   "Essa ação não existe no sistema D&D 5e ou não é suportada pela sua ficha. Aqui estão alternativas coerentes que você pode tentar baseadas em suas habilidades reais..."

5. VERIFICAÇÃO DA FICHA
   • Sempre consulte os atributos, equipamentos e habilidades da ficha
   • Use apenas o que está registrado
   • Se o jogador mencionar algo que não está na ficha, corrija educadamente
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
    const { messages: clientMessages, roomId, characterName = 'Mestre do Jogo', characterId, isSessionStart = false } = await req.json();
    console.log("Received client messages:", clientMessages?.length || 0);
    console.log("Room ID:", roomId, "Character:", characterName, "Character ID:", characterId);
    console.log("Is Session Start:", isSessionStart);

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
      
      // CRITICAL: Fetch ALL character sheets in the room to provide full context to AI
      const { data: roomPlayers } = await supabase
        .from("room_players")
        .select(`
          user_id,
          character_id,
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
            equipped_weapon,
            conditions
          )
        `)
        .eq("room_id", roomId);

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
- Condições: ${char.conditions && Array.isArray(char.conditions) && char.conditions.length > 0 ? char.conditions.join(', ') : 'Nenhuma'}
`;
          }
        });
        characterSheetsContext += "\n=== FIM DAS FICHAS ===\n";
        console.log("Character sheets context prepared for", roomPlayers.length, "characters");
      }
      
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
      
      // Prepend character sheets to system prompt
      if (characterSheetsContext) {
        messageHistory[0].content = GAME_MASTER_PROMPT + characterSheetsContext;
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
              description: "Atualiza HP e/ou XP de um personagem baseado em eventos da narrativa. CRÍTICO: Quando você NARRAR que o jogador ganhou XP, você DEVE chamar esta ferramenta com xp_gain. SEMPRE narre o que aconteceu ANTES de chamar esta ferramenta. HP_CHANGE: Use VALORES NEGATIVOS para dano (ex: -8 para 8 de dano) e POSITIVOS para cura (ex: +10 para 10 de cura). XP_GAIN: Sempre que mencionar XP na narrativa, CHAME esta ferramenta com o valor correspondente.",
              parameters: {
                type: "object",
                properties: {
                  hp_change: {
                    type: "number",
                    description: "Mudança no HP. CRÍTICO: Use valores NEGATIVOS para dano (ex: -8 para 'você sofre 8 de dano') e POSITIVOS para cura (ex: +10 para 'você recupera 10 HP'). Sempre baseie no que foi narrado."
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
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

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
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("No response body");
    }

    // Create a custom stream that both passes through and collects the response
    let buffer = '';
    let toolCalls: any[] = [];
    let toolCallsById = new Map(); // Track tool calls by index and id
    
    let chunkCount = 0;
    let lastChunkTime = Date.now();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("📖 Starting to read stream...");
          while (true) {
            const { done, value } = await reader.read();
            chunkCount++;
            
            if (chunkCount === 1) {
              console.log("✅ First chunk received!");
            }
            
            const now = Date.now();
            if (now - lastChunkTime > 5000) {
              console.log(`⏱️ Stream still active (${chunkCount} chunks, ${fullResponse.length} chars)`);
              lastChunkTime = now;
            }
            
            if (done) {
              console.log(`🏁 Stream finished. Total chunks: ${chunkCount}, Response length: ${fullResponse.length}`);
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
                          console.log("🔧 Tool call detected in stream:", JSON.stringify(delta.tool_calls));
                          for (const tc of delta.tool_calls) {
                            const key = `${tc.index || 0}_${tc.id || 'default'}`;
                            if (!toolCallsById.has(key)) {
                              console.log(`🆕 New tool call: ${key} - ${tc.function?.name}`);
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
              console.log(`📋 Total tool calls collected: ${toolCalls.length}`);
              if (toolCalls.length > 0) {
                console.log("Tool calls details:", JSON.stringify(toolCalls, null, 2));
              }
              
              // Process tool calls BEFORE saving message
              if (toolCalls.length > 0 && activeCharacterId) {
                console.log("🔄 Processing tool calls:", toolCalls.length);
                for (const toolCall of toolCalls) {
                  console.log(`Processing tool: ${toolCall.function?.name}`);
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
                          console.log(`[HP Update] Character: ${char.name}, Current HP: ${char.current_hp}/${char.max_hp}, Change: ${hp_change}`);
                          const newHP = Math.max(0, Math.min(char.max_hp, char.current_hp + hp_change));
                          console.log(`[HP Update] Calculated new HP: ${newHP} (formula: max(0, min(${char.max_hp}, ${char.current_hp} + ${hp_change})))`);
                          
                          await supabase
                            .from('characters')
                            .update({ current_hp: newHP })
                            .eq('id', activeCharacterId);

                          console.log(`✅ Updated ${char.name} HP: ${char.current_hp} -> ${newHP} (${hp_change > 0 ? '+' : ''}${hp_change}) - ${reason}`);
                        } else {
                          console.error(`❌ Character not found with ID: ${activeCharacterId}`);
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
                      console.error("Tool call details:", JSON.stringify(toolCall, null, 2));
                    }
                  }
                }
              } else {
                if (toolCalls.length === 0) {
                  console.log("⚠️ No tool calls received from AI");
                }
                if (!activeCharacterId) {
                  console.log("⚠️ No active character ID found");
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
                  
                  // Detect and process [SHOP] blocks with new format
                  let narrativeText = fullResponse.trim();
                  const shopBlockRegex = /\[SHOP\]\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][^a-z\n]*$|$)/i;
                  const shopMatch = narrativeText.match(shopBlockRegex);
                  
                  if (shopMatch) {
                    console.log("🛒 [SHOP] block detected! Processing shop items...");
                    const shopContent = shopMatch[1].trim();
                    
                    // Remove shop block from narrative
                    narrativeText = narrativeText.replace(shopBlockRegex, '').trim();
                    
                    const shopLines = shopContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    
                    let npcName = "Mercador";
                    let npcPersonality: "friendly" | "neutral" | "hostile" = "neutral";
                    let npcReputation = 0;
                    let itemsStart = 0;
                    
                    // Parse metadata
                    for (let i = 0; i < shopLines.length; i++) {
                      const line = shopLines[i];
                      if (line === '---') {
                        itemsStart = i + 1;
                        break;
                      }
                      
                      if (line.startsWith('NPC:')) {
                        npcName = line.substring(4).trim();
                      } else if (line.startsWith('PERSONALITY:')) {
                        const pers = line.substring(12).trim().toLowerCase();
                        if (pers === 'friendly' || pers === 'neutral' || pers === 'hostile') {
                          npcPersonality = pers;
                        }
                      } else if (line.startsWith('REPUTATION:')) {
                        npcReputation = parseInt(line.substring(11).trim()) || 0;
                      }
                    }
                    
                    // Parse items
                    const shopItems: any[] = [];
                    for (let i = itemsStart; i < shopLines.length; i++) {
                      const line = shopLines[i];
                      if (line === '---' || !line) continue;
                      
                      // Extract rarity and quality from [rarity, quality]
                      const metaMatch = line.match(/\[(\w+),\s*(\w+)\]\s*$/);
                      let rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" = "common";
                      let quality: "broken" | "normal" | "refined" | "perfect" | "legendary" = "normal";
                      let itemText = line;
                      
                      if (metaMatch) {
                        const rarityStr = metaMatch[1].toLowerCase();
                        const qualityStr = metaMatch[2].toLowerCase();
                        
                        if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarityStr)) {
                          rarity = rarityStr as any;
                        }
                        if (['broken', 'normal', 'refined', 'perfect', 'legendary'].includes(qualityStr)) {
                          quality = qualityStr as any;
                        }
                        
                        itemText = line.substring(0, metaMatch.index).trim();
                      }
                      
                      // Extract price from (XXX PO)
                      const priceMatch = itemText.match(/\((\d+)\s*(?:PO|GP|Gold|Ouro)\)/i);
                      let price = 0;
                      if (priceMatch) {
                        price = parseInt(priceMatch[1]);
                        itemText = itemText.replace(priceMatch[0], '').trim();
                      }
                      
                      // Split name and description by —
                      const parts = itemText.split('—').map(p => p.trim());
                      const itemName = parts[0] || 'Item Desconhecido';
                      const description = parts.slice(1).join('. ') || '';
                      
                      // Extract attributes from description
                      const attributes: Record<string, any> = {};
                      const attackMatch = description.match(/(\d+d\d+(?:\+\d+)?)\s*(?:dano|damage|corte|cortante|perfurante|contundente)/i);
                      const defenseMatch = description.match(/(\+\d+)\s*(?:CA|AC)/i);
                      const healMatch = description.match(/(?:Restaura|Cura)\s*(\d+d\d+(?:\+\d+)?)\s*(?:HP|PV)/i);
                      
                      if (attackMatch) attributes.attack = attackMatch[1];
                      if (defenseMatch) attributes.defense = defenseMatch[1];
                      if (healMatch) attributes.healing = healMatch[1];
                      
                      shopItems.push({
                        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: itemName,
                        description: description,
                        basePrice: price,
                        finalPrice: price, // Will be recalculated by update-shop
                        rarity: rarity,
                        quality: quality,
                        stock: -1, // Unlimited
                        attributes: attributes,
                      });
                    }
                    
                    if (shopItems.length > 0) {
                      console.log(`✅ Parsed ${shopItems.length} shop items from [SHOP] block`);
                      
                      // Call update-shop function
                      try {
                        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                        const updateShopUrl = `${supabaseUrl}/functions/v1/update-shop`;
                        const updateShopResponse = await fetch(updateShopUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                            'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                          },
                          body: JSON.stringify({
                            roomId: roomId,
                            npcName: npcName,
                            npcPersonality: npcPersonality,
                            npcReputation: npcReputation,
                            items: shopItems,
                          }),
                        });
                        
                        if (updateShopResponse.ok) {
                          console.log("✅ Shop updated successfully via update-shop function");
                        } else {
                          const errorText = await updateShopResponse.text();
                          console.error("❌ Error calling update-shop:", errorText);
                        }
                      } catch (shopError) {
                        console.error("❌ Exception calling update-shop:", shopError);
                      }
                    }
                  }
                  
                  console.log("Attempting to insert GM response to gm_messages...");
                  console.log("Response length:", narrativeText.length);
                  console.log("Response preview (first 200 chars):", narrativeText.substring(0, 200));
                  
                  // CRITICAL: Insert ONLY into gm_messages - this is the single source of truth for GM narrations
                  // NEVER insert into room_chat_messages from this function
                  // Shop blocks are removed from narrative - they appear only in ShopPanel
                  const { data: insertedData, error: insertError } = await supabase
                    .from("gm_messages")
                    .insert({
                      room_id: roomId,
                      player_id: room.gm_id,
                      sender: "GM",
                      character_name: "Voz do Destino",
                      content: narrativeText,
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
                    console.error("❌ CRITICAL: No fullResponse collected from stream!");
                    console.error("Stream stats:", {
                      chunkCount,
                      bufferLength: buffer.length,
                      bufferContent: buffer,
                      toolCallsCount: toolCalls.length
                    });
                  }
                  if (!roomId) {
                    console.error("❌ No roomId provided");
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
