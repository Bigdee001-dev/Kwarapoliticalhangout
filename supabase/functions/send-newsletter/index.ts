
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!BREVO_API_KEY) {
      throw new Error('BREVO_API_KEY is not set in Supabase Secrets')
    }

    const { subject, htmlContent, recipients, senderName, senderEmail } = await req.json()

    if (!subject || !htmlContent || !recipients || !Array.isArray(recipients)) {
      throw new Error('Missing required fields: subject, htmlContent, or recipients array')
    }

    console.log(`Sending newsletter: "${subject}" to ${recipients.length} recipients.`)

    // We send to all recipients in one go via Brevo's 'to' array
    // Brevo transactional API supports multiple recipients
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
          name: senderName || 'KPH Updates', 
          email: senderEmail || 'new@kwarapoliticalhangout.com.ng' 
        },
        to: recipients.map(email => ({ email })),
        subject: subject,
        htmlContent: htmlContent
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Brevo API Error:', result)
      throw new Error(result.message || 'Failed to send email via Brevo')
    }

    return new Response(
      JSON.stringify({ success: true, data: result, sentCount: recipients.length }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
