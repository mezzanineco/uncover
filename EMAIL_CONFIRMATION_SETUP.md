# Email Confirmation Setup Guide

This guide explains how to configure and test email confirmation for user signups in your Archetype Finder application.

## Overview

The application requires users to verify their email address before they can access the platform. When a user signs up:

1. Supabase creates the user account with `confirmed_at = null`
2. Supabase automatically sends a confirmation email
3. User sees a verification screen with instructions
4. User clicks the link in their email
5. Supabase confirms the email and creates a session
6. User is automatically logged in and redirected to dashboard

## Supabase Configuration

### Required Settings

Your Supabase project **must** have these authentication settings configured:

#### 1. Email Provider Settings

Navigate to **Authentication > Providers > Email** in your Supabase dashboard:

- **Enable Email Provider**: ✅ Enabled
- **Confirm Email**: ✅ Enabled (CRITICAL - this is what requires email verification)
- **Secure Email Change**: ✅ Enabled (recommended for security)

#### 2. Site URL Configuration

Navigate to **Authentication > URL Configuration**:

- **Site URL**: `https://archetypes.consciousbrands.co`
- **Redirect URLs**: Add `https://archetypes.consciousbrands.co/auth/confirm`

This tells Supabase where to redirect users after they click the confirmation link.

#### 3. Email Templates

Navigate to **Authentication > Email Templates** and customize:

**Confirm signup** template:
```html
<h2>Confirm Your Email</h2>
<p>Thank you for signing up for Archetype Finder!</p>
<p>Click the button below to confirm your email address and get started:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Your Email</a></p>
<p>If you didn't sign up for this account, you can safely ignore this email.</p>
<p>This link expires in 24 hours.</p>
```

**Important**: The `{{ .ConfirmationURL }}` variable is automatically populated by Supabase with the correct confirmation URL.

#### 4. Email Service Configuration

Supabase can send emails using:

**Option A: Built-in Email Service (Default)**
- No additional configuration needed
- Limited to development/testing
- May have rate limits

**Option B: Custom SMTP (Recommended for Production)**
- Navigate to **Project Settings > Auth > SMTP Settings**
- Configure your SMTP provider (e.g., Resend, SendGrid, AWS SES)
- Use this for production to ensure reliable email delivery

For Resend integration:
- **Sender email**: `noreply@archetypes.consciousbrands.co`
- **SMTP Host**: `smtp.resend.com`
- **SMTP Port**: `587`
- **Username**: `resend`
- **Password**: Your Resend API key

## How Email Confirmation Works

### 1. User Signs Up

When a user submits the signup form:

```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { username, name: username },
    emailRedirectTo: `https://archetypes.consciousbrands.co/auth/confirm`
  }
});
```

### 2. Supabase Response

With "Confirm Email" enabled, Supabase returns:

```javascript
{
  data: {
    user: {
      id: '...',
      email: 'user@example.com',
      email_confirmed_at: null,  // NULL means not confirmed
      confirmation_sent_at: '2025-11-12T...'
    },
    session: null  // NO SESSION until email is confirmed
  },
  error: null
}
```

### 3. Application Behavior

The application detects `email_confirmed_at: null` and:

- Shows the email verification screen
- Sets `isAwaitingEmailVerification: true`
- Blocks access to the dashboard
- Starts auto-checking every 5 seconds for verification

### 4. User Clicks Confirmation Link

The email contains a link like:
```
https://archetypes.consciousbrands.co/auth/confirm?token_hash=...&type=signup
```

When clicked:
- Supabase validates the token
- Sets `confirmed_at` timestamp
- Creates a new session for the user
- Redirects to `/auth/confirm` with the session

### 5. Auto-Login and Redirect

The application's `/auth/confirm` handler:
- Detects the successful confirmation
- AuthProvider's `onAuthStateChange` fires with `SIGNED_IN` event
- Checks `email_confirmed_at` is set
- Loads user data and organization
- Redirects to dashboard

## Database Schema

### auth.users Table (Managed by Supabase)

Key fields for email confirmation:
- `id`: User UUID
- `email`: User's email address
- `email_confirmed_at`: Timestamp of when email was confirmed (null = not confirmed)
- `confirmation_sent_at`: When the confirmation email was sent
- `confirmation_token`: Hashed token for verification (handled by Supabase)

### public.users Table (Your Application)

Syncs with Supabase Auth via database trigger:
- `id`: Matches auth.users.id
- `email`: User's email
- `email_verified`: Boolean (true if confirmed_at is set)
- `email_verified_at`: Timestamp copied from auth.users.confirmed_at

The sync happens automatically via the `sync_email_verification()` trigger function.

## Testing Email Confirmation

### Test Signup Flow

1. **Start Fresh**:
   ```bash
   # Clear any existing test users
   # In Supabase Dashboard > Authentication > Users
   # Delete test users
   ```

2. **Sign Up**:
   - Navigate to signup page
   - Enter email: `test@example.com`
   - Enter username and password
   - Click "Create Account"

3. **Verify Database State**:
   ```sql
   -- Check user was created but not confirmed
   SELECT id, email, email_confirmed_at, confirmation_sent_at
   FROM auth.users
   WHERE email = 'test@example.com';

   -- Should show:
   -- email_confirmed_at: null
   -- confirmation_sent_at: <timestamp>
   ```

4. **Check Email**:
   - Look in test email inbox
   - Find confirmation email
   - Verify link points to your domain

5. **Click Confirmation Link**:
   - Click the link in the email
   - Should redirect to `/auth/confirm?token_hash=...`
   - Should automatically log in
   - Should redirect to dashboard

6. **Verify Confirmation**:
   ```sql
   -- Check user is now confirmed
   SELECT id, email, email_confirmed_at
   FROM auth.users
   WHERE email = 'test@example.com';

   -- Should show:
   -- email_confirmed_at: <timestamp>
   ```

### Common Issues and Solutions

#### Issue: Users Are Auto-Confirmed

**Symptom**: `confirmed_at` is set immediately when user signs up

**Solutions**:
1. Check **Authentication > Providers > Email** settings
2. Ensure "Confirm Email" toggle is **ON**
3. No database triggers should be setting `confirmed_at`
4. No custom functions should bypass confirmation

**Verify**:
```sql
-- Check for triggers that might auto-confirm
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';
```

#### Issue: Confirmation Emails Not Sending

**Solutions**:
1. Check SMTP configuration in Supabase dashboard
2. Verify email provider API keys are correct
3. Check Supabase logs for email errors
4. Test with a verified email address (not disposable)

**Debug**:
```sql
-- Check confirmation status
SELECT
  email,
  confirmation_sent_at,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'test@example.com';
