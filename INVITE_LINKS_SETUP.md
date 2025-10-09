# Invite Links Configuration Guide

## Overview

This guide explains how to configure invite email links so they work correctly for recipients. By default, the application uses `localhost` URLs in development, which won't work for external users receiving invite emails.

## The Problem

When you send invite emails from your local development environment, the links in those emails point to `localhost:5173`. This means:

- ✅ The links work for YOU (on your local machine)
- ❌ The links DON'T work for recipients (they see a "Connect to Project" error)

This happens because `localhost` refers to the recipient's own computer, not your development server.

## The Solution

Configure the `VITE_APP_URL` environment variable to point to a publicly accessible URL.

## Configuration Steps

### For Production Deployment

1. Open your `.env` file
2. Update the `VITE_APP_URL` variable with your deployed application URL:

```env
VITE_APP_URL=https://yourdomain.com
```

3. Redeploy your application
4. Invite emails will now contain the correct public URL

### For Local Development Testing

If you need to test invite emails locally, you have several options:

#### Option 1: Using ngrok (Recommended)

1. Install ngrok: https://ngrok.com/download
2. Start your dev server: `npm run dev`
3. In a new terminal, run: `ngrok http 5173`
4. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
5. Update your `.env` file:

```env
VITE_APP_URL=https://abc123.ngrok.io
```

6. Restart your dev server
7. Invite emails will now use the ngrok URL, which is publicly accessible

#### Option 2: Using Cloudflare Tunnel

1. Install Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
2. Start your dev server: `npm run dev`
3. Run: `cloudflared tunnel --url http://localhost:5173`
4. Copy the provided URL
5. Update your `.env` file with the Cloudflare Tunnel URL
6. Restart your dev server

#### Option 3: Deploy to a Preview Environment

Deploy your branch to a preview environment (Vercel, Netlify, etc.) and test invites there.

## Environment Variables Reference

```env
# Your Supabase configuration (provided automatically)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Your application URL (you must configure this)
VITE_APP_URL=https://yourdomain.com
```

## Validation and Warnings

The application includes built-in validation:

### Development Mode Warnings

When sending invites in development with localhost URLs, you'll see:

- 🟡 **Warning Banner** in the invite modal
- 🟡 **Confirmation Dialog** before sending invites
- 🟡 **Console Warnings** with helpful messages

### Production Mode Errors

If you try to send invites with localhost URLs in production:

- 🔴 **Error Message** preventing the invite from being sent
- 🔴 **Instructions** to configure `VITE_APP_URL`

## Testing Your Configuration

1. Configure `VITE_APP_URL` with your public URL
2. Restart your development server
3. Send a test invite to yourself
4. Check the email - the link should use your configured URL
5. Click the link - it should open your application

## Troubleshooting

### Issue: Recipients see "Connect to Project" page

**Cause:** Invite links are using `localhost` URLs

**Solution:** Configure `VITE_APP_URL` with a public URL (see above)

### Issue: Invite emails not being sent

**Cause:** Email service might not be configured

**Solution:** Check the `EMAIL_SETUP.md` file for email configuration instructions

### Issue: ngrok URL stops working

**Cause:** ngrok URLs change each time you restart ngrok (free plan)

**Solution:**
- Update `VITE_APP_URL` with the new ngrok URL
- Restart your dev server
- Consider upgrading to ngrok paid plan for persistent URLs

### Issue: "Invalid invite URL" error

**Cause:** Misconfigured `VITE_APP_URL`

**Solution:** Ensure the URL:
- Starts with `http://` or `https://`
- Does not end with a slash
- Is accessible from the internet (for production)

## Best Practices

1. **Never commit localhost URLs** to production environment variables
2. **Use environment-specific configuration** (development, staging, production)
3. **Test invite emails** in a staging environment before production
4. **Document your deployment URL** for team members
5. **Use ngrok for local testing** when you need to test invite emails

## Additional Resources

- ngrok Documentation: https://ngrok.com/docs
- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Environment Variables Guide: https://vitejs.dev/guide/env-and-mode.html

## Support

If you continue to experience issues with invite links, please check:

1. The console for any error messages
2. Your `.env` file configuration
3. Your email service logs (see `EMAIL_SETUP.md`)
4. Network connectivity to your configured URL
