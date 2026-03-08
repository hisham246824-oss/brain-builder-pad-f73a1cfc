import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Get words with '-' meanings
    const { data: words, error: fetchError } = await supabase
      .from("vocabulary")
      .select("id, word")
      .eq("user_id", user.id)
      .eq("meanings", "-")
      .limit(100);

    if (fetchError) throw fetchError;
    if (!words || words.length === 0) {
      return new Response(
        JSON.stringify({ translated: 0, remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const wordList = words.map((w) => w.word).join(", ");

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are a translation assistant. Translate English words to Arabic. Return ONLY a valid JSON object where keys are the English words and values are concise Arabic translations (1-3 words max). No markdown, no explanation, just the JSON object. Example: {"hello": "مرحبا", "book": "كتاب"}`,
            },
            {
              role: "user",
              content: `Translate these words to Arabic:\n${wordList}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error("AI translation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    jsonStr = jsonStr.trim();

    let translations: Record<string, string>;
    try {
      translations = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse translations");
    }

    // Update each word
    let updated = 0;
    for (const word of words) {
      const meaning = translations[word.word] || translations[word.word.toLowerCase()];
      if (meaning) {
        const { error: updateError } = await supabase
          .from("vocabulary")
          .update({ meanings: meaning })
          .eq("id", word.id)
          .eq("user_id", user.id);
        if (!updateError) updated++;
      }
    }

    // Check remaining
    const { count } = await supabase
      .from("vocabulary")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("meanings", "-");

    return new Response(
      JSON.stringify({ translated: updated, remaining: count || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