```

#### Issue: Confirmation Link Expired

**Symptom**: "access_denied" error when clicking link

**Solutions**:
1. Confirmation links expire after 24 hours
2. Use the "Resend Confirmation Email" button
3. Check the `expires_at` field in database

#### Issue: User Stuck on Verification Screen

**Solutions**:
1. Check browser console for errors
2. Verify auto-check is running (every 5 seconds)
3. Click "I've Verified My Email" button manually
4. Check session status in browser DevTools > Application > Cookies

## Email Verification Flow Diagram

```
┌─────────────────┐
│   User Signs    │
│      Up         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Supabase Creates│
│ User (Unconf.)  │
└────────┬────────┘
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌───────────────┐
│  Send Confirm   │       │  Show Verify  │
│     Email       │       │    Screen     │
└────────┬────────┘       └───────┬───────┘
         │                        │
         │                        ▼
         │                ┌───────────────┐
         │                │  Auto-Check   │
         │                │  Every 5 sec  │
         │                └───────┬───────┘
         │                        │
         ▼                        │
┌─────────────────┐              │
│  User Clicks    │              │
│  Link in Email  │              │
└────────┬────────┘              │
         │                        │
         ▼                        │
┌─────────────────┐              │
│    Supabase     │              │
│   Confirms &    │              │
│ Creates Session │              │
└────────┬────────┘              │
         │                        │
         │ ◄──────────────────────┘
         │
         ▼
┌─────────────────┐
│   Auth State    │
│   SIGNED_IN     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Load User Data │
│  & Organization │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Redirect to   │
│    Dashboard    │
└─────────────────┘
```

## Security Considerations

1. **Email Confirmation is Required**: Users cannot access any part of the application until their email is confirmed
2. **Session-Based**: No session is created until email is confirmed
3. **Token Expiration**: Confirmation links expire after 24 hours
4. **One-Time Use**: Each confirmation token can only be used once
5. **Rate Limiting**: Resend confirmation has a 60-second cooldown
6. **Database Sync**: Email verification status is synced between auth.users and public.users

## Monitoring and Analytics

### Key Metrics to Track

1. **Signup to Confirmation Time**:
   ```sql
   SELECT
     AVG(EXTRACT(EPOCH FROM (email_confirmed_at - created_at))) / 60 as avg_minutes
   FROM auth.users
   WHERE email_confirmed_at IS NOT NULL;
   ```

2. **Unconfirmed Users**:
   ```sql
   SELECT COUNT(*) as unconfirmed_count
   FROM auth.users
   WHERE email_confirmed_at IS NULL
   AND created_at > NOW() - INTERVAL '7 days';
   ```

3. **Confirmation Rate**:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) * 100.0 / COUNT(*) as confirmation_rate
   FROM auth.users
   WHERE created_at > NOW() - INTERVAL '30 days';
   ```

## Support and Troubleshooting

### Logs to Check

1. **Browser Console**: Check for JavaScript errors
2. **Supabase Logs**: Authentication > Logs
3. **Network Tab**: Look for failed API calls
4. **Session Storage**: Check for `awaiting_email_verification` flag

### Debug Commands

```javascript
// In browser console, check current auth state
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('Email confirmed:', data.session?.user?.email_confirmed_at);

// Check session storage
console.log('Awaiting verification:', sessionStorage.getItem('awaiting_email_verification'));
console.log('Verification email:', sessionStorage.getItem('verification_email'));
```

### Contact Points

- **Supabase Issues**: Check [Supabase Status](https://status.supabase.com/)
- **Email Delivery**: Check your SMTP provider's logs
- **Application Logs**: Check browser console and Supabase logs

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Configuration Guide](https://supabase.com/docs/guides/auth/auth-email)
- [Resend Documentation](https://resend.com/docs)
- [SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)
