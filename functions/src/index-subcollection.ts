/**
 * ALTERNATIVE IMPLEMENTATION: Using Subcollections
 * 
 * This version uses the subcollection approach: events/{eventId}/participants/{participantId}
 * To use this, you'll need to refactor your addParticipant function to write to subcollections
 * instead of updating the participants array.
 * 
 * To switch to this implementation:
 * 1. Rename this file to index.ts (backup the current index.ts first)
 * 2. Refactor addParticipant in src/lib/firebase.ts to write to subcollections
 * 3. Keep the participants array for backward compatibility or remove it
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize SendGrid
const sendgridApiKey = functions.config().sendgrid?.key;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
} else {
  console.warn("⚠️ SendGrid API key not configured. Email functions will not work.");
}

/**
 * Helper function to get event organizer email
 */
async function getOrganizerEmail(eventId: string): Promise<string | null> {
  try {
    const eventDoc = await admin.firestore().collection("events").doc(eventId).get();
    if (!eventDoc.exists) {
      return null;
    }

    const eventData = eventDoc.data();
    const organizerId = eventData?.organizerId;

    if (!organizerId) {
      return null;
    }

    // Get organizer user document
    const userDoc = await admin.firestore().collection("users").doc(organizerId).get();
    if (userDoc.exists) {
      return userDoc.data()?.email || null;
    }

    // Fallback: try to get from auth
    try {
      const userRecord = await admin.auth().getUser(organizerId);
      return userRecord.email || null;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error getting organizer email:", error);
    return null;
  }
}

/**
 * Send welcome email to participant
 */
async function sendWelcomeEmail(
  participantEmail: string,
  participantName: string,
  eventName: string,
  eventDate: string,
  eventBudget: number | undefined,
  eventCode: string
): Promise<void> {
  if (!sendgridApiKey) {
    console.log("📧 [MOCK] Welcome email would be sent to:", participantEmail);
    return;
  }

  const eventLink = `https://your-domain.com/event/${eventCode}`;
  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #c41e3a; }
          .event-info { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .button { display: inline-block; background: #228B22; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎄 Welcome to ${eventName}!</h1>
          <p>Hi ${participantName},</p>
          <p>You've successfully joined the Secret Santa event! We're excited to have you participate.</p>
          
          <div class="event-info">
            <h2>Event Details</h2>
            <p><strong>Event:</strong> ${eventName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            ${eventBudget ? `<p><strong>Budget:</strong> $${eventBudget}</p>` : ""}
            <p><strong>Event Code:</strong> <code>${eventCode}</code></p>
          </div>

          <p><strong>💡 Don't forget to add your wishlist!</strong> You can update it anytime before the draw happens.</p>

          <a href="${eventLink}" class="button">View Event & Add Wishlist</a>

          <p>We'll notify you once the organizer runs the draw and you'll receive your Secret Santa match!</p>

          <p>Happy gifting! 🎁</p>
          <p>The ChrisCandle Team</p>

          <div class="footer">
            <p>This is an automated email from ChrisCandle Secret Santa app.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to ${eventName}!

Hi ${participantName},

You've successfully joined the Secret Santa event! We're excited to have you participate.

Event Details:
- Event: ${eventName}
- Date: ${formattedDate}
${eventBudget ? `- Budget: $${eventBudget}` : ""}
- Event Code: ${eventCode}

Don't forget to add your wishlist! You can update it anytime before the draw happens.

View your event: ${eventLink}

We'll notify you once the organizer runs the draw and you'll receive your Secret Santa match!

Happy gifting!
The ChrisCandle Team
  `;

  const msg = {
    to: participantEmail,
    from: functions.config().sendgrid?.from || "noreply@chriscandle.com",
    subject: `🎄 Welcome to ${eventName}!`,
    text: text,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${participantEmail}`);
  } catch (error) {
    console.error(`❌ Error sending welcome email to ${participantEmail}:`, error);
    throw error;
  }
}

/**
 * Send notification email to organizer
 */
async function sendOrganizerNotificationEmail(
  organizerEmail: string,
  organizerName: string | null,
  participantName: string,
  participantEmail: string,
  eventName: string,
  eventCode: string,
  totalParticipants: number
): Promise<void> {
  if (!sendgridApiKey) {
    console.log("📧 [MOCK] Organizer notification email would be sent to:", organizerEmail);
    return;
  }

  const eventLink = `https://your-domain.com/event/${eventCode}/admin`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          h1 { color: #c41e3a; }
          .participant-info { background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #228B22; }
          .button { display: inline-block; background: #c41e3a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 New Participant Joined!</h1>
          <p>Hi ${organizerName || "Organizer"},</p>
          <p>Great news! A new participant has joined your Secret Santa event.</p>
          
          <div class="participant-info">
            <h2>New Participant</h2>
            <p><strong>Name:</strong> ${participantName}</p>
            <p><strong>Email:</strong> ${participantEmail}</p>
          </div>

          <p><strong>Event:</strong> ${eventName}</p>
          <p><strong>Total Participants:</strong> ${totalParticipants}</p>

          <a href="${eventLink}" class="button">View Event Dashboard</a>

          <p>You can manage participants and run the draw from your admin dashboard.</p>

          <p>Happy organizing! 🎄</p>
          <p>The ChrisCandle Team</p>

          <div class="footer">
            <p>This is an automated email from ChrisCandle Secret Santa app.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Participant Joined!

Hi ${organizerName || "Organizer"},

Great news! A new participant has joined your Secret Santa event.

New Participant:
- Name: ${participantName}
- Email: ${participantEmail}

Event: ${eventName}
Total Participants: ${totalParticipants}

View your event dashboard: ${eventLink}

You can manage participants and run the draw from your admin dashboard.

Happy organizing!
The ChrisCandle Team
  `;

  const msg = {
    to: organizerEmail,
    from: functions.config().sendgrid?.from || "noreply@chriscandle.com",
    subject: `🎉 New participant joined ${eventName}`,
    text: text,
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Organizer notification email sent to ${organizerEmail}`);
  } catch (error) {
    console.error(`❌ Error sending organizer notification email to ${organizerEmail}:`, error);
    throw error;
  }
}

/**
 * Cloud Function: Triggered when a new participant document is created
 * 
 * This uses the subcollection approach: events/{eventId}/participants/{participantId}
 * 
 * To use this, refactor addParticipant to write to subcollections:
 * 
 * ```typescript
 * // In src/lib/firebase.ts
 * export async function addParticipant(eventId: string, participant: ParticipantData): Promise<void> {
 *   const db = getDb()
 *   if (!db) throw new Error('Firebase not configured')
 * 
 *   // Write to subcollection
 *   const participantsRef = collection(db, 'events', eventId, 'participants')
 *   const participantId = uuidv4()
 *   await addDoc(participantsRef, {
 *     ...participant,
 *     id: participantId,
 *     eventId,
 *     joinedAt: serverTimestamp(),
 *   })
 * 
 *   // Optionally also update the array for backward compatibility
 *   // or remove the array entirely
 * }
 * ```
 */
export const onParticipantJoined = functions.firestore
  .document("events/{eventId}/participants/{participantId}")
  .onCreate(async (snapshot, context) => {
    const eventId = context.params.eventId;
    const participantId = context.params.participantId;
    const participantData = snapshot.data();

    console.log(
      `📧 New participant ${participantId} joined event ${eventId}`
    );

    const participantEmail = participantData?.email;
    const participantName = participantData?.name;

    // Skip if no email
    if (!participantEmail) {
      console.log(
        `⚠️ Skipping email for participant ${participantName} (no email)`
      );
      return null;
    }

    // Skip if this is the organizer
    if (participantData?.isOrganizer) {
      console.log(
        `⚠️ Skipping email for organizer ${participantName}`
      );
      return null;
    }

    try {
      // Get event data
      const eventDoc = await admin
        .firestore()
        .collection("events")
        .doc(eventId)
        .get();

      if (!eventDoc.exists) {
        console.error(`Event ${eventId} not found`);
        return null;
      }

      const eventData = eventDoc.data();
      const eventName = eventData?.name || "Secret Santa Event";
      const eventDate = eventData?.date || "";
      const eventBudget = eventData?.budget;
      const eventCode = eventData?.code || "";

      // Get total participant count
      const participantsSnapshot = await admin
        .firestore()
        .collection("events")
        .doc(eventId)
        .collection("participants")
        .get();
      const totalParticipants = participantsSnapshot.size;

      // Send welcome email to participant
      await sendWelcomeEmail(
        participantEmail,
        participantName,
        eventName,
        eventDate,
        eventBudget,
        eventCode
      );

      // Get organizer email and send notification
      const organizerEmail = await getOrganizerEmail(eventId);
      if (organizerEmail) {
        // Get organizer name
        const organizerDoc = await admin
          .firestore()
          .collection("users")
          .doc(eventData?.organizerId)
          .get();
        const organizerName = organizerDoc.data()?.name || null;

        await sendOrganizerNotificationEmail(
          organizerEmail,
          organizerName,
          participantName,
          participantEmail,
          eventName,
          eventCode,
          totalParticipants
        );
      } else {
        console.warn(`⚠️ Could not find organizer email for event ${eventId}`);
      }

      console.log(`✅ Finished processing emails for participant ${participantId}`);
    } catch (error) {
      console.error(
        `❌ Error processing emails for participant ${participantId}:`,
        error
      );
      throw error;
    }

    return null;
  });
