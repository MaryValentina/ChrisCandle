/**
 * Email Service for ChrisCandle
 * 
 * Supports both mock (development) and real email providers:
 * - Vercel (recommended for production - uses serverless functions)
 * - Resend
 * - SendGrid (direct API calls)
 * - Mock mode (development)
 * 
 * Environment variables:
 * - VITE_EMAIL_PROVIDER: 'vercel' | 'resend' | 'sendgrid' | 'mock' (default: 'vercel' in production, 'mock' in dev)
 * - VITE_RESEND_API_KEY: Resend API key (if using Resend)
 * - VITE_SENDGRID_API_KEY: SendGrid API key (if using SendGrid directly)
 * - VITE_EMAIL_FROM: Sender email address
 * 
 * Note: For Vercel provider, SENDGRID_API_KEY must be set in Vercel project environment variables.
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface WelcomeEmailData {
  participantEmail: string
  participantName: string
  eventName: string
  eventCode: string
  eventDate: string
  eventLink: string
}

interface DrawEmailData {
  participantEmail: string
  participantName: string
  receiverName: string
  receiverWishlist?: string[]
  eventName: string
  eventDate: string
  eventLink: string
}

interface ReminderEmailData {
  participantEmail: string
  participantName: string
  eventName: string
  eventDate: string
  eventLink: string
  daysUntil: number
}

interface OrganizerNotificationEmailData {
  organizerEmail: string
  organizerName: string | null
  participantName: string
  participantEmail: string
  eventName: string
  eventCode: string
  totalParticipants: number
  eventLink: string
}

/**
 * Get email configuration from environment variables
 */
function getEmailConfig() {
  // Default to 'vercel' in production, 'mock' in development
  const defaultProvider = import.meta.env.PROD ? 'vercel' : 'mock'
  const provider = import.meta.env.VITE_EMAIL_PROVIDER || defaultProvider
  const fromEmail = import.meta.env.VITE_EMAIL_FROM || 'noreply@chriscandle.com'
  const resendApiKey = import.meta.env.VITE_RESEND_API_KEY
  const sendgridApiKey = import.meta.env.VITE_SENDGRID_API_KEY

  return {
    provider,
    fromEmail,
    resendApiKey,
    sendgridApiKey,
  }
}

/**
 * Send email using the configured provider
 */
