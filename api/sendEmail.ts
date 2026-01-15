/**
 * Vercel Serverless Function for sending emails via SendGrid
 * 
 * Environment Variables Required (set in Vercel Dashboard):
 * - SENDGRID_API_KEY: Your SendGrid API key
 * - SENDGRID_FROM_EMAIL: Sender email address (optional, defaults to mvalentina1990@outlook.com)
 * 
 * Usage:
 * POST /api/sendEmail
 * Body: { to: string, subject: string, text: string, html: string }
 * 
 * Returns: { success: true } or { error: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// Verified sender email in SendGrid: mvalentina1990@outlook.com
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'mvalentina1990@outlook.com';

// Validate API key is present
if (!SENDGRID_API_KEY) {
  throw new Error('Missing SENDGRID_API_KEY in environment variables');
}

// Initialize SendGrid with API key
sgMail.setApiKey(SENDGRID_API_KEY);

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Check if SendGrid API key is configured
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY is not configured');
    return response.status(500).json({ 
      error: 'Email service is not configured. Please set SENDGRID_API_KEY in Vercel environment variables.' 
    });
  }

  // Validate request body
  const { to, subject, text, html } = request.body;

  if (!to || !subject || !html) {
    return response.status(400).json({ 
      error: 'Missing required fields: to, subject, and html are required.' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    return response.status(400).json({ error: 'Invalid email address format.' });
  }

  try {
    // Prepare email message
    const msg = {
      to,
      from: SENDGRID_FROM_EMAIL,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
      html,
    };

    // Send email via SendGrid
    await sgMail.send(msg);
    
    console.log(`✅ Email sent successfully to ${to}`);
    
    return response.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    
    // Handle SendGrid-specific errors
    if (error.response) {
      const { body, statusCode } = error.response;
      console.error('SendGrid API error:', { statusCode, body });
      return response.status(500).json({ 
        error: `SendGrid API error: ${body?.errors?.[0]?.message || 'Unknown error'}` 
      });
    }
    
    return response.status(500).json({ 
      error: error.message || 'Failed to send email' 
    });
  }
}
