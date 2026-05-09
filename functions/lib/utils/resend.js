"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const logger_1 = require("./logger");
async function sendEmail(options) {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SENDER_EMAIL;
    const senderName = process.env.SENDER_NAME;
    if (!apiKey || apiKey.includes('YOUR_API_KEY_HERE')) {
        const errorMsg = 'BREVO_API_KEY is not set or invalid';
        await logger_1.logger.log('high', errorMsg);
        return { error: errorMsg };
    }
    const recipients = Array.isArray(options.to) ? options.to.map(email => ({ email })) : [{ email: options.to }];
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: {
                    name: senderName,
                    email: senderEmail
                },
                to: recipients,
                subject: options.subject,
                htmlContent: options.html,
                textContent: options.text || options.subject.replace(/<[^>]*>/g, ''),
                replyTo: options.replyTo ? { email: options.replyTo } : undefined
            })
        });
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            }
            catch (e) {
                errorData = await response.text();
            }
            const statusText = response.statusText || `Status ${response.status}`;
            await logger_1.logger.log('medium', `Brevo Email Error: ${statusText}`, { errorData, options });
            return { error: `Brevo API Error: ${statusText}`, details: errorData };
        }
        const data = await response.json();
        return { success: true, data };
    }
    catch (err) {
        const errorMsg = `Failed to send email via Brevo: ${err.message}`;
        await logger_1.logger.log('medium', errorMsg, { err, options });
        return { error: errorMsg };
    }
}
exports.sendEmail = sendEmail;
//# sourceMappingURL=resend.js.map