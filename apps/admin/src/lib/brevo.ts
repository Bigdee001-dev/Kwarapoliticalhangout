/**
 * Brevo (formerly Sendinblue) API Client
 * Used for sending transactional emails and newsletters directly from the frontend
 */

const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = import.meta.env.VITE_BREVO_SENDER_EMAIL || 'admin@kph.ng';
const SENDER_NAME = import.meta.env.VITE_BREVO_SENDER_NAME || 'KPH Admin';

export interface BrevoRecipient {
  email: string;
  name?: string;
}

export interface BrevoEmailPayload {
  subject: string;
  htmlContent: string;
  sender: { name: string; email: string };
  to: BrevoRecipient[];
  replyTo?: { email: string; name: string };
}

export const sendEmail = async (payload: BrevoEmailPayload) => {
  if (!BREVO_API_KEY) {
    throw new Error('Brevo API key not configured (VITE_BREVO_API_KEY)');
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Brevo API Error:', errorData);
    throw new Error(errorData.message || 'Failed to send email via Brevo');
  }

  return await response.json();
};

/**
 * Sends a transactional message to a writer
 */
export const sendMessageToWriter = async (recipientEmail: string, recipientName: string, subject: string, message: string) => {
  return sendEmail({
    subject: subject,
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: recipientEmail, name: recipientName }],
    htmlContent: `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #8B0000; border-bottom: 2px solid #8B0000; padding-bottom: 10px;">Editorial Correspondence</h2>
        <p>Dear ${recipientName},</p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">This is an official message from the ${SENDER_NAME} Editorial Board.</p>
      </div>
    `
  });
};

/**
 * Sends a newsletter to a list of recipients
 */
export const sendNewsletter = async (subject: string, htmlContent: string, recipients: string[]) => {
  // Brevo allows up to 50 recipients in 'to' for a single transactional call, 
  // but for larger lists, we should ideally use their Marketing API or batch them.
  // For now, we'll batch them in groups of 50 if needed.
  
  const batchSize = 50;
  const batches = [];
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }

  const results = await Promise.all(batches.map(batch => 
    sendEmail({
      subject,
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: batch.map(email => ({ email })),
      htmlContent
    })
  ));

  return {
    sentCount: recipients.length,
    batchCount: results.length
  };
};

