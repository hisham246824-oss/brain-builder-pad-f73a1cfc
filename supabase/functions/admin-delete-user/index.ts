import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claimsData.claims.sub as string;

    const { data: isSuperAdmin } = await callerClient.rpc("is_super_admin", { _user_id: callerId });
    if (!isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Super admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (user_id === callerId) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const tables = [
      { table: 'material_files', column: 'user_id' },
      { table: 'lessons', column: 'user_id' },
      { table: 'study_materials', column: 'user_id' },
      { table: 'vocabulary', column: 'user_id' },
      { table: 'user_settings', column: 'user_id' },
      { table: 'suggestions', column: 'user_id' },
      { table: 'suggestion_votes', column: 'user_id' },
      { table: 'todos', column: 'user_id' },
      { table: 'page_visits', column: 'user_id' },
      { table: 'user_activity', column: 'user_id' },
      { table: 'private_messages', column: 'recipient_id' },
      { table: 'private_messages', column: 'sender_id' },
      { table: 'user_blocks', column: 'user_id' },
      { table: 'ai_chat_messages', column: 'user_id' },
      { table: 'ai_chat_conversations', column: 'user_id' },
      { table: 'poll_votes', column: 'user_id' },
      { table: 'message_reads', column: 'user_id' },
      { table: 'global_chat_messages', column: 'user_id' },
      { table: 'pomodoro_settings', column: 'user_id' },
      { table: 'video_comments', column: 'user_id' },
      { table: 'video_likes', column: 'user_id' },
      { table: 'videos', column: 'user_id' },
      { table: 'profiles', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
    ];

    for (const { table, column } of tables) {
      await adminClient.from(table).delete().eq(column, user_id);
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      return new Response(JSON.stringify({ error: `Failed to delete auth user: ${deleteError.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
