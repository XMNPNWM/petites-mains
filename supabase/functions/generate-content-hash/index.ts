import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHash } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HashRequest {
  content?: string;
  contents?: string[]; // For batch processing
}

interface HashResponse {
  hash?: string;
  hashes?: string[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: HashRequest = await req.json();
    
    // Single content hash generation
    if (body.content) {
      const hash = createHash('sha256')
        .update(body.content.trim())
        .digest('hex');
      
      const response: HashResponse = { hash };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Batch content hash generation
    if (body.contents && Array.isArray(body.contents)) {
      const hashes = body.contents.map(content => 
        createHash('sha256')
          .update(content.trim())
          .digest('hex')
      );
      
      const response: HashResponse = { hashes };
      
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Invalid request
    const response: HashResponse = { 
      error: 'Missing content or contents field in request body' 
    };
    
    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in generate-content-hash function:', error);
    
    const response: HashResponse = { 
      error: error.message || 'Internal server error' 
    };
    
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});