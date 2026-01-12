# Firebase Setup Guide

This guide will help you set up Firebase Authentication and Firestore for ChrisCandle.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Follow the setup wizard:
   - Enter a project name (e.g., "ChrisCandle")
   - Enable/disable Google Analytics (optional)
   - Click **"Create project"**

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **"Get started"**
3. Click on the **"Sign-in method"** tab
4. Enable **"Email/Password"**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**

## Step 3: Create a Firestore Database

**If you already have a Firestore database:** ✅ You can skip this step and use your existing database.

**If you don't have a database yet:**

1. Go to **Firestore Database** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
   - ⚠️ **Important**: For production, you'll need to set up proper security rules
4. Select a location for your database (choose the closest to your users)
5. Click **"Enable"**

## Step 4: Get Your Firebase Configuration

1. In Firebase Console, click the **gear icon** ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. If you don't have a web app yet:
   - Click the **</>** (Web) icon
   - Register your app with a nickname (e.g., "ChrisCandle Web")
   - Click **"Register app"**
5. Copy the **firebaseConfig** object values:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```

## Step 5: Create `.env.local` File

1. In your project root directory, create a file named `.env.local`
2. Copy the following template and fill in your Firebase values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Email Configuration (Optional - defaults to mock mode)
# VITE_EMAIL_PROVIDER=mock
# VITE_EMAIL_FROM=noreply@chriscandle.com
```

**Example:**
```env
VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
VITE_FIREBASE_AUTH_DOMAIN=chriscandle-12345.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=chriscandle-12345
VITE_FIREBASE_STORAGE_BUCKET=chriscandle-12345.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## Step 6: Restart Your Dev Server

After creating `.env.local`:

1. **Stop** your current dev server (Ctrl+C)
2. **Restart** it with `npm run dev`
3. The environment variables will now be loaded

## Step 7: Test Authentication

1. Go to the Sign Up page (`/signup`)
2. Create a test account
3. You should be able to sign up and log in successfully

## Troubleshooting

### Error: "auth/configuration-not-found"
- ✅ Make sure `.env.local` exists in the project root (same folder as `package.json`)
- ✅ Make sure all environment variables start with `VITE_`
- ✅ Restart your dev server after creating/updating `.env.local`
- ✅ Check the browser console for Firebase config debug logs

### Error: "Firebase Auth is not configured"
- ✅ Verify your `.env.local` file has all required variables
- ✅ Check that variable names match exactly (case-sensitive)
- ✅ Make sure there are no extra spaces or quotes around values

### Still Not Working?
1. Open browser console (F12)
2. Look for the "🔍 Firebase Config Check" log
3. Verify that all values show (not "MISSING")
4. If values are missing, double-check your `.env.local` file

## Security Rules (For Production)

Before deploying to production, set up Firestore security rules:

1. Go to **Firestore Database** > **Rules**
2. Replace with proper rules (example below):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Events: organizers can read/write their own events
    match /events/{eventId} {
      allow read: if true; // Public read for event pages
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.organizerId == request.auth.uid;
    }
    
    // Assignments: only organizers can read all, participants can read their own
    match /events/{eventId}/assignments/{assignmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/events/$(eventId)).data.organizerId == request.auth.uid;
    }
  }
}
```

## Next StepsOnce Firebase is configured:
- ✅ You can sign up and log in
- ✅ Create events as an organizer
- ✅ Participants can join events with codes
- ✅ Run Secret Santa draws
- ✅ View assignments and resultsHappy coding! 🎄
