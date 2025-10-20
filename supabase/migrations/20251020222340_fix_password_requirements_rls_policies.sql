/*
  # Fix Password Requirements RLS Policies

  1. Purpose
    - Allow user_admin and super_admin roles to manage password requirements
    - The original policies only allowed super_admin, but demo data has user_admin

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow both user_admin and super_admin roles
    - Maintain security while supporting the demo environment

  3. Security
    - Only admins (user_admin or super_admin) can create/update requirements
    - All users can read requirements (needed for signup/invite validation)
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Super admins can create password requirements" ON password_requirements;
DROP POLICY IF EXISTS "Super admins can update password requirements" ON password_requirements;

-- Allow user_admin and super_admin to insert password requirements
CREATE POLICY "Admins can create password requirements"
  ON password_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('user_admin', 'super_admin')
      AND status = 'active'
    )
  );

-- Allow user_admin and super_admin to update password requirements
CREATE POLICY "Admins can update password requirements"
  ON password_requirements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('user_admin', 'super_admin')
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = password_requirements.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('user_admin', 'super_admin')
      AND status = 'active'
    )
  );
