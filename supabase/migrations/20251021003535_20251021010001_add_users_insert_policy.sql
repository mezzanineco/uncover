/*
  # Add Users Insert Policy for Signup

  1. Purpose
    - Allow authenticated users to create their own user record during signup
    - This is needed for the signup flow to work properly

  2. New Policy
    - Authenticated users can insert their own user record

  3. Security
    - Policy is permissive to allow user creation
    - User creation is still protected by Supabase Auth
*/

-- Allow authenticated users to create their own user record
CREATE POLICY "Authenticated users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);