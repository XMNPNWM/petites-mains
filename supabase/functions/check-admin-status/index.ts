
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-ADMIN-STATUS] ${step}${detailsStr}`);
};

// Admin emails list - loaded from Supabase secrets
const getAdminEmails = async (): Promise<string[]> => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );
    
    const { data, error } = await supabaseClient.functions.invoke('get-secret', {
      body: { name: 'ADMIN_EMAILS' }
    });
    
    if (error) {
      console.warn('Failed to load admin emails from secrets, using fallback');
      return ["xmnp306@tutanota.com"]; // Fallback for safety
    }
    
    // Expect comma-separated emails
    const emails = data?.value?.split(',').map((email: string) => email.trim()) || [];
    return emails.length > 0 ? emails : ["xmnp306@tutanota.com"];
  } catch (error) {
    console.warn('Error loading admin emails:', error);
    return ["xmnp306@tutanota.com"]; // Fallback for safety
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user email is in admin list
    const adminEmails = await getAdminEmails();
    const isAdmin = adminEmails.includes(user.email);
    logStep("Admin status checked", { email: user.email, isAdmin, adminEmails: adminEmails.length });

    return new Response(JSON.stringify({
      isAdmin,
      email: user.email
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-admin-status", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, isAdmin: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
