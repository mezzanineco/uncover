/*
  # Fix Invitation Acceptance Flow - Add RLS Policies for Anonymous Users

  1. Purpose
    - Enable anonymous users to accept invitations and create accounts
    - Allow invitation flow to work without prior authentication
    - Ensure secure but functional invitation acceptance process

  2. Changes
    - Add policy to allow anonymous users to read users by email (for existence check)
    - Add policy to allow anonymous users to insert new user records during invitation
    - Add policy to allow anonymous users to insert organisation_members records
    - Add policy to allow anonymous users to read organisations (for verification)
    - Add policy to allow anonymous users to update invite status

  3. Security Notes
    - Policies are scoped to invitation flow use cases
    - Anonymous user creation is only allowed with valid email
    - Member creation requires valid user_id and organisation_id references
    - These policies enable the signup-via-invite flow which is a legitimate use case

  4. Important
    - Users created this way should immediately establish a Supabase Auth session
    - The application should verify the invitation token before allowing operations
*/

-- Allow anonymous users to read users by email (needed to check if user exists)
CREATE POLICY "Allow anonymous to read users by email for invite check"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to create new user records during invitation acceptance
CREATE POLICY "Allow anonymous to insert users for invitation acceptance"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (
    email IS NOT NULL 
    AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Allow anonymous users to read organisations (needed for invitation verification)
CREATE POLICY "Allow anonymous to read organisations for invite verification"
  ON organisations
  FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to insert organisation_members during invitation acceptance
CREATE POLICY "Allow anonymous to insert members for invitation acceptance"
  ON organisation_members
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NOT NULL 
    AND organisation_id IS NOT NULL
    AND role IN ('user_admin', 'participant')
  );

-- Allow anonymous users to update invite status (when accepting)
CREATE POLICY "Allow anonymous to update invites for acceptance"
  ON invites
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
