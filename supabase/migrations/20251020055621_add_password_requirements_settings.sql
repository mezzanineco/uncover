/*
  # Add Password Requirements Settings

  1. Purpose
    - Allow super admins to configure password requirements
    - Store password policy settings at the organisation level
    - Enable/disable specific password validation rules
    - Configure minimum password length

  2. New Tables
    - `password_requirements` - Stores password policy settings per organisation
      - `id` (uuid, primary key)
      - `organisation_id` (uuid, foreign key to organisations, unique)
      - `min_length` (integer, default 8)
      - `require_uppercase` (boolean, default true)
      - `require_lowercase` (boolean, default true)
      - `require_number` (boolean, default true)
      - `require_special_char` (boolean, default true)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
      - `updated_by` (uuid, foreign key to users)

  3. Security
    - Enable RLS on password_requirements table
    - Organisation members can read requirements (needed for signup/invite forms)
    - Only super admins can update requirements
    - Allow anonymous read for signup/invite flows

  4. Default Settings
    - Create default password requirements for existing organisations
    - Use current requirements as defaults:
      - min_length: 8
      - require_uppercase: true
      - require_lowercase: true
      - require_number: true
      - require_special_char: true
*/

-- Create password_requirements table
CREATE TABLE IF NOT EXISTS password_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id uuid UNIQUE NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  min_length integer DEFAULT 8 CHECK (min_length >= 6 AND min_length <= 128),
  require_uppercase boolean DEFAULT true,
  require_lowercase boolean DEFAULT true,
  require_number boolean DEFAULT true,
  require_special_char boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- Enable Row Level Security
ALTER TABLE password_requirements ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read password requirements (needed for signup/invite forms)
CREATE POLICY "Allow anonymous to read password requirements"
  ON password_requirements
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users to read password requirements
CREATE POLICY "Organisation members can read password requirements"
  ON password_requirements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Only super admins can insert password requirements
CREATE POLICY "Super admins can create password requirements"
  ON password_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

-- Only super admins can update password requirements
CREATE POLICY "Super admins can update password requirements"
  ON password_requirements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_password_requirements_organisation 
  ON password_requirements(organisation_id);

-- Auto-update updated_at timestamp
CREATE TRIGGER update_password_requirements_updated_at 
  BEFORE UPDATE ON password_requirements
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default password requirements for existing organisations
INSERT INTO password_requirements (organisation_id, min_length, require_uppercase, require_lowercase, require_number, require_special_char)
SELECT 
  id,
  8,
  true,
  true,
  true,
  true
FROM organisations
WHERE NOT EXISTS (
  SELECT 1 FROM password_requirements WHERE organisation_id = organisations.id
);
