import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL in .env");
  process.exit(1);
}

async function testPushNotification() {
  console.log("Triggering Push Notification Edge Function...");

  const functionUrl = `${supabaseUrl}/functions/v1/send-push`;
  
  // Simulate the payload that the database webhook would send
  const payload = {
    type: "INSERT",
    record: {
      id: "test-article-" + Date.now(),
      title: "TEST: Push Notifications are Working! 🎉",
      image_url: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=1000&auto=format&fit=crop",
      status: "published"
    }
  };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error("❌ Edge Function returned an error:", result);
    } else {
      console.log("✅ Edge Function executed successfully!");
      console.log("Result:", result);
      console.log("If your browser is subscribed, you should receive a push notification right now.");
    }
  } catch (error) {
    console.error("❌ Failed to invoke Edge Function:", error);
  }
}

testPushNotification();
