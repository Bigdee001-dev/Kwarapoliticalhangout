// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BD4hieXXHqTJSFaRG4ZYHqw1Xik5ULgskgUHZsXxe03NyEot4KGgVxsr-goj-mIoie4MhS7RlOY4A-nNnMSpgxI';
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

  // Secret WIPE command
  if (record.title === 'WIPE_SUBSCRIPTIONS') {
    await supabase.from('push_subscriptions').delete().neq('endpoint', 'none');
    return new Response(JSON.stringify({ message: 'Wiped all subscriptions successfully' }), { headers: { 'Content-Type': 'application/json' } });
  }

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
    icon: '/logo192.png',
    image: record.image_url || record.imageUrl || undefined,
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
  const failedResults = results.filter((r) => r.status === 'rejected');
  const failed = failedResults.length;
  
  const errorDetails = failedResults.map((r: any) => {
    if (r.reason && r.reason.statusCode) {
      return `HTTP ${r.reason.statusCode}: ${r.reason.body}`;
    }
    return r.reason?.message || r.reason?.toString() || 'Unknown error';
  });

  // Ideally, you would delete the rejected subscriptions here (e.g. 410 Gone) from Supabase.
  
  return new Response(
    JSON.stringify({ message: 'Notifications sent', successful, failed, errors: errorDetails }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
