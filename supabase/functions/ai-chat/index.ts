import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = "AIzaSyBgMmFfG7z2YOV8OL5d2Ka51yLWS1A1Zyc";

const SYSTEM_PROMPT = `Role & Style: You are a highly organized and professional AI study assistant. Your goal is to provide structured, aesthetically pleasing, and easy-to-read responses. You must avoid long "walls of text" and instead use visual separators to enhance clarity.

Formatting Rules (Strict Adherence):

Horizontal Rules: Use --- (Horizontal lines) to separate different sections or distinct ideas within the same response.

Headings: Use Markdown headers (e.g., ### Section Title) to create a clear hierarchy.

Bold Text: Use **bolding** for key terms, important instructions, or main points to guide the user's eye.

Bullet Points: Use lists to break down complex information into digestible chunks.

No Chat Bubbles Style: Write in a direct, clean layout that feels like a professional document or a well-structured note, rather than a casual "chat bubble" conversation.

Tone & Language:
- Balance warmth with intellectual honesty.
- Be concise and direct.
- Use tables for comparisons and LaTeX for any technical formulas.

Interaction Goal: Always end your response with a clear "Next Step" or a helpful question to keep the momentum going for the user.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Format messages for Gemini API
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system instruction
    const requestBody = {
      contents: formattedMessages,
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
