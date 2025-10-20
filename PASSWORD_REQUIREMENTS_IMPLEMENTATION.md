# Password Requirements Management System

## Overview

Super administrators can now configure password complexity requirements for their organisation. These settings apply to all new user signups and invitation acceptances.

## Features Implemented

### 1. Database Schema

**Table: `password_requirements`**
- Stores password policy settings per organisation
- Configurable options:
  - `min_length` (6-128 characters, default: 8)
  - `require_uppercase` (boolean, default: true)
  - `require_lowercase` (boolean, default: true)
  - `require_number` (boolean, default: true)
  - `require_special_char` (boolean, default: true)

**Security:**
- Row Level Security (RLS) enabled
- Anonymous users can read requirements (needed for signup/invite forms)
- Only super admins can modify requirements
- Default requirements created for existing organisations

### 2. Password Requirements Manager Component

**Location:** `src/components/admin/PasswordRequirementsManager.tsx`

**Access:** Dashboard → Settings → Password Policy tab (Super Admin only)

### 3. Dynamic Password Validation

**Utility:** `src/utils/passwordValidation.ts`

Features dynamic validation rules based on organisation settings with real-time password strength feedback.

### 4. Integration with Signup Forms

**Updated Components:**
1. **SignupForm** - Loads and applies password requirements
2. **InviteAcceptance** - Loads organisation-specific requirements

## How to Use

### For Super Admins

1. Navigate to **Dashboard** → **Settings** → **Password Policy**
2. Configure requirements:
   - Set minimum password length (6-128 characters)
   - Toggle uppercase letter requirement
   - Toggle lowercase letter requirement  
   - Toggle number requirement
   - Toggle special character requirement
3. Click **Save Changes**
4. Changes apply immediately to new signups and invitations

## Default Settings

- Minimum Length: 8 characters
- Uppercase Letter: Required
- Lowercase Letter: Required
- Number: Required
- Special Character: Required

## Build Status

✅ Project builds successfully
✅ All TypeScript types validated
✅ No runtime errors
