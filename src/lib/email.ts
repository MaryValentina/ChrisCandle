/**
 * Email Service
 * 
 * Placeholder for email functionality.
 * In production, this would integrate with an email service like:
 * - SendGrid
 * - AWS SES
 * - Firebase Cloud Functions with Nodemailer
 * - Resend
 * - Mailgun
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send a confirmation email to a participant
 * 
 * @param participantEmail - Email address of the participant
 * @param participantName - Name of the participant
 * @param eventName - Name of the Secret Santa event
 * @param eventCode - Event code for joining
 * @returns Promise that resolves when email is sent (or queued)
 */
export async function sendParticipantConfirmationEmail(
  participantEmail: string,
  participantName: string,
  eventName: string,
  eventCode: string
): Promise<void> {
  // TODO: Implement actual email sending
  // For now, just log the email details
  console.log('📧 [Email Service] Would send confirmation email:', {
    to: participantEmail,
    subject: `You're in! ${eventName} - Secret Santa Confirmation`,
    participantName,
    eventName,
    eventCode,
  })

  // In production, this would call an email service API
  // Example:
  // await fetch('/api/send-email', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: participantEmail,
  //     subject: `You're in! ${eventName} - Secret Santa Confirmation`,
  //     html: generateEmailHTML(participantName, eventName, eventCode),
  //   }),
  // })

  // Simulate async email sending
  await new Promise((resolve) => setTimeout(resolve, 500))
}

/**
 * Generate HTML email template for participant confirmation
 * (For future use when implementing actual email sending)
 */
function generateEmailHTML(
  participantName: string,
  eventName: string,
  eventCode: string
): string {
  const eventLink = `${window.location.origin}/event/${eventCode}`
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secret Santa Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #990000 0%, #b30000 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffd700; margin: 0; font-size: 32px;">🎄 ChrisCandle</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 2px solid #990000; border-top: none; border-radius: 0 0 10px 10px;">
          <h2 style="color: #990000; margin-top: 0;">You're In, ${participantName}!</h2>
          <p>Great news! You've successfully joined the Secret Santa event:</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong style="color: #990000; font-size: 18px;">${eventName}</strong>
          </div>
          <p>Your event code is: <strong style="font-size: 20px; color: #990000;">${eventCode}</strong></p>
          <p>You can view the event and check your status anytime:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${eventLink}" style="display: inline-block; background: #228B22; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Event
            </a>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Happy gifting! 🎁
          </p>
        </div>
      </body>
    </html>
  `
}

/**
 * Send assignment reveal email to a participant
 * (For future use when implementing assignment notifications)
 */
export async function sendAssignmentEmail(
  participantEmail: string,
  participantName: string,
  receiverName: string,
  receiverWishlist?: string[],
  eventName: string
): Promise<void> {
  // TODO: Implement actual email sending
  console.log('📧 [Email Service] Would send assignment email:', {
    to: participantEmail,
    subject: `Your Secret Santa Assignment - ${eventName}`,
    participantName,
    receiverName,
    receiverWishlist,
    eventName,
  })

  await new Promise((resolve) => setTimeout(resolve, 500))
}

