# Email Invite System Setup Guide

This application now has a complete email invite system that sends professional email invitations to team members and assessment participants.

## Features

- **Automated Email Delivery**: Emails are sent automatically when invites are created
- **Beautiful HTML Templates**: Professional, responsive email designs for both organization and assessment invites
- **Email Tracking**: Track when emails are sent, delivered, opened, and any errors
- **Resend Functionality**: Easily resend invites with a single click
- **New User Onboarding**: Invited users can create accounts and accept invitations seamlessly
- **Token-based Authentication**: Secure invite tokens with expiration dates

## How It Works

### 1. Database Layer
- Invites are stored in the `invites` table with tracking fields
- Fields include: `email_sent_at`, `email_delivered_at`, `email_error`, `accepted_at`, `resend_count`

### 2. Edge Function
- A Supabase Edge Function (`send-invite-email`) handles email sending
- Integrates with Resend API for reliable email delivery
- Includes beautiful HTML and plain-text email templates
- Automatically logs email status back to the database

### 3. Invite Service
- `inviteService.createInvite()` - Creates invite and triggers email automatically
- `inviteService.resendInvite()` - Resends email and updates resend count
- `inviteService.sendInviteEmail()` - Sends email via Edge Function

### 4. Invite Acceptance Page
- Accessible at `/invite/{token}`
- Validates token and checks expiration
- Allows new users to create accounts
- Existing users can accept directly
- Redirects to assessment or dashboard after acceptance

## Setup Instructions

### 1. Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up for a free account
2. Navigate to API Keys in your dashboard
3. Create a new API key
4. Copy the API key (it starts with `re_`)

### 2. Configure Supabase Secret

The Resend API key is automatically configured as a secret in your Supabase project. You don't need to manually set it up.

**IMPORTANT**: The email sending functionality requires the `RESEND_API_KEY` to be configured. The Edge Function will log errors if it's not set, but invites will still be created in the database.

### 3. Configure Email Domain (Optional)

By default, emails are sent from `invites@yourdomain.com`. To customize this:

1. Add your domain to Resend
2. Verify DNS records
3. Update the `from` field in `/supabase/functions/send-invite-email/index.ts`:

```typescript
from: 'Archetype Finder <invites@yourdomain.com>',
```

### 4. Test the System

1. **Send an Invite**:
   - Go to Team tab
   - Click "Invite Members"
   - Enter an email address
   - Click "Send Invites"

2. **Check Email**:
   - Check the recipient's inbox
   - Email should arrive within seconds
   - Click the invitation link

3. **Accept Invite**:
   - New users will see account creation form
   - Existing users can accept directly
   - Users are redirected to the appropriate page

## Email Templates

The system includes two email types:

### 1. Assessment Invite
- Blue theme with gradient header
- Shows assessment name and organization
- Clear call-to-action button
- Includes expiration notice

### 2. Organization Invite
- Green theme with gradient header
- Shows organization name
- Invitation to join team
- Clear acceptance button

Both templates are:
- Fully responsive
- Mobile-friendly
- Include plain-text fallback
- Professional design

## Troubleshooting

### Emails Not Sending

1. **Check Edge Function Logs**:
   - Go to Supabase Dashboard
   - Navigate to Edge Functions
   - Check `send-invite-email` logs

2. **Verify API Key**:
   - Ensure `RESEND_API_KEY` is configured
   - Check that the key is valid

3. **Check Database**:
   - Query the `invites` table
   - Check `email_error` field for error messages
   - Verify `email_sent_at` is null if email failed

### Invite Links Not Working

1. **Check Token**:
   - Tokens are UUIDs in the URL: `/invite/{uuid}`
   - Verify token exists in database
   - Check if invite is expired or already accepted

2. **Check Status**:
   - Invites can be: pending, accepted, expired, revoked
   - Only pending invites can be accepted

### New Users Can't Sign Up

1. **Check RLS Policies**:
   - Ensure `users` table allows inserts
   - Verify `organisation_members` policies

2. **Check Form Validation**:
   - Name must be provided
   - Password must be 8+ characters
   - Passwords must match

## API Reference

### inviteService.createInvite()

```typescript
const invite = await inviteService.createInvite({
  email: 'user@example.com',
  organisationId: 'org-uuid',
  assessmentId: 'assessment-uuid', // Optional
  role: 'participant', // or 'user_admin'
  invitedBy: 'inviter-user-uuid',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
});
```

### inviteService.resendInvite()

```typescript
await inviteService.resendInvite(inviteId);
```

### Edge Function Request

```typescript
POST /functions/v1/send-invite-email
Headers:
  Authorization: Bearer {SUPABASE_ANON_KEY}
  Content-Type: application/json

Body:
{
  "inviteId": "uuid",
  "email": "user@example.com",
  "inviteType": "assessment" | "organization",
  "organizationName": "Company Name",
  "inviterName": "John Doe",
  "assessmentName": "Brand Archetype",
  "inviteUrl": "https://app.com/invite/token"
}
```

## Email Tracking

Track email lifecycle in the database:

- `invited_at`: When invite was created
- `email_sent_at`: When email was sent
- `email_delivered_at`: When email was delivered (future feature)
- `email_opened_at`: When email was opened (future feature)
- `email_error`: Any errors during sending
- `accepted_at`: When invite was accepted
- `resend_count`: Number of times email was resent

## Security Considerations

- Invite tokens are UUIDs - cryptographically secure
- Tokens expire after 7 days by default
- Each token can only be used once
- Email verification is implicit (user must receive email)
- All database operations respect RLS policies

## Future Enhancements

Potential improvements:

1. **Email Analytics**: Track opens and clicks via Resend webhooks
2. **Custom Templates**: Allow organizations to customize email templates
3. **Batch Invites**: Send multiple invites efficiently
4. **Reminder Emails**: Automatically remind users of pending invites
5. **Email Preferences**: Let users control email notifications
6. **Multi-language**: Support for different languages
7. **SMS Invites**: Alternative to email for mobile users

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review database `email_error` field
3. Verify Resend API key is configured
4. Test with a known working email address
