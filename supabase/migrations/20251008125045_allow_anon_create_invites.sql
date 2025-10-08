/*
  # Allow Anonymous Users to Create Invites for Demo

  1. Changes
    - Add policy to allow anonymous users to insert invites
    - This enables the demo to work without authentication

  2. Security
    - Only for demo/development purposes
    - Allows INSERT operations for anon role
*/

-- Allow anonymous users to create invites
CREATE POLICY "Allow anonymous to create invites for demo"
  ON invites
  FOR INSERT
  TO anon
  WITH CHECK (true);
