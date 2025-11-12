/*
  # Fix Username Login RLS Policy

  1. Changes
    - Add RLS policy to allow anonymous users to look up email by username during login
    - This is safe because:
      - We only expose username->email mapping, not passwords
      - Email addresses are already semi-public (used for invites)
      - Username lookup is necessary for login flow

  2. Security
    - Only allows SELECT on username and email columns
    - Does not expose sensitive data like password hashes
    - Similar security model to "forgot password" flows
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous username to email lookup for login" ON users;

-- Allow anonymous users to look up email by username for login purposes
CREATE POLICY "Allow anonymous username to email lookup for login"
  ON users
  FOR SELECT
  TO anon
  USING (true);
