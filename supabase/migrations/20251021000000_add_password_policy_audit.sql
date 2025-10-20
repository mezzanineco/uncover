/*
  # Add Password Policy Audit and Security Enhancements

  1. Purpose
    - Add audit trail for all password policy changes
    - Create database functions for secure password requirement validation
    - Add constraints to ensure valid password requirements
    - Enable comprehensive tracking of who changed what and when

  2. New Tables
    - `password_requirements_audit_log` - Tracks all password policy changes
      - `id` (uuid, primary key)
      - `organisation_id` (uuid, references organisations)
      - `changed_by` (uuid, references users)
      - `changed_at` (timestamptz)
      - `old_values` (jsonb)
      - `new_values` (jsonb)
      - `change_reason` (text, optional)
      - `ip_address` (text, optional)

  3. Database Functions
    - `get_effective_password_requirements(org_id uuid)` - Returns requirements for an org or defaults
    - `validate_password_requirements(requirements jsonb)` - Validates requirement combinations
    - `audit_password_requirement_change()` - Trigger function to log changes

  4. Security
    - Enable RLS on audit_log table
    - Only admins can view audit logs
    - Audit logs are immutable (no updates/deletes allowed)
    - Add CHECK constraints for valid password requirements
*/

-- Create audit log table
CREATE TABLE IF NOT EXISTS password_requirements_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  changed_by uuid NOT NULL REFERENCES users(id),
  changed_at timestamptz DEFAULT now(),
  old_values jsonb,
  new_values jsonb NOT NULL,
  change_reason text,
  ip_address text,
  user_agent text
);

-- Enable Row Level Security
ALTER TABLE password_requirements_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs for their organisation
CREATE POLICY "Admins can view password policy audit logs"
  ON password_requirements_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members
      WHERE organisation_id = password_requirements_audit_log.organisation_id
      AND user_id = auth.uid()
      AND role IN ('user_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Prevent modifications to audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
  ON password_requirements_audit_log
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Audit logs cannot be deleted"
  ON password_requirements_audit_log
  FOR DELETE
  TO authenticated
  USING (false);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_password_audit_organisation
  ON password_requirements_audit_log(organisation_id, changed_at DESC);

-- Function to get effective password requirements (org-specific or default)
CREATE OR REPLACE FUNCTION get_effective_password_requirements(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  requirements jsonb;
BEGIN
  -- Try to get org-specific requirements
  SELECT jsonb_build_object(
    'minLength', min_length,
    'requireUppercase', require_uppercase,
    'requireLowercase', require_lowercase,
    'requireNumber', require_number,
    'requireSpecialChar', require_special_char
  )
  INTO requirements
  FROM password_requirements
  WHERE organisation_id = org_id;

  -- If not found, return defaults
  IF requirements IS NULL THEN
    requirements := jsonb_build_object(
      'minLength', 8,
      'requireUppercase', true,
      'requireLowercase', true,
      'requireNumber', true,
      'requireSpecialChar', true
    );
  END IF;

  RETURN requirements;
END;
$$;

-- Function to validate password requirements
CREATE OR REPLACE FUNCTION validate_password_requirements(requirements jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  min_length int;
BEGIN
  -- Extract minLength
  min_length := (requirements->>'minLength')::int;

  -- Validate minLength is between 6 and 128
  IF min_length < 6 OR min_length > 128 THEN
    RAISE EXCEPTION 'Password minimum length must be between 6 and 128 characters';
  END IF;

  -- Ensure at least one requirement is enabled
  IF NOT (
    (requirements->>'requireUppercase')::boolean OR
    (requirements->>'requireLowercase')::boolean OR
    (requirements->>'requireNumber')::boolean OR
    (requirements->>'requireSpecialChar')::boolean
  ) THEN
    RAISE EXCEPTION 'At least one character requirement must be enabled';
  END IF;

  RETURN true;
END;
$$;

-- Trigger function to audit password requirement changes
CREATE OR REPLACE FUNCTION audit_password_requirement_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO password_requirements_audit_log (
      organisation_id,
      changed_by,
      old_values,
      new_values
    ) VALUES (
      NEW.organisation_id,
      NEW.updated_by,
      jsonb_build_object(
        'minLength', OLD.min_length,
        'requireUppercase', OLD.require_uppercase,
        'requireLowercase', OLD.require_lowercase,
        'requireNumber', OLD.require_number,
        'requireSpecialChar', OLD.require_special_char
      ),
      jsonb_build_object(
        'minLength', NEW.min_length,
        'requireUppercase', NEW.require_uppercase,
        'requireLowercase', NEW.require_lowercase,
        'requireNumber', NEW.require_number,
        'requireSpecialChar', NEW.require_special_char
      )
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO password_requirements_audit_log (
      organisation_id,
      changed_by,
      old_values,
      new_values
    ) VALUES (
      NEW.organisation_id,
      NEW.updated_by,
      NULL,
      jsonb_build_object(
        'minLength', NEW.min_length,
        'requireUppercase', NEW.require_uppercase,
        'requireLowercase', NEW.require_lowercase,
        'requireNumber', NEW.require_number,
        'requireSpecialChar', NEW.require_special_char
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to audit password requirement changes
DROP TRIGGER IF EXISTS password_requirements_audit_trigger ON password_requirements;
CREATE TRIGGER password_requirements_audit_trigger
  AFTER INSERT OR UPDATE ON password_requirements
  FOR EACH ROW
  EXECUTE FUNCTION audit_password_requirement_change();

-- Add additional validation constraint to password_requirements table
ALTER TABLE password_requirements
  DROP CONSTRAINT IF EXISTS check_at_least_one_requirement;

ALTER TABLE password_requirements
  ADD CONSTRAINT check_at_least_one_requirement
  CHECK (
    require_uppercase = true OR
    require_lowercase = true OR
    require_number = true OR
    require_special_char = true
  );
