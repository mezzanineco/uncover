# Supabase Email Confirmation Configuration Checklist

Use this checklist to verify your Supabase project is properly configured for email confirmation.

## Critical Configuration Steps

### ✅ Step 1: Verify "Confirm Email" is Enabled

**Location**: Supabase Dashboard → Authentication → Providers → Email

**Check these settings**:
- [ ] **Enable Email Provider** toggle is ON
- [ ] **Confirm Email** toggle is ON ⚠️ **CRITICAL**
- [ ] **Secure Email Change** toggle is ON (recommended)

**How to verify**:
1. Log into your Supabase dashboard
2. Navigate to Authentication → Providers
3. Click on "Email" provider
4. Ensure all toggles are enabled

**Current Issue**: Based on your database showing `confirmed_at` matching `created_at`, this setting may not be properly saved or there's a configuration override.

---

### ✅ Step 2: Configure Site URL and Redirect URLs

**Location**: Supabase Dashboard → Authentication → URL Configuration

**Required URLs**:
- [ ] **Site URL**: `https://archetypes.consciousbrands.co`
- [ ] **Redirect URLs**: Must include `https://archetypes.consciousbrands.co/auth/confirm`

**How to add redirect URL**:
1. Go to Authentication → URL Configuration
2. In "Redirect URLs" section, click "Add URL"
3. Enter: `https://archetypes.consciousbrands.co/auth/confirm`
4. Click "Add" or "Save"

---

### ✅ Step 3: Configure Email Templates

**Location**: Supabase Dashboard → Authentication → Email Templates

**Template to configure**: Confirm signup

**Required variables**:
- [ ] Email template contains `{{ .ConfirmationURL }}`
- [ ] Sender name and email are configured
- [ ] Email is professional and branded

**Example template**:
```html
<h2>Confirm Your Email</h2>
<p>Thank you for signing up for Archetype Finder!</p>
<p>Click the button below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Your Email</a></p>
<p>Or copy this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p><small>This link expires in 24 hours.</small></p>
```

---

### ✅ Step 4: Email Service Configuration

**Choose one**:

#### Option A: Supabase Built-in Email (Development)
- [ ] No additional configuration needed
- [ ] Limited to testing/development
- [ ] May have rate limits and deliverability issues

#### Option B: Custom SMTP (Recommended for Production)

**Location**: Project Settings → Auth → SMTP Settings

**For Resend integration**:
- [ ] **Sender name**: Archetype Finder (or your preferred name)
- [ ] **Sender email**: `noreply@archetypes.consciousbrands.co`
- [ ] **SMTP Host**: `smtp.resend.com`
- [ ] **SMTP Port**: `587`
- [ ] **SMTP Username**: `resend`
- [ ] **SMTP Password**: Your Resend API key (starts with `re_`)

**How to test SMTP configuration**:
1. After saving SMTP settings
2. Send a test email from Supabase dashboard
3. Check if email arrives in your inbox

---

## Verification Tests

### Test 1: Check Database for Auto-Confirmation

Run this SQL query in Supabase SQL Editor:

```sql
-- This should return EMPTY results if properly configured
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    confirmation_sent_at,
    EXTRACT(EPOCH FROM (email_confirmed_at - created_at)) as seconds_to_confirm
FROM auth.users
WHERE email_confirmed_at = created_at
ORDER BY created_at DESC
LIMIT 10;
```

**Expected result**: No rows returned (users should NOT be auto-confirmed)

**If you see rows**: Users are being auto-confirmed. Double-check "Confirm Email" setting.

---

### Test 2: Create Test User

1. **Sign up with a test email** (use a real email you can access)

2. **Check database immediately**:
   ```sql
   SELECT
       email,
       email_confirmed_at,
       confirmation_sent_at
   FROM auth.users
   WHERE email = 'your-test-email@example.com';
   ```

   **Expected**:
   - `email_confirmed_at`: NULL ✅
   - `confirmation_sent_at`: Has a timestamp ✅

3. **Check your email inbox**
   - [ ] Confirmation email received
   - [ ] Email has confirmation link
   - [ ] Link points to `https://archetypes.consciousbrands.co/auth/confirm?token_hash=...`

4. **Click the confirmation link**

5. **Verify confirmation worked**:
   ```sql
   SELECT
       email,
       email_confirmed_at,
       confirmation_sent_at
   FROM auth.users
   WHERE email = 'your-test-email@example.com';
   ```

   **Expected**:
   - `email_confirmed_at`: Now has a timestamp ✅

---

### Test 3: Verify Application Flow

