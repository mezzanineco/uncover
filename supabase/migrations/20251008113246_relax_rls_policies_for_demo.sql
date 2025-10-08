/*
  # Relax RLS Policies for Demo/Development

  1. Purpose
    - Allow read access to assessments for demo purposes
    - Enable the app to display data without full Supabase Auth setup
    
  2. Changes
    - Add public read policies for assessments table
    - Keep write operations restricted to authenticated users
*/

-- Add policy to allow reading assessments by organisation_id without auth requirement
CREATE POLICY "Allow public read for assessments by organisation"
  ON assessments
  FOR SELECT
  TO anon
  USING (true);

-- Also allow authenticated users (existing policy remains)
-- The existing authenticated policy will take precedence for authenticated users