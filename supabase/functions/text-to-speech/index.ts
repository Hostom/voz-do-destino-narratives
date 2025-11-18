import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error("Text is required");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Generating speech with OpenAI TTS...");

    // Retry logic with longer delays for rate limits
    const maxRetries = 3;
    const retryDelays = [5000, 15000, 30000]; // 5s, 15s, 30s
    let response: Response | null = null;
    let lastError: string | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Using onyx voice - deep and dramatic, perfect for game master narration
        response = await fetch(
          "https://api.openai.com/v1/audio/speech",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1",
              input: text,
              voice: "onyx",
              response_format: "mp3",
            }),
          }
        );

        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const waitTime = retryAfter 
            ? parseInt(retryAfter) * 1000 
            : retryDelays[attempt];
          
          lastError = `Rate limit hit. Attempt ${attempt + 1}/${maxRetries}`;
          console.log(`${lastError}. Waiting ${waitTime}ms before retry...`);
          
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          // Final attempt failed
          throw new Error("OpenAI rate limit exceeded. The free tier has limited requests per minute. Please wait 60 seconds and try again, or upgrade your OpenAI account for higher limits.");
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error("OpenAI API error:", response.status, errorText);
          
          // Try to parse error for better messaging
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error?.message || `OpenAI API error: ${response.status}`);
          } catch {
            throw new Error(`Failed to generate speech: ${response.status}`);
          }
        }

        // Success - break out of retry loop
        console.log("Successfully generated speech");
        break;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error; // Re-throw on final attempt
        }
        console.log(`Attempt ${attempt + 1} failed:`, error);
      }
    }

    if (!response || !response.ok) {
      throw new Error(lastError || "Failed to generate speech after retries");
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64 in chunks to avoid stack overflow
    const uint8Array = new Uint8Array(audioBuffer);
    let binaryString = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode(...chunk);
    }
    
    const base64Audio = btoa(binaryString);

    console.log("Speech generated successfully");

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
