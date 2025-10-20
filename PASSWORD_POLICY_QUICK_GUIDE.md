# Password Policy Management - Quick Reference Guide

## For Administrators

### Accessing Password Policy Settings

1. Sign in with a super_admin or user_admin account
2. Navigate to **Admin Dashboard**
3. Click on **Settings** tab
4. Select **Password Policy** from the left sidebar

### Modifying Password Requirements

1. Adjust the **Minimum Password Length** (6-128 characters)
2. Toggle character requirements:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
   - Special characters (!@#$%^&*)
3. **Important**: At least one character requirement must be enabled
4. Click **Save Changes**

### Testing Password Requirements

Before saving changes, you can test them:

1. Locate the **Test Password** section (blue box)
2. Enter a sample password
3. Click **Test**
4. See if the password meets your new requirements
5. Adjust requirements if needed
6. Save when satisfied

### Viewing Change History

To see who changed password requirements and when:

1. Look for the **View Change History** link at the bottom
2. Click to expand the audit log
3. Review changes with old → new values highlighted
4. Up to 50 most recent changes are shown

### Understanding Error Messages

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Authentication required" | Session expired | Sign in again |
| "Insufficient permissions" | Not an admin | Contact super admin for access |
| "Password length must be between 6 and 128" | Invalid length setting | Use a value between 6 and 128 |
| "At least one requirement must be enabled" | All checkboxes unchecked | Enable at least one requirement |
| "Failed to save password requirements" | Server error | Try again or contact support |

## For Developers

### Edge Function URL

```
POST/PUT: https://your-project.supabase.co/functions/v1/manage-password-policy
GET: https://your-project.supabase.co/functions/v1/manage-password-policy?organisationId={id}
```

### Request Format (Update)

```json
{
  "organisationId": "uuid-here",
  "minLength": 10,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireNumber": true,
  "requireSpecialChar": true
}
```

### Response Format (Success)

```json
{
  "success": true,
  "message": "Password policy updated successfully",
  "data": {
    "id": "uuid-here",
    "organisationId": "uuid-here",
    "minLength": 10,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumber": true,
    "requireSpecialChar": true,
    "createdAt": "2025-10-20T...",
    "updatedAt": "2025-10-20T...",
    "updatedBy": "user-uuid"
  }
}
```

### Service Layer Usage

```typescript
import { passwordRequirementsService } from '@/services/database';

// Get requirements
const requirements = await passwordRequirementsService.getByOrganisation(orgId);

// Update requirements
await passwordRequirementsService.update(orgId, userId, {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
});

// Get audit log
const auditLog = await passwordRequirementsService.getAuditLog(orgId);
```

### Validating Passwords

```typescript
import { validatePassword } from '@/utils/passwordValidation';

const result = validatePassword(password, requirements);

if (result.isValid) {
  console.log('Password is valid!');
} else {
  const failedReqs = result.requirements
    .filter(req => !req.met)
    .map(req => req.label);
  console.log('Failed requirements:', failedReqs);
}
```

## Security Best Practices

### For Organizations

1. **Set Appropriate Requirements**
   - Minimum 8 characters for general use
   - Minimum 12 characters for sensitive data
   - Enable all character types for maximum security

2. **Review Changes Regularly**
   - Check audit log monthly
   - Verify only authorized admins made changes
   - Document reasons for policy changes

3. **Balance Security and Usability**
   - Too strict = users write passwords down
   - Too lenient = security vulnerabilities
   - Test with real users before deploying

### For Developers

1. **Always Use Edge Function**
   - Never bypass the Edge Function
   - Don't modify password_requirements table directly
   - Fallback is for emergencies only

2. **Handle Errors Gracefully**
   - Show user-friendly error messages
   - Log detailed errors for debugging
   - Provide clear next steps for users

3. **Validate on Both Sides**
   - Client-side for immediate feedback
   - Server-side for security
   - Database constraints as last resort

## Common Use Cases

### Scenario 1: Increasing Security Standards

**Situation**: Company security audit requires stronger passwords

**Steps**:
1. Current: 8 chars, all requirements enabled
2. New: 12 chars, all requirements enabled
3. Test with sample passwords
4. Save changes
5. Communicate to users before next password change

### Scenario 2: Simplifying for Low-Risk Environments

**Situation**: Internal tool with low security risk

**Steps**:
1. Current: 8 chars, all requirements enabled
2. New: 8 chars, only lowercase and numbers required
3. Test with sample passwords
4. Save changes
5. Users can use simpler passwords

### Scenario 3: Compliance Requirements

**Situation**: Need to meet HIPAA/SOC2 password standards

**Steps**:
1. Set minimum 12 characters
2. Enable all character requirements
3. Document in audit log
4. Export audit log for compliance review
5. Review quarterly

## Troubleshooting

### Problem: "Failed to save password requirements"

**Possible Causes**:
- Session expired → Sign in again
- Not an admin → Check role with super admin
- Edge Function not deployed → Contact DevOps
- Network issues → Check internet connection

**Debug Steps**:
1. Open browser console (F12)
2. Check for red error messages
3. Look for network errors
4. Verify you're signed in
5. Try refreshing the page

### Problem: Changes not taking effect

**Possible Causes**:
- Cache not cleared → Hard refresh (Ctrl+F5)
- Looking at wrong org → Check organisation ID
- RLS policies blocking → Check user role

**Debug Steps**:
1. Sign out and sign in again
2. Navigate back to password policy
3. Verify requirements shown match what you saved
4. Check audit log for your change

### Problem: Can't view password policy settings

**Possible Causes**:
- Not an admin → Contact super admin
- Wrong organisation → Switch organisations
- Permission error → Check role assignment

**Solution**:
1. Verify your role in the system
2. Contact your super admin if you need access
3. Check you're viewing the correct organisation

## FAQ

**Q: Who can change password policies?**
A: Only super_admin and user_admin roles can modify password requirements.

**Q: Do changes apply to existing users?**
A: No, changes only apply to new signups and password resets after the change.

**Q: Can I see who changed the password policy?**
A: Yes, click "View Change History" to see all changes with timestamps and user info.

**Q: What happens if I set requirements too strict?**
A: Users may have difficulty creating passwords. Use the Test feature before saving.

**Q: Can password policy changes be undone?**
A: Yes, you can change them back, but the audit log preserves all history.

**Q: How often should I review password policies?**
A: Review quarterly or when security requirements change.

**Q: Is the audit log encrypted?**
A: Yes, all data in Supabase is encrypted at rest and in transit.

**Q: Can I export the audit log?**
A: Yes, contact your database administrator for export options.

## Support

For additional help:
- Technical Documentation: `PASSWORD_POLICY_IMPLEMENTATION.md`
- Deployment Guide: `DEPLOYMENT_CHECKLIST.md`
- Code Reference: `src/services/database.ts`, `supabase/functions/manage-password-policy/`
