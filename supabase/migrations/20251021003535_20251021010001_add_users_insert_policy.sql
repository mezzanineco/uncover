/*
  # Add Users Insert Policy for Signup

  1. Purpose
    - Allow authenticated users to create their own user record during signup
    - This is needed for the signup flow to work properly

  2. New Policy
    - Authenticated users can insert their own user record
    - The user ID must match their auth.uid()

  3. Security
    - Users can only create records for themselves (id = auth.uid())
    - This prevents users from creating records for other users
    - User creation is protected by Supabase Auth

  Note: This policy was updated to use `id = auth.uid()` instead of `true`
  to ensure users can only create records matching their auth ID.
*/

-- Allow authenticated users to create their own user record
-- The ID must match their auth.uid() for security
CREATE POLICY "Authenticated users can insert own record"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());