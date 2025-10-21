# Quick Fix Guide - Recent Changes

## ✅ FIXED: Admin Logout Button

### What Was Done
Made the logout button in the Admin Panel fully functional by connecting it to the authentication system.

**File Changed:** `src/components/admin/AdminDashboard.tsx`

### How to Test
1. Access admin panel
2. Click "Logout" at bottom of sidebar
3. Should redirect to landing page
4. All authentication data cleared

---

## ✅ FIXED: Password Policy Save Error

### What Was Done
Fixed "Authentication required. Please sign in again." error when saving password policy changes.

**File Changed:** `src/services/database.ts`

### How to Test
1. Go to Admin Panel → Settings → Password Policy
2. Change any password requirement
3. Click "Save Changes"
4. Success message appears (no error)

---

## Email Invite Links

### What's the Problem?

When you click links in invite emails, you see: **"You're almost there! In order to see your preview, you need to connect this tab to its project."**

### Why This Happens

The email links are pointing to `localhost` (your computer), not your actual website. Recipients can't access your `localhost`.

## Quick Fix (Choose One)

### Option 1: For Deployed Applications (Recommended)

1. Find your deployed application URL (e.g., `https://myapp.vercel.app` or `https://myapp.com`)

2. Open your `.env` file and update this line:
   ```env
   VITE_APP_URL=https://your-actual-domain.com
   ```

3. Redeploy your application

4. Done! Invite links will now work.

### Option 2: For Local Testing with ngrok

1. Install ngrok from https://ngrok.com/download

2. In terminal 1, start your app:
   ```bash
   npm run dev
   ```

3. In terminal 2, start ngrok:
   ```bash
   ngrok http 5173
   ```

4. Copy the ngrok URL (looks like `https://abc123.ngrok.io`)

5. Update your `.env` file:
   ```env
   VITE_APP_URL=https://abc123.ngrok.io
   ```

6. Restart your app

7. Test invite emails - links should now work!

## How to Test It's Fixed

1. Send yourself a test invite
2. Check your email
3. Click the invite link
4. You should see the invite acceptance page (not an error)

## Still Having Issues?

See `INVITE_LINKS_SETUP.md` for detailed troubleshooting.

## Summary

**Before Fix:**
- Email link: `http://localhost:5173/invite/abc123` ❌
- Result: "Connect to Project" error

**After Fix:**
- Email link: `https://yourdomain.com/invite/abc123` ✅
- Result: Working invite page
