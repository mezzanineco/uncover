# Invite Email Flow - Before and After Fix

## BEFORE (Issue)

```
Developer's Machine (localhost:5173)
    │
    ├─ User clicks "Send Invite"
    │
    ├─ Code uses: window.location.origin
    │   └─ Returns: "http://localhost:5173"
    │
    ├─ Email is sent with link:
    │   "http://localhost:5173/invite/abc123"
    │
    └─ Recipient receives email
        │
        └─ Recipient clicks link
            │
            └─ ❌ Browser tries to open "localhost:5173"
                │
                └─ Shows "Connect to Project" error
                    (because localhost refers to THEIR computer,
                     not the developer's computer)
```

## AFTER (Fixed)

```
Developer's Machine or Production Server
    │
    ├─ User clicks "Send Invite"
    │
    ├─ Code uses: getAppUrl()
    │   ├─ Checks VITE_APP_URL environment variable
    │   │   └─ Returns: "https://yourdomain.com" (configured)
    │   │
    │   └─ Validates URL
    │       ├─ ✅ Valid public URL → Proceed
    │       └─ ❌ Localhost in production → Show error
    │
    ├─ Email is sent with link:
    │   "https://yourdomain.com/invite/abc123"
    │
    └─ Recipient receives email
        │
        └─ Recipient clicks link
            │
            └─ ✅ Browser opens public URL
                │
                └─ Shows invite acceptance page
                    (accessible from anywhere on the internet)
```

## Configuration Flow

```
Environment Setup
    │
    ├─ Production Deployment
    │   │
    │   ├─ .env file contains:
    │   │   VITE_APP_URL=https://yourdomain.com
    │   │
    │   └─ Invites use: https://yourdomain.com/invite/...
    │       └─ ✅ Works for all recipients
    │
    ├─ Local Development (with ngrok)
    │   │
    │   ├─ Developer runs: ngrok http 5173
    │   │   └─ ngrok provides: https://abc123.ngrok.io
    │   │
    │   ├─ .env file contains:
    │   │   VITE_APP_URL=https://abc123.ngrok.io
    │   │
    │   └─ Invites use: https://abc123.ngrok.io/invite/...
    │       └─ ✅ Works for testing with real recipients
    │
    └─ Local Development (without ngrok)
        │
        ├─ .env file contains:
        │   VITE_APP_URL=http://localhost:5173
        │
        ├─ ⚠️  Warning shown in UI
        │   "Email links will use localhost URLs"
        │
        └─ Invites use: http://localhost:5173/invite/...
            └─ ⚠️  Only works for the developer
                (confirmation required before sending)
```

## Validation Logic

```
Before Sending Invite Email
    │
    ├─ Get invite URL from getInviteUrl(token)
    │
    ├─ Validate URL
    │   │
    │   ├─ Is URL empty?
    │   │   └─ ❌ Error: "URL is empty"
    │   │
    │   ├─ Is URL localhost?
    │   │   │
    │   │   ├─ In Development Mode?
    │   │   │   └─ ⚠️  Warning: "Recipients won't be able to access"
    │   │   │       └─ Show confirmation dialog
    │   │   │           └─ User confirms → Proceed
    │   │   │
    │   │   └─ In Production Mode?
    │   │       └─ ❌ Error: "Cannot send localhost URLs"
    │   │           └─ Block email from being sent
    │   │
    │   └─ Is URL valid format?
    │       ├─ ✅ Valid → Proceed with sending email
    │       └─ ❌ Invalid → Show error message
    │
    └─ Send Email with validated URL
```

## UI Warning System

```
Invite Modal Opens
    │
    ├─ Check current app URL
    │   │
    │   ├─ Is localhost?
    │   │   │
    │   │   └─ Show warning banner:
    │   │       ┌─────────────────────────────────────────┐
    │   │       │ ⚠️  Development Mode:                   │
    │   │       │ Email links will use localhost URLs.    │
    │   │       │ Configure VITE_APP_URL in .env file.    │
    │   │       └─────────────────────────────────────────┘
    │   │
    │   └─ Is public URL?
    │       └─ No warning shown
    │           └─ Safe to send invites
    │
    └─ User clicks "Send Invites"
        │
        └─ If localhost:
            └─ Show confirmation dialog
                ├─ User confirms → Send with warning
                └─ User cancels → Don't send
```

## Key Components

```
src/utils/appUrl.ts
    │
    ├─ getAppUrl()
    │   └─ Returns configured or fallback URL
    │
    ├─ getInviteUrl(token)
    │   └─ Generates complete invite URL
    │
    ├─ isLocalhost(url)
    │   └─ Detects localhost addresses
    │
    ├─ isDevelopmentMode()
    │   └─ Detects dev environment
    │
    └─ validateInviteUrl(url)
        └─ Validates URL and returns warnings/errors
```
