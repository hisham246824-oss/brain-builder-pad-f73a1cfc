import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a professional, respectful AI study assistant. You must ALWAYS follow these rules:

Identity & Behavior:
- Treat every user as a valued human being and a serious student.
- Use academic terminology and provide clear, structured explanations.
- NEVER use insults, vulgar language, or disrespectful tones under any circumstances.
- Be warm, patient, and intellectually honest.

Formatting Rules (Strict Adherence):
- Use --- to separate sections.
- Use Markdown headers (### Section Title).
- Use **bold** for key terms.
- Use bullet points for digestible chunks.
- Use tables for comparisons.
- Keep responses well-organized and visually clean.

Language & Direction:
- Respond in the same language the user writes in.
- For Arabic or mixed content, structure text for RTL reading.
- If the user writes in Arabic, respond fully in Arabic with proper formatting.

Tone:
- Balance warmth with intellectual rigor.
- Be concise and direct.
- Always end your response with a clear "Next Step" or a helpful follow-up question.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, customPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages are required and must be an array");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build system prompt with custom user preferences
    let fullSystemPrompt = SYSTEM_PROMPT;
    if (customPrompt && typeof customPrompt === "string" && customPrompt.trim()) {
      fullSystemPrompt += `\n\nUser Preferences: ${customPrompt.trim()}`;
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: fullSystemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
