# Quick Start: Email Confirmation

## TL;DR - What You Need to Do Right Now

Your application code is ready. The email confirmation system is fully implemented. However, **Supabase must be configured correctly** for it to work.

## Critical: Fix Supabase Configuration

### The Problem

Users are currently being auto-confirmed immediately after signup (confirmed_at = created_at), bypassing email verification. This means:
- No confirmation emails are required
- Users can log in without verifying email
- The verification screen never shows

### The Solution (5 minutes)

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to**: Authentication → Providers → Email
3. **Toggle OFF "Confirm Email"**, then click Save
4. **Toggle ON "Confirm Email"**, then click Save again
5. **Restart Supabase**: Project Settings → General → Restart project

### Why This Works

Sometimes the "Confirm Email" setting doesn't save properly or gets cached. Toggling it off and back on forces Supabase to apply the configuration.

## Test It Works

### Quick Test (2 minutes)

1. Sign up with a **real email you can access**: `youremail@example.com`

2. **Check the database**:
   ```sql
   SELECT email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'youremail@example.com';
   ```

3. **Expected result**:
   - `email_confirmed_at`: **NULL** ✅ (this is correct!)
   - If it has a timestamp: Configuration didn't work, try again

4. **Check your email** for the confirmation link

5. **Click the link** and verify you're logged in automatically

## What Happens After Configuration

### For Users Signing Up

1. User fills out signup form
2. Sees "Check Your Email" screen with instructions
3. Receives confirmation email within 2-5 minutes
4. Clicks link in email
5. Automatically logged in and redirected to dashboard

### Verification Screen Features

Users will see:
- Clear instructions on what to do
- Their email address
- "I've Verified My Email" button (manual check)
- "Resend Confirmation Email" button (60-second cooldown)
- Auto-checking every 5 seconds
- Helpful troubleshooting tips

### Security

- Unverified users **cannot access anything**
- No session created until email is confirmed
- Confirmation links expire after 24 hours
- One-time use tokens

## Email Configuration

### Current Setup

Your app is configured to use:
- **Domain**: archetypes.consciousbrands.co
- **Redirect URL**: https://archetypes.consciousbrands.co/auth/confirm

### Email Provider Options

**Development (Built-in)**:
- Uses Supabase's email service
- No configuration needed
- May have deliverability issues

**Production (Recommended)**:
- Configure custom SMTP in Supabase
- Better deliverability
- Professional sender address

To configure custom SMTP:
1. Go to: Project Settings → Auth → SMTP Settings
2. Enter your email provider details (Resend, SendGrid, etc.)
3. Test email delivery

## Documentation

Three guides are available:

1. **SUPABASE_CONFIG_CHECKLIST.md** - Step-by-step configuration verification
2. **EMAIL_CONFIRMATION_SETUP.md** - Complete technical documentation
3. **EMAIL_CONFIRMATION_IMPLEMENTATION_SUMMARY.md** - What was implemented

## Troubleshooting

### Still seeing auto-confirmed users?

**Try this**:
1. Toggle "Confirm Email" OFF → Save → ON → Save
2. Restart Supabase project
3. Clear browser cache
4. Test with a brand new email address
5. Check database again

### Emails not being sent?

**Check**:
1. SMTP configuration (if using custom email)
2. Supabase logs (Authentication → Logs)
3. Email provider logs
4. Spam folder

### Confirmation links not working?

**Verify**:
1. Redirect URL is correct in Supabase
2. Link hasn't expired (24 hour limit)
3. Trying in incognito/private window
4. No browser extensions blocking it

## SQL Queries for Debugging

### Check if users are being auto-confirmed (should be empty)
```sql
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email_confirmed_at = created_at
ORDER BY created_at DESC
LIMIT 10;
```

### Check unconfirmed users (should see recent signups)
```sql
SELECT email, created_at, confirmation_sent_at, email_confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Check if emails are being sent
```sql
SELECT email, confirmation_sent_at
FROM auth.users
WHERE confirmation_sent_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

## Summary

✅ **Code is ready**: All application code for email confirmation is implemented

⚠️ **Configuration needed**: You must configure Supabase's "Confirm Email" setting

🎯 **Goal**: After configuration, users must verify email before accessing the app

📧 **Experience**: Professional verification flow with auto-detection and resend

🔒 **Security**: Unverified users completely blocked from platform

## Next Step

**Do this now**: Go to Supabase dashboard and configure "Confirm Email" as described above.

Then test with a real email to verify it works correctly.
