import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

/**
 * NOTE: Email functionality has been migrated to Vercel serverless functions.
 * 
 * All email sending is now handled by:
 * - Frontend: src/lib/email.ts (calls /api/sendEmail)
 * - Backend: api/sendEmail.ts (Vercel serverless function)
 * 
 * This file is kept for potential future Firebase Functions that don't involve email.
 * If you need to add new Firebase Functions, add them below.
 */

// Add your Firebase Cloud Functions here if needed in the future
// Example:
// export const myFunction = functions.https.onRequest(async (req, res) => {
//   // Your function logic
// });
