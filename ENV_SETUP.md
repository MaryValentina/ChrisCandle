# Firebase Environment Variables Setup

## Quick Fix for Environment Variables Not Loading

If your `.env.local` file exists but Firebase still says it's missing:

### 1. Verify your `.env.local` file format

Make sure your `.env.local` file in the project root looks like this:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:**
- ✅ All variables MUST start with `VITE_` prefix
- ✅ No spaces around the `=` sign
- ✅ No quotes needed (unless the value contains spaces)
- ✅ File must be in the project root (same folder as `package.json`)

### 2. Restart the Dev Server

**Vite requires a restart to load environment variables:**

1. Stop the current dev server (Ctrl+C in terminal)
2. Start it again: `npm run dev`
3. Hard refresh the browser (Ctrl+Shift+R)

### 3. Check the Console

After restarting, check the browser console. You should see:
```
🔍 Firebase Config Check:
  - API Key: AIzaSyC...
  - Auth Domain: your-project.firebaseapp.com
  - Project ID: your-project-id
```

If you still see "MISSING", double-check:
- File is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- File is in the project root directory
- Variables start with `VITE_`
- No typos in variable names

### 4. Alternative: Use `.env` file

If `.env.local` doesn't work, try creating a `.env` file instead (but remember to add it to `.gitignore` if it contains secrets).

