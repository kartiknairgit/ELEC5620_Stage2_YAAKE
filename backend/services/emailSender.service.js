const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.OUTREACH_FROM_EMAIL || 'onboarding@resend.dev';

/**
 * Send email via Resend API
 * @param {Object} emailData - {to, subject, body, replyTo}
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendEmail(emailData) {
  const { to, subject, body, replyTo } = emailData;

  // Validation
  if (!to || !subject || !body) {
    return {
      success: false,
      error: 'Missing required fields: to, subject, or body'
    };
  }

  // Email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return {
      success: false,
      error: 'Invalid recipient email address'
    };
  }

  try {
    // Convert plain text to HTML with proper formatting
    const htmlBody = body
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');

    const emailPayload = {
      from: FROM_EMAIL,
      to: [to],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          ${htmlBody}
          <br>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">
            This email was sent via YAAKE Career Platform
          </p>
        </div>
      `,
      text: body
    };

    // Add reply-to if provided
    if (replyTo && emailRegex.test(replyTo)) {
      emailPayload.reply_to = [replyTo];
    }

    const response = await resend.emails.send(emailPayload);

    if (response.error) {
      console.error('Resend API error:', response.error);
      return {
        success: false,
        error: response.error.message || 'Failed to send email'
      };
    }

    return {
      success: true,
      messageId: response.data?.id || response.id
    };
  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending email'
    };
  }
}

/**
 * Send batch emails with rate limiting
 * @param {Array<Object>} emails - Array of email objects
 * @param {number} delayMs - Delay between emails in milliseconds (default 1000ms)
 * @returns {Promise<Array<{success: boolean, to: string, messageId?: string, error?: string}>>}
 */
async function sendBatchEmails(emails, delayMs = 1000) {
  const results = [];

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const result = await sendEmail(email);

    results.push({
      ...result,
      to: email.to
    });

    // Add delay between emails to avoid rate limiting
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * Validate email configuration
 */
function validateConfig() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured in environment variables');
  }
  if (!process.env.OUTREACH_FROM_EMAIL) {
    console.warn('OUTREACH_FROM_EMAIL not set, using default: outreach@yaake.com');
  }
}

// Validate on module load
try {
  validateConfig();
} catch (error) {
  console.error('Email sender configuration error:', error.message);
}

module.exports = {
  sendEmail,
  sendBatchEmails,
  validateConfig
};
