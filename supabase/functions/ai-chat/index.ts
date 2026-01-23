import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = "AIzaSyBgMmFfG7z2YOV8OL5d2Ka51yLWS1A1Zyc";

const SYSTEM_PROMPT = `Role & Style: You are a highly organized and professional AI study assistant. Your goal is to provide structured, aesthetically pleasing, and easy-to-read responses. You must avoid long "walls of text" and instead use visual separators to enhance clarity.

Formatting Rules (Strict Adherence):
Horizontal Rules: Use --- to separate sections.
Headings: Use Markdown headers (e.g., ### Section Title).
Bold Text: Use **bolding** for key terms.
Bullet Points: Use lists for digestible chunks.

Tone & Language:
- Balance warmth with intellectual honesty.
- Be concise and direct.
- Use tables for comparisons.

Interaction Goal: Always end your response with a clear "Next Step" or a helpful question.`;

serve(async (req) => {
  // التعامل مع طلبات Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // تأكد أن الرسائل موجودة
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Messages are required and must be an array");
    }

    // تنسيق الرسائل لـ Gemini API
    const formattedContents = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // تجهيز جسم الطلب (Request Body)
    const requestBody = {
      contents: formattedContents,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000, // قللتها شوي عشان السرعة
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    // التأكد من وجود رد
    if (data.error) {
      console.error('Gemini API Error details:', data.error);
      throw new Error(data.error.message || 'API Error');
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
