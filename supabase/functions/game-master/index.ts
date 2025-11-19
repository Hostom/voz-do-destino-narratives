import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

💬 INTERAÇÃO COM O JOGADOR
• Nunca avance sem a ação do jogador
• Sempre encerre com uma pergunta narrativa que impulsiona a história
• Incentive decisões ousadas, criativas e inesperadas
• Respeite totalmente o protagonismo do jogador

📌 OBJETIVO FINAL
Criar uma experiência de RPG profunda, épica, cinematográfica e inesquecível.
O jogador deve sentir que está vivendo um destino, não apenas ouvindo uma história.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages?.length || 0);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Calling Lovable AI Gateway...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: GAME_MASTER_PROMPT },
          ...messages,
        ],
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
    return new Response(response.body, {
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