1. **Sign up on the application**
   - Navigate to: `https://archetypes.consciousbrands.co`
   - Click "Sign Up"
   - Enter credentials
   - Submit form

2. **Verify you see the verification screen**
   - [ ] Shows "Check Your Email" message
   - [ ] Shows email address you signed up with
   - [ ] Shows "I've Verified My Email" button
   - [ ] Shows "Resend Confirmation Email" button

3. **Check browser console**
   - [ ] No JavaScript errors
   - [ ] See log: "EMAIL CONFIRMATION REQUIRED"
   - [ ] See log: "Needs email confirmation: true"

4. **Click confirmation link in email**
   - [ ] Redirects to `/auth/confirm`
   - [ ] Automatically logs you in
   - [ ] Redirects to dashboard
   - [ ] No loading screen stuck

---

## Common Issues and Fixes

### Issue 1: Users Auto-Confirmed Despite Setting

**Symptoms**:
- `confirmed_at` equals `created_at` in database
- Users can log in immediately without confirming email

**Possible causes**:
1. "Confirm Email" toggle not properly saved
2. Development mode or test mode enabled
3. Cached configuration in Supabase

**Solutions**:
1. **Toggle OFF then ON**: Disable "Confirm Email", save, then enable and save again
2. **Clear Supabase cache**: Restart your Supabase project (Settings → General → Restart)
3. **Check project settings**: Verify no development overrides
4. **Test with fresh signup**: Create brand new test user after configuration change

---

### Issue 2: Emails Not Being Sent

**Symptoms**:
- `confirmation_sent_at` is NULL in database
- No email received

**Solutions**:
1. **Check SMTP configuration**: Verify all SMTP settings are correct
2. **Test SMTP connection**: Send test email from Supabase dashboard
3. **Check email provider logs**: Look for errors in Resend/SendGrid logs
4. **Verify sender email**: Must be verified with your email provider
5. **Check spam folder**: Confirmation emails might be marked as spam

---

### Issue 3: Confirmation Links Don't Work

**Symptoms**:
- Clicking link shows "access_denied" error
- Link redirects but doesn't log in

**Solutions**:
1. **Check redirect URL**: Must exactly match configured URL
2. **Verify link hasn't expired**: Links expire after 24 hours
3. **Check for URL tampering**: Link must be complete and unmodified
4. **Clear cookies**: Try in incognito/private window
5. **Check CORS settings**: Verify domain is whitelisted

---

### Issue 4: Still Seeing Loading Screen

**Symptoms**:
- After clicking confirmation link, stuck on loading screen
- Console shows auth state not updating

**Solutions**:
1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear browser cache**: Clear all site data
3. **Check session storage**: Open DevTools → Application → Session Storage
   - Remove `awaiting_email_verification` key if exists
4. **Check auth state**: Console → Run `await supabase.auth.getSession()`
5. **Verify AuthProvider**: Check console for "SIGNED_IN" event

---

## Final Verification Checklist

Before considering setup complete, verify:

- [ ] "Confirm Email" is enabled in Supabase dashboard
- [ ] Redirect URLs are correctly configured
- [ ] Email templates use correct variables
- [ ] SMTP is configured (if using custom email provider)
- [ ] Test signup creates unconfirmed user (`confirmed_at = null`)
- [ ] Confirmation email is sent and received
- [ ] Clicking confirmation link works
- [ ] User is auto-logged in after confirmation
- [ ] User sees dashboard after confirmation
- [ ] Unconfirmed users cannot access the app
- [ ] Database trigger syncs `email_verified` status
- [ ] Application shows verification screen for unconfirmed users

---

## Support

If you've completed all steps and still having issues:

1. **Check Supabase Status**: https://status.supabase.com/
2. **Review Supabase Logs**: Authentication → Logs
3. **Check Browser Console**: Look for specific error messages
4. **Test with Different Email**: Try another email provider
5. **Contact Supabase Support**: If issue persists with their service

---

## Quick SQL Queries for Debugging

### Check all unconfirmed users
```sql
SELECT email, created_at, confirmation_sent_at
FROM auth.users
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;
```

### Check auto-confirmed users (should be empty)
```sql
SELECT email, created_at, email_confirmed_at
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
AND email_confirmed_at = created_at;
```

### Check confirmation rate
```sql
SELECT
    COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed,
    COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed,
    ROUND(COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) * 100.0 / COUNT(*), 2) as confirmation_rate
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Check average time to confirm
```sql
SELECT
    AVG(EXTRACT(EPOCH FROM (email_confirmed_at - created_at))) / 60 as avg_minutes
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
AND created_at > NOW() - INTERVAL '7 days';
```
