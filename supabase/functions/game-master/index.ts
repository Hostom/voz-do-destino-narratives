import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GAME_MASTER_PROMPT = `Você é "Voz do Destino", um AI Game Master avançado projetado para narrar aventuras de RPG cinematográficas com voz, emoção e improvisação natural.
Sua missão é criar, mestrar e conduzir histórias interativas, reagindo às escolhas do jogador com lógica, criatividade e profundidade narrativa.

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
• SEMPRE que o jogador descrever uma ação com incerteza/risco, SOLICITE o teste apropriado diretamente:
  - Formato: "Faça um teste de [Habilidade] CD [número]"
  - NÃO explique que vai solicitar o teste, NÃO "pause" ou avise
  - NÃO verbalize os passos de identificação ou determinação
  - Apenas PEÇA o teste diretamente e aguarde o resultado
  - Narre as consequências baseado no resultado (sucesso/falha)
  - CDs apropriadas: Fácil (10), Médio (15), Difícil (20), Muito Difícil (25)
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
🚫 ATENÇÃO MÁXIMA: TODAS AS FICHAS DOS PERSONAGENS ESTÃO NA SEÇÃO "FICHAS DOS PERSONAGENS" ACIMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• VOCÊ TEM ACESSO COMPLETO E DIRETO A TODAS ESTAS INFORMAÇÕES:
  ✓ CA (Classe de Armadura) de cada personagem
  ✓ HP atual/máximo de cada personagem
  ✓ TODOS os modificadores de atributos (FOR, DES, CON, INT, SAB, CAR)
  ✓ Nível, classe, raça
  ✓ Armas equipadas
  ✓ Condições ativas
  
• 🚫 REGRA ABSOLUTA - NUNCA, EM HIPÓTESE ALGUMA, PEÇA AO JOGADOR:
  ❌ "Qual é sua CA?"
  ❌ "Quantos HP você tem?"
  ❌ "Qual seu modificador de [atributo]?"
  ❌ "Qual seu nível/classe/raça?"
  ❌ Qualquer informação que já está nas fichas acima
  
• ✅ USE ESSAS INFORMAÇÕES DIRETAMENTE:
  - Para calcular testes: use os modificadores das fichas
  - Para resolver ataques: use a CA das fichas
  - Para aplicar dano: use o HP atual das fichas
  - Para determinar efeitos: use o nível/classe das fichas
  
• Se você NÃO conseguir ver essas informações = há problema técnico
  - NÃO peça ao jogador para fornecer
  - Informe que há um erro e aguarde correção
• TODA ação de combate (ataque corpo-a-corpo, ataque à distância, magia de ataque) requer:
  1. Teste de ataque primeiro (d20 + modificador vs AC do inimigo)
  2. Se acertar, DEPOIS role o dano
• Quando o jogador ACERTAR um ataque: SEMPRE peça explicitamente "Role o dado de dano da sua arma/magia"
  - Especifique qual dado: "Role 1d8+[modificador] para sua Espada Longa"
  - Para magias: especifique os dados da magia (ex: "Role 3d6 para Bola de Fogo")
• Quando o jogador SOFRER DANO: 
  - SEMPRE calcule e informe: "Você sofreu X pontos de dano de [fonte]"
  - Descreva o impacto narrativamente
  - Use o HP atual da ficha para determinar o estado do personagem após o dano
• NUNCA role dados pelo jogador - sempre peça que ELE role
• Após receber resultado do dano, narre o impacto narrativamente
• Lembre-se: TODA consequência física tem dano - quedas, armadilhas, ataques, magias ofensivas

🧭 ESTRUTURA DE CONDUÇÃO
• Abertura / Gatilho inicial: introdução da ambientação e do conflito
• Complicação: apresentação de desafios, mistérios ou tensões
• Consequências: reação narrativa proporcional às escolhas
• Ganchos: novas direções para manter a história viva
• CRÍTICO: NUNCA ofereça opções numeradas de ação aos jogadores (ex: "1) Fazer X, 2) Fazer Y")
• Deixe os jogadores decidirem livremente suas ações sem sugestões ou lista de opções
• Apenas narre a situação e aguarde as decisões dos jogadores

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

🛒 LOJA E COMÉRCIO
• Os jogadores têm acesso a uma aba "Loja" na interface para comprar itens
• A loja é configurada pelo GM através de uma interface dedicada
• Você SEMPRE DEVE narrar a atmosfera, o ambiente e o lojista - NUNCA liste itens ou preços
• SEMPRE narre ANTES de usar qualquer ferramenta (ex: fechar loja)
• Quando o jogador SAI da loja ou diz que vai fazer outra coisa, NARRE a saída e então use close_shop
• Exemplo: Jogador entra na ferraria → Narre: "As brasas crepitam enquanto o ferreiro..." [depois o GM configura]
• Exemplo: Jogador sai → Narre: "Você se despede e sai da ferraria..." [depois close_shop]

💬 INTERAÇÃO COM O JOGADOR
• Nunca avance sem a ação do jogador
• Sempre encerre com uma pergunta narrativa que impulsiona a história
• Incentive decisões ousadas, criativas e inesperadas
• Respeite totalmente o protagonismo do jogador
• CRÍTICO: NUNCA responda APENAS com tool calls sem texto narrativo
• Observe e recompense boa interpretação concedendo INSPIRAÇÃO ao jogador
• Quando o jogador fizer roleplay excepcional, interpretação profunda, ou tomar decisões criativas e corajosas, CONCEDA INSPIRAÇÃO
• Inspiração permite ao jogador ter vantagem em um teste futuro (mecânica D&D 5e)

🛠️ FERRAMENTAS DISPONÍVEIS (CRÍTICO)
• update_character_stats: Atualiza HP e/ou XP do personagem
  - SEMPRE chame quando narrar ganho de XP ou mudanças de HP
  - hp_change: NEGATIVO para dano (ex: -8), POSITIVO para cura (ex: +10)
  - xp_gain: sempre positivo (ex: 50)
  - SEMPRE narre ANTES de chamar a ferramenta
• set_shop: Configura os itens da loja quando o jogador entrar
  - Use quando narrar a entrada do jogador em uma loja/mercado/ferraria/joalheria/etc
  - Exemplo: "Você entra na joalheria e vê prateleiras cheias de gemas..." → set_shop
  - SEMPRE narre a atmosfera ANTES de chamar a ferramenta
  - Configure itens temáticos apropriados para o tipo de estabelecimento
• close_shop: Limpa/fecha a loja quando o jogador sair ou mudar de atividade
  - Use quando o jogador deixar a loja ou disser que vai fazer outra coisa
  - Exemplo: "Você sai da ferraria e segue pela rua" → close_shop

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

🧠 VALIDAÇÃO DE AÇÕES
• SEMPRE verifique se a ação do jogador é compatível com sua ficha e com as regras de D&D 5e
• Se algo não for possível, corrija educadamente e ofereça alternativas viáveis
• Consulte os atributos, equipamentos e habilidades da ficha antes de narrar
• NUNCA aceite criações de mecânicas inexistentes (voar sem habilidade, ataques extras sem recurso, etc.)
• Execute essas verificações SILENCIOSAMENTE - não explique seu processo de raciocínio na narrativa
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
      model: "google/gemini-2.5-pro",
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
    let shopCreatedData: any = null; // Store shop data when set_shop is called
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("No response body");
    }

    // Create a readable stream that processes SSE chunks
    let buffer = '';
    let toolCallsById = new Map(); // Track tool calls by index and id
    
    let chunkCount = 0;
    let lastChunkTime = Date.now();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("📖 Starting to read stream...");
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log("Stream finished");
              break;
            }
            
            chunkCount++;
            if (chunkCount === 1) {
              console.log("✅ First chunk received!");
            }
            
            const now = Date.now();
            if (now - lastChunkTime > 5000) {
              console.log(`⏱️ Stream still active (${chunkCount} chunks, ${fullResponse.length} chars)`);
              lastChunkTime = now;
            }
            
            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines from buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue; // Skip empty lines and comments
              
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                
                if (dataStr === '[DONE]') {
                  continue;
                }
                
                try {
                  const data = JSON.parse(dataStr);
                  const delta = data.choices?.[0]?.delta;
                  
                  // Extract text content
                  if (delta?.content) {
                    fullResponse += delta.content;
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
                  }
                  
                  // Collect tool calls progressively
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
                        // Append to existing tool call
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
                  // Skip malformed JSON chunks
                  console.error("Error parsing SSE data:", e);
                }
              }
            }
          }
          
          // Stream complete - process tool calls
          const toolCalls = Array.from(toolCallsById.values());
          console.log(`📋 Total tool calls collected: ${toolCalls.length}`);
          
          if (toolCalls.length > 0 && activeCharacterId) {
            console.log("🔄 Processing tool calls:", toolCalls.length);
            
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function?.name;
              console.log(`Processing tool: ${toolName}`);
              
              if (toolName === 'close_shop' && roomId) {
                console.log('🛒 Closing shop...');
                try {
                  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
                  const closeShopResponse = await fetch(`${supabaseUrl}/functions/v1/close-shop`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                      'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
                    },
                    body: JSON.stringify({ roomId }),
                  });
                  
                  if (closeShopResponse.ok) {
                    console.log("✅ Shop closed successfully");
                  } else {
                    console.error("❌ Error closing shop:", await closeShopResponse.text());
                  }
                } catch (e) {
                  console.error("❌ Exception closing shop:", e);
                }
              }
              
              if (toolName === 'set_shop' && roomId) {
                try {
                  const args = JSON.parse(toolCall.function?.arguments || '{}');
                  console.log('🏪 Setting up shop:', args);
                  
                  // Store shop data for narrative generation
                  shopCreatedData = {
                    npcName: args.npc_name || "Mercador",
                    npcPersonality: args.npc_personality || "neutral",
                    npcReputation: args.npc_reputation || 0,
                    items: args.items || []
                  };
                  
                  const setShopResponse = await fetch(`${supabaseUrl}/functions/v1/set-shop`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${supabaseKey}`
                    },
                    body: JSON.stringify({
                      roomId,
                      npcName: shopCreatedData.npcName,
                      npcDescription: args.npc_description || 'Um comerciante experiente',
                      npcPersonality: shopCreatedData.npcPersonality,
                      npcReputation: shopCreatedData.npcReputation,
                      items: shopCreatedData.items
                    })
                  });
                  
                  if (setShopResponse.ok) {
                    console.log('✅ Shop set successfully');
                  } else {
                    console.error('❌ Error setting shop:', await setShopResponse.text());
                    shopCreatedData = null; // Clear if failed
                  }
                } catch (e) {
                  console.error('❌ Exception setting up shop:', e);
                  shopCreatedData = null; // Clear if exception
                }
              }
              
              if (toolName === 'update_character_stats') {
                try {
                  const args = JSON.parse(toolCall.function?.arguments || '{}');
                  console.log('📊 Update character stats:', args);
                  
                  if (activeCharacterId) {
                    const updates: any = {};
                    
                    if (args.hp_change !== undefined && args.hp_change !== 0) {
                      const { data: char } = await supabase
                        .from('characters')
                        .select('current_hp')
                        .eq('id', activeCharacterId)
                        .single();
                      
                      if (char) {
                        updates.current_hp = Math.max(0, char.current_hp + args.hp_change);
                        console.log(`HP: ${char.current_hp} → ${updates.current_hp}`);
                      }
                    }
                    
                    if (args.xp_gain && args.xp_gain > 0) {
                      const { data: char } = await supabase
                        .from('characters')
                        .select('experience_points')
                        .eq('id', activeCharacterId)
                        .single();
                      
                      if (char) {
                        updates.experience_points = (char.experience_points || 0) + args.xp_gain;
                        console.log(`XP: +${args.xp_gain} (Total: ${updates.experience_points})`);
                      }
                    }
                    
                    if (Object.keys(updates).length > 0) {
                      await supabase
                        .from('characters')
                        .update(updates)
                        .eq('id', activeCharacterId);
                      console.log('✅ Character updated');
                    }
                  }
                } catch (e) {
                  console.error('Error processing update_character_stats:', e);
                }
              }
            }
          } else {
            if (toolCalls.length === 0) console.log("⚠️ No tool calls");
            if (!activeCharacterId) console.log("⚠️ No active character");
          }
          
          // Save GM response to database
          if (fullResponse.trim() && roomId) {
            console.log("Stream complete. Full response length:", fullResponse.length);
            console.log("Saving GM response to gm_messages ONLY...");
            console.log("⚠️ CRITICAL: This function will NEVER save to room_chat_messages");
            
            // Get the GM user id from the room
            const { data: room, error: roomError} = await supabase
              .from('rooms')
              .select('gm_id')
              .eq('id', roomId)
              .single();

                if (roomError) {
                  console.error("Error fetching room:", roomError);
                } else if (room) {
                  console.log("Room found. GM ID:", room.gm_id);
                  
                  // Generate narrative for shop if set_shop was called
                  let narrativeText = fullResponse.trim();
                  
                  // Check if shop was created via tool call
                  if (shopCreatedData && shopCreatedData.items.length > 0) {
                    console.log("🛒 Generating narrative for shop created via set_shop tool...");
                    
                    const personalityGreeting = {
                      friendly: "com um sorriso acolhedor",
                      neutral: "profissionalmente", 
                      hostile: "com um olhar desconfiado"
                    };
                    
                    const itemsPreview = shopCreatedData.items.slice(0, 3).map((item: any) => item.name).join(", ");
                    const moreItems = shopCreatedData.items.length > 3 ? ` e mais ${shopCreatedData.items.length - 3} itens` : "";
                    
                    const shopNarrative = `${shopCreatedData.npcName} recebe os aventureiros ${personalityGreeting[shopCreatedData.npcPersonality as keyof typeof personalityGreeting]}. "Bem-vindos à minha loja," diz ${shopCreatedData.npcPersonality === 'hostile' ? 'friamente' : 'o mercador'}. "Tenho ${itemsPreview}${moreItems} disponíveis. Deem uma olhada e vejam o que lhes interessa."`;
                    
                    // Replace the generic message with shop narrative
                    narrativeText = shopNarrative;
                    console.log("✅ Shop narrative generated from tool call");
                  }
                  
                  console.log("🔍 Checking for [SHOP] block in response...");
                  console.log("Response first 200 chars:", narrativeText.substring(0, 200));
                  
                  const shopBlockRegex = /\[SHOP\]\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n[A-Z][^a-z\n]*$|$)/i;
                  const shopMatch = narrativeText.match(shopBlockRegex);
                  
                  if (!shopMatch) {
                    console.log("❌ No [SHOP] block found in response");
                  }
                  
                  if (shopMatch) {
                    console.log("🛒 [SHOP] block detected! Processing shop items...");
                    const shopContent = shopMatch[1].trim();
                    
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
                          
                          // Generate automatic narrative about shop opening
                          const personalityGreeting = {
                            friendly: "com um sorriso acolhedor",
                            neutral: "profissionalmente",
                            hostile: "com um olhar desconfiado"
                          };
                          
                          const itemsPreview = shopItems.slice(0, 3).map(item => item.name).join(", ");
                          const moreItems = shopItems.length > 3 ? ` e mais ${shopItems.length - 3} itens` : "";
                          
                          const shopNarrative = `${npcName} recebe os aventureiros ${personalityGreeting[npcPersonality]}. "Bem-vindos à minha loja," diz o mercador. "Tenho ${itemsPreview}${moreItems} disponíveis. Deem uma olhada e vejam o que lhes interessa."`;
                          
                          // Replace [SHOP] block with narrative
                          narrativeText = narrativeText.replace(shopBlockRegex, shopNarrative).trim();
                          console.log("✅ Shop narrative generated and inserted");
                        } else {
                          const errorText = await updateShopResponse.text();
                          console.error("❌ Error calling update-shop:", errorText);
                          // Remove shop block even on error
                          narrativeText = narrativeText.replace(shopBlockRegex, '').trim();
                        }
                      } catch (shopError) {
                        console.error("❌ Exception calling update-shop:", shopError);
                        // Remove shop block even on error
                        narrativeText = narrativeText.replace(shopBlockRegex, '').trim();
                      }
                    } else {
                      // No items parsed, just remove the block
                      narrativeText = narrativeText.replace(shopBlockRegex, '').trim();
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
                    
                    // If we have tool calls but no narrative, create a default message
                    if (toolCalls.length > 0 && roomId) {
                      console.log("⚠️ No narrative text but tool calls present. Creating default message.");
                      const toolNames = toolCalls.map(tc => tc.function?.name).join(", ");
                      
                      const { data: room } = await supabase
                        .from("rooms")
                        .select("gm_id")
                        .eq("id", roomId)
                        .single();
                      
                      if (room) {
                        await supabase
                          .from("gm_messages")
                          .insert({
                            room_id: roomId,
                            player_id: room.gm_id,
                            sender: "GM",
                            character_name: "Voz do Destino",
                            content: `_O Mestre está preparando algo... (ações executadas: ${toolNames})_`,
                            type: "gm",
                          });
                        console.log("✅ Default message saved for tool-only response");
                      }
                    }
                  }
                  if (!roomId) {
                    console.error("❌ No roomId provided");
                  }
                }
              controller.close();
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
