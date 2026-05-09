import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const privateKey = Deno.env.get('IMAGEKIT_PRIVATE_KEY');
    if (!privateKey) throw new Error('Missing IMAGEKIT_PRIVATE_KEY');

    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 60 * 30; // 30 mins
    const signatureString = token + expire;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(privateKey),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"]
    );

    const signatureBuf = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signatureString)
    );

    const signature = Array.from(new Uint8Array(signatureBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return new Response(
      JSON.stringify({ token, expire, signature }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
