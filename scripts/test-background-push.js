import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;

if (!supabaseUrl) {
  console.error("Missing VITE_SUPABASE_URL in .env");
  process.exit(1);
}

async function testPushNotification() {
  console.log("Waiting 15 seconds so you can LOCK YOUR PHONE or CLOSE THE APP...");
  
  let countdown = 15;
  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      process.stdout.write(`\rSending in ${countdown} seconds...`);
    } else {
      clearInterval(timer);
      process.stdout.write('\n');
    }
  }, 1000);

  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log("Triggering Push Notification Edge Function NOW...");

  const functionUrl = `${supabaseUrl}/functions/v1/send-push`;
  
  // Simulate the payload that the database webhook would send
  const payload = {
    type: "UPDATE",
    record: {
      id: "test-bg-article-" + Date.now(),
      title: "BACKGROUND TEST: You should see this! 🚀",
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
      console.log("Did you receive the notification while your phone was locked/app closed?");
    }
  } catch (error) {
    console.error("❌ Failed to invoke Edge Function:", error);
  }
}

testPushNotification();
