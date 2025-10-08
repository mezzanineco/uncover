/*
  # Allow Anonymous CRUD for Assessments (Demo Mode)

  1. Purpose
    - Enable demo/development mode where users can create assessments without Supabase Auth
    - Allow full CRUD operations for anonymous users
    
  2. Changes
    - Add policy to allow anonymous users to insert assessments
    - Add policy to allow anonymous users to update assessments
    - Add policy to allow anonymous users to delete assessments
    
  Note: In production, these policies should be removed or restricted
*/

-- Allow anonymous users to insert assessments
CREATE POLICY "Allow anonymous to insert assessments for demo"
  ON assessments
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update assessments
CREATE POLICY "Allow anonymous to update assessments for demo"
  ON assessments
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete assessments
CREATE POLICY "Allow anonymous to delete assessments for demo"
  ON assessments
  FOR DELETE
  TO anon
  USING (true);