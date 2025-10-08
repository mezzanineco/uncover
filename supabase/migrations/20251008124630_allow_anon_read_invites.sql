/*
  # Allow Anonymous Access to Invites for Demo

  1. Changes
    - Add policy to allow anonymous users to read invites
    - This enables the demo to work without authentication

  2. Security
    - Only for demo/development purposes
    - Allows SELECT operations for anon role
*/

-- Allow anonymous users to read invites
CREATE POLICY "Allow anonymous to read invites for demo"
  ON invites
  FOR SELECT
  TO anon
  USING (true);
