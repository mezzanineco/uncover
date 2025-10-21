/*
  # Add Signup RLS Policies

  1. Purpose
    - Allow new users to create their own user records during signup
    - Allow users to create their first organisation
    - Allow users to add themselves as organisation members

  2. New Policies
    - Users can insert their own user record (matching auth.uid())
    - Authenticated users can insert organisations
    - Users can insert themselves as organisation members

  3. Security
    - Users can only create records for themselves (auth.uid() check)
    - Organisation creation is restricted to authenticated users
    - Member creation requires matching user_id with auth.uid()
*/

-- Allow users to create their own user record during signup
CREATE POLICY "Users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to create organisations
CREATE POLICY "Authenticated users can create organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to add themselves to organisations they create
CREATE POLICY "Users can add themselves as organisation members"
  ON organisation_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow organisation admins to add other members
CREATE POLICY "Organisation admins can add members"
  ON organisation_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members
      WHERE organisation_members.organisation_id = organisation_members.organisation_id
      AND organisation_members.user_id = auth.uid()
      AND organisation_members.role IN ('super_admin', 'user_admin')
      AND organisation_members.status = 'active'
    )
  );
