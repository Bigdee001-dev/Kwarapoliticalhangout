// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BGHOjr5JR4YA3uKvS1kj0G84dM_JcoYzYJb4aGIs_blqLhI_O4aST-ToiG-_kqD5u7JS0d5B16KrAB84RWucBA8';
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:abdulrahmanadebambo@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

serve(async (req: Request) => {
  // Webhook payload from Supabase
  let payload: any;
  try {
    payload = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
  }

  // Only trigger on INSERT (new article) or UPDATE to published
  // Webhook payload structure: { type: 'INSERT', record: { ... } }
  const record = payload.record;
  
  if (!record || record.status !== 'published') {
    return new Response(JSON.stringify({ message: 'Not a newly published article, skipping push.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured in Edge Function environment' }), { status: 500 });
  }

  // Initialize Supabase Client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch all subscriptions
  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (error || !subscriptions) {
    return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), { status: 500 });
  }

  const notificationPayload = JSON.stringify({
    title: 'Latest News from KPH',
    body: record.title || 'A new article has been published!',
    url: `/article/${record.id}`
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSubscription, notificationPayload);
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  // Ideally, you would delete the rejected subscriptions here (e.g. 410 Gone) from Supabase.
  
  return new Response(
    JSON.stringify({ message: 'Notifications sent', successful, failed }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
