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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validate caller
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser(token);
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const { data: isAdmin } = await callerClient.rpc("is_admin", { _user_id: caller.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Target user ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: targetUser, error: targetError } = await adminClient.auth.admin.getUserById(targetUserId);
    if (targetError || !targetUser?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Don't allow impersonating super admins
    const { data: isSuperAdmin } = await adminClient.rpc("is_super_admin", { _user_id: targetUserId });
    if (isSuperAdmin && caller.id !== targetUserId) {
      return new Response(JSON.stringify({ error: "Cannot impersonate super admins" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate magic link and extract the action link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.user.email!,
    });

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ error: "Failed to generate link: " + (linkError?.message || "Unknown") }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The action_link contains the full verification URL - we need to verify it server-side
    // to get a valid session for the target user
    const actionLink = linkData.properties.action_link;
    
    // Extract token from the action link and verify it server-side to get session tokens
    const url = new URL(actionLink);
    const tokenHash = url.searchParams.get("token") || url.hash?.match(/token=([^&]+)/)?.[1];
    const type = url.searchParams.get("type") || "magiclink";
    
    // Use the admin client to verify the OTP immediately (before it expires)
    const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceKey,
      },
      body: JSON.stringify({
        token_hash: tokenHash,
        type: type,
      }),
    });

    if (!verifyResponse.ok) {
      const errBody = await verifyResponse.text();
      return new Response(JSON.stringify({ error: "Verification failed: " + errBody }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionData = await verifyResponse.json();

    return new Response(JSON.stringify({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