async function sendEmail(options: EmailOptions): Promise<void> {
  const config = getEmailConfig()

  // Vercel serverless function (recommended for production)
  if (config.provider === 'vercel') {
    try {
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
          html: options.html,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Vercel API error: ${error.error || response.statusText}`)
      }

      console.log('✅ Email sent via Vercel:', options.to)
    } catch (error) {
      console.error('❌ Error sending email via Vercel:', error)
      throw error
    }
    return
  }

  // Mock mode (development)
  if (config.provider === 'mock') {
    console.log('📧 [Mock Email Service]', {
      to: options.to,
      subject: options.subject,
      html: options.html.substring(0, 100) + '...',
    })
    // Simulate async email sending
    await new Promise((resolve) => setTimeout(resolve, 500))
    return
  }

  // Resend
  if (config.provider === 'resend') {
    if (!config.resendApiKey) {
      throw new Error('VITE_RESEND_API_KEY is required when using Resend')
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.resendApiKey}`,
        },
        body: JSON.stringify({
          from: config.fromEmail,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>/g, ''),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resend API error: ${error.message || response.statusText}`)
      }

      console.log('✅ Email sent via Resend:', options.to)
    } catch (error) {
      console.error('❌ Error sending email via Resend:', error)
      throw error
    }
    return
  }

  // SendGrid
  if (config.provider === 'sendgrid') {
    if (!config.sendgridApiKey) {
      throw new Error('VITE_SENDGRID_API_KEY is required when using SendGrid')
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.sendgridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: { email: config.fromEmail },
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`SendGrid API error: ${error || response.statusText}`)
      }

      console.log('✅ Email sent via SendGrid:', options.to)
    } catch (error) {
      console.error('❌ Error sending email via SendGrid:', error)
      throw error
    }
    return
  }

  throw new Error(`Unknown email provider: ${config.provider}`)
}

/**
 * Generate HTML email template for welcome email
 */
function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to ${data.eventName}!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background: linear-gradient(135deg, #990000 0%, #b30000 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffd700; margin: 0; font-size: 32px;">🎄 ChrisCandle</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 2px solid #990000; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #990000; margin-top: 0;">Welcome to ${data.eventName}, ${data.participantName}!</h2>
        <p>Great news! You've successfully joined the Secret Santa event:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #990000;">
          <strong style="color: #990000; font-size: 18px;">${data.eventName}</strong>
          <p style="margin: 10px 0 0 0; color: #666;">📅 Exchange Date: ${new Date(data.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <p>Your event code is: <strong style="font-size: 20px; color: #990000; font-family: monospace;">${data.eventCode}</strong></p>
        <p>You can view the event and check your status anytime:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventLink}" style="display: inline-block; background: #228B22; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Event
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          We'll notify you when the draw happens and reveal your Secret Santa match! 🎁
        </p>
        <p style="color: #666; font-size: 14px;">
          Happy Holidays! 🎄
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This email was sent by ChrisCandle Secret Santa Organizer</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email template for draw completion email
 */
function generateDrawEmailHTML(data: DrawEmailData): string {
  const wishlistHTML = data.receiverWishlist && data.receiverWishlist.length > 0
    ? `
      <div style="background: #fff8dc; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <h3 style="color: #f59e0b; margin-top: 0;">🎁 Wishlist:</h3>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${data.receiverWishlist.map(item => `<li style="margin: 5px 0;">${item}</li>`).join('')}
        </ul>
      </div>
    `
    : '<p style="color: #666;">No wishlist provided, but any thoughtful gift will be appreciated! 🎁</p>'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Secret Santa Match - ${data.eventName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background: linear-gradient(135deg, #990000 0%, #b30000 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffd700; margin: 0; font-size: 32px;">🎄 ChrisCandle</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 2px solid #990000; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #990000; margin-top: 0; text-align: center;">🎉 The Draw is Complete!</h2>
        <p>Hi ${data.participantName},</p>
        <p>The Secret Santa draw for <strong>${data.eventName}</strong> has been completed!</p>
        <div style="background: linear-gradient(135deg, #228B22 0%, #32CD32 100%); padding: 30px; border-radius: 10px; margin: 30px 0; text-align: center; color: white;">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">Your Secret Santa is...</h3>
          <div style="font-size: 36px; font-weight: bold; margin: 20px 0;">${data.receiverName}!</div>
          <div style="font-size: 48px; margin: 10px 0;">🎁</div>
        </div>
        ${wishlistHTML}
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; color: #666;"><strong>Event:</strong> ${data.eventName}</p>
          <p style="margin: 10px 0 0 0; color: #666;"><strong>Exchange Date:</strong> ${new Date(data.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventLink}" style="display: inline-block; background: #990000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Full Details
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Happy gifting! 🎄
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This email was sent by ChrisCandle Secret Santa Organizer</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email template for organizer notification email
 */
function generateOrganizerNotificationEmailHTML(data: OrganizerNotificationEmailData): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Participant Joined - ${data.eventName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background: linear-gradient(135deg, #990000 0%, #b30000 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffd700; margin: 0; font-size: 32px;">🎄 ChrisCandle</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 2px solid #990000; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #990000; margin-top: 0;">🎉 New Participant Joined!</h2>
        <p>Hi ${data.organizerName || 'Organizer'},</p>
        <p>Great news! A new participant has joined your Secret Santa event.</p>
        
        <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #228B22;">
          <h3 style="color: #228B22; margin-top: 0;">New Participant</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${data.participantName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${data.participantEmail}</p>
        </div>

        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Event:</strong> ${data.eventName}</p>
          <p style="margin: 5px 0;"><strong>Total Participants:</strong> ${data.totalParticipants}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventLink}" style="display: inline-block; background: #990000; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Event Dashboard
          </a>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          You can manage participants and run the draw from your admin dashboard.
        </p>
        <p style="color: #666; font-size: 14px;">
          Happy organizing! 🎄
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This email was sent by ChrisCandle Secret Santa app.</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generate HTML email template for reminder email
 */
function generateReminderEmailHTML(data: ReminderEmailData): string {
  const timeText = data.daysUntil === 1 ? 'tomorrow' : `in ${data.daysUntil} days`
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reminder: ${data.eventName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
      <div style="background: linear-gradient(135deg, #990000 0%, #b30000 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: #ffd700; margin: 0; font-size: 32px;">🎄 ChrisCandle</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 2px solid #990000; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #990000; margin-top: 0;">⏰ Friendly Reminder</h2>
        <p>Hi ${data.participantName},</p>
        <p>Just a friendly reminder that your Secret Santa gift exchange is ${timeText}!</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #990000;">
          <strong style="color: #990000; font-size: 18px;">${data.eventName}</strong>
          <p style="margin: 10px 0 0 0; color: #666;">📅 ${new Date(data.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>
        ${data.daysUntil === 1 ? '<p style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b; color: #856404;"><strong>⏰ Last chance!</strong> Make sure your gift is ready for tomorrow!</p>' : ''}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.eventLink}" style="display: inline-block; background: #228B22; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            View Event Details
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Happy Holidays! 🎁
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>This email was sent by ChrisCandle Secret Santa Organizer</p>
      </div>
    </body>
    </html>
  `
}

/**
 * Send welcome email when participant joins
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const html = generateWelcomeEmailHTML(data)
    await sendEmail({
      to: data.participantEmail,
      subject: `Welcome to ${data.eventName}! 🎄`,
      html,
    })
    console.log('✅ Welcome email sent to:', data.participantEmail)
  } catch (error) {
    console.error('❌ Error sending welcome email:', error)
    throw error
  }
}

/**
 * Send draw completion email with match
 */
export async function sendDrawEmail(data: DrawEmailData): Promise<void> {
  try {
    const html = generateDrawEmailHTML(data)
    await sendEmail({
      to: data.participantEmail,
      subject: `Your Secret Santa is ${data.receiverName}! 🎁`,
      html,
    })
    console.log('✅ Draw email sent to:', data.participantEmail)
  } catch (error) {
    console.error('❌ Error sending draw email:', error)
    throw error
  }
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  try {
    const html = generateReminderEmailHTML(data)
    const subject = data.daysUntil === 1
      ? `Last Chance! ${data.eventName} is Tomorrow! ⏰`
      : `Reminder: ${data.eventName} in ${data.daysUntil} Days ⏰`
    
    await sendEmail({
      to: data.participantEmail,
      subject,
      html,
    })
    console.log('✅ Reminder email sent to:', data.participantEmail)
  } catch (error) {
    console.error('❌ Error sending reminder email:', error)
    throw error
  }
}

/**
 * Send notification email to organizer when a new participant joins
 */
export async function sendOrganizerNotificationEmail(data: OrganizerNotificationEmailData): Promise<void> {
  try {
    const html = generateOrganizerNotificationEmailHTML(data)
    await sendEmail({
      to: data.organizerEmail,
      subject: `🎉 New participant joined ${data.eventName}`,
      html,
    })
    console.log('✅ Organizer notification email sent to:', data.organizerEmail)
  } catch (error) {
    console.error('❌ Error sending organizer notification email:', error)
    throw error
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendWelcomeEmail instead
 */
export async function sendParticipantConfirmationEmail(
  participantEmail: string,
  participantName: string,
  eventName: string,
  eventCode: string
): Promise<void> {
  const eventLink = `${window.location.origin}/event/${eventCode}`
  await sendWelcomeEmail({
    participantEmail,
    participantName,
    eventName,
    eventCode,
    eventDate: new Date().toISOString(), // Fallback date
    eventLink,
  })
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use sendDrawEmail instead
 */
export async function sendAssignmentEmail(
  participantEmail: string,
  participantName: string,
  receiverName: string,
  receiverWishlist?: string[],
  eventName: string = 'Secret Santa'
): Promise<void> {
  const eventLink = `${window.location.origin}`
  await sendDrawEmail({
    participantEmail,
    participantName,
    receiverName,
    receiverWishlist,
    eventName,
    eventDate: new Date().toISOString(), // Fallback date
    eventLink,
  })
}
