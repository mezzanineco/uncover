/*
  # Allow Anonymous Invite Deletion

  1. Changes
    - Add RLS policy to allow anonymous users to delete invites
    - This enables the cancel/remove functionality for demo users
  
  2. Security
    - Policy allows anonymous users to delete any invite for demo purposes
    - In production, this should be restricted based on ownership or organization membership
*/

-- Allow anonymous users to delete invites (for demo purposes)
CREATE POLICY "Allow anonymous to delete invites for demo"
  ON invites
  FOR DELETE
  TO anon
  USING (true);
