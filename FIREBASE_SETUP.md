# Firebase Setup Guide for ChrisCandle

## Important: You Need Firestore, Not Realtime Database

Your app uses **Firestore Database**, not Realtime Database. The URL you saw (`https://chriscandle-e8cbd-default-rtdb.asia-southeast1.firebasedatabase.app/`) is for Realtime Database, which is different.

## Steps to Enable Firestore:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project: `chriscandle-e8cbd`

2. **Navigate to Firestore Database**
   - In the left sidebar, look for **"Firestore Database"** (not "Realtime Database")
   - Click on it

3. **Create Firestore Database**
   - If you see "Get started" or "Create database", click it
   - Choose a location (e.g., `asia-southeast1` to match your region, or `us-central1`)
   - Select **"Start in test mode"** for development
   - Click **"Enable"**

4. **Wait for Initialization**
   - It may take 1-2 minutes to set up

5. **Verify It's Enabled**
   - You should see an empty Firestore database interface
   - It will show "No collections" - that's normal

## After Enabling Firestore:

1. Refresh your browser
2. Go to `/test` page in your app
3. Click "Test Firebase Connection" again
4. You should see: ✅ Firestore connection successful!

## Note:

- **Realtime Database** = `firebasedatabase.app` (what you saw)
- **Firestore Database** = What your app needs (different service)

You can have both enabled, but your app specifically uses Firestore.

