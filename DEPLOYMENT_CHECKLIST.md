# Password Policy Management - Deployment Checklist

## Pre-Deployment Steps

### 1. Database Migration
- [ ] Review migration file: `supabase/migrations/20251021000000_add_password_policy_audit.sql`
- [ ] Apply migration to development database first
- [ ] Verify audit log table created successfully
- [ ] Test database functions work correctly
- [ ] Apply migration to production database

### 2. Edge Function Deployment
- [ ] Review Edge Function code: `supabase/functions/manage-password-policy/index.ts`
- [ ] Ensure SUPABASE_URL environment variable is set
- [ ] Ensure SUPABASE_SERVICE_ROLE_KEY environment variable is set
- [ ] Deploy Edge Function to Supabase
- [ ] Test Edge Function with curl or Postman
- [ ] Verify CORS headers are working

### 3. Test in Development
- [ ] Build project successfully (npm run build)
- [ ] Sign in as super_admin or user_admin
- [ ] Navigate to Settings > Password Policy
- [ ] Verify password requirements load correctly
- [ ] Change password requirements
- [ ] Click Save and verify success
- [ ] Test password validation feature
- [ ] View change history (audit log)
- [ ] Sign in as regular user and verify they cannot access password policy

## Deployment Commands

### Apply Migration
```bash
# Using Supabase CLI
supabase db push

# Or apply directly via SQL
psql -d your_database -f supabase/migrations/20251021000000_add_password_policy_audit.sql
```

### Deploy Edge Function
```bash
# Using Supabase CLI
supabase functions deploy manage-password-policy

# Verify deployment
supabase functions list
```

### Test Edge Function
```bash
# Get password requirements
curl -X GET \
  "https://your-project.supabase.co/functions/v1/manage-password-policy?organisationId=YOUR_ORG_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Update password requirements
curl -X PUT \
  "https://your-project.supabase.co/functions/v1/manage-password-policy" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organisationId": "YOUR_ORG_ID",
    "minLength": 10,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumber": true,
    "requireSpecialChar": true
  }'
```

## Post-Deployment Verification

### 1. Functional Testing
- [ ] Admin can view current password requirements
- [ ] Admin can update password requirements
- [ ] Admin can create new password requirements
- [ ] Test password feature works correctly
- [ ] Audit log displays change history
- [ ] Non-admin users cannot access password policy
- [ ] Error messages are clear and helpful

### 2. Security Testing
- [ ] Unauthenticated users cannot access Edge Function
- [ ] Non-admin users receive 403 Forbidden
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] SQL injection attempts are prevented
- [ ] CORS works for browser requests
- [ ] Audit logs are immutable (cannot be edited/deleted)

### 3. Performance Testing
- [ ] Password requirements load quickly
- [ ] Save operation completes in < 2 seconds
- [ ] Audit log loads efficiently
- [ ] No performance degradation with large audit logs

## Rollback Plan

If issues occur, rollback in this order:

### 1. Revert Service Layer Changes
```bash
# Restore previous version of database.ts
git checkout HEAD~1 -- src/services/database.ts
npm run build
```

### 2. Remove Edge Function (if needed)
```bash
supabase functions delete manage-password-policy
```

### 3. Rollback Database Migration (if absolutely necessary)
```sql
-- Drop audit log table
DROP TABLE IF EXISTS password_requirements_audit_log CASCADE;

-- Drop trigger
DROP TRIGGER IF EXISTS password_requirements_audit_trigger ON password_requirements;

-- Drop functions
DROP FUNCTION IF EXISTS audit_password_requirement_change();
DROP FUNCTION IF EXISTS validate_password_requirements(jsonb);
DROP FUNCTION IF EXISTS get_effective_password_requirements(uuid);

-- Remove constraint
ALTER TABLE password_requirements DROP CONSTRAINT IF EXISTS check_at_least_one_requirement;
```

## Monitoring

### Key Metrics to Monitor
- Edge Function invocation count
- Edge Function error rate
- Average response time
- Password policy change frequency
- Failed authentication attempts
- Audit log growth rate

### Queries for Monitoring

```sql
-- Check recent password policy changes
SELECT
  pr.organisation_id,
  o.name as org_name,
  COUNT(*) as change_count,
  MAX(pral.changed_at) as last_change
FROM password_requirements_audit_log pral
JOIN password_requirements pr ON pr.organisation_id = pral.organisation_id
JOIN organisations o ON o.id = pr.organisation_id
WHERE pral.changed_at > NOW() - INTERVAL '7 days'
GROUP BY pr.organisation_id, o.name
ORDER BY change_count DESC;

-- Find organisations with weak password policies
SELECT
  pr.organisation_id,
  o.name,
  pr.min_length,
  pr.require_uppercase,
  pr.require_lowercase,
  pr.require_number,
  pr.require_special_char
FROM password_requirements pr
JOIN organisations o ON o.id = pr.organisation_id
WHERE pr.min_length < 8
  OR NOT (pr.require_uppercase AND pr.require_lowercase AND pr.require_number);

-- Audit log size monitoring
SELECT
  pg_size_pretty(pg_total_relation_size('password_requirements_audit_log')) as table_size,
  COUNT(*) as total_records
FROM password_requirements_audit_log;
```

## Success Criteria

✅ **Deployment is successful if:**
1. All tests pass
2. Admin users can save password policy changes without errors
3. Audit log tracks all changes correctly
4. Non-admin users cannot modify password policies
5. No performance degradation
6. Edge Function responds within 500ms
7. Build completes without errors or warnings
8. All security tests pass

## Support Contact

If issues arise during deployment:
1. Check Edge Function logs in Supabase dashboard
2. Review audit log for unexpected changes
3. Check browser console for client-side errors
4. Verify environment variables are set correctly
5. Test with curl to isolate frontend vs backend issues

## Documentation

For detailed technical documentation, see:
- `PASSWORD_POLICY_IMPLEMENTATION.md` - Architecture and design
- `supabase/functions/manage-password-policy/index.ts` - Edge Function code
- `supabase/migrations/20251021000000_add_password_policy_audit.sql` - Database schema
