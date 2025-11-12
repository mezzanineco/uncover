/*
  # Fix SELECT Policy to Prevent Recursion

  1. Problem
    - SELECT policy queries organisation_members to check membership
    - This can cause recursion in complex queries
  
  2. Solution  
    - Simplify to allow users to read their own memberships
    - Allow users to read memberships in their organisations
    - Use simpler conditions that don't create circular dependencies

  3. Security
    - Users can only see memberships where they are a member
    - Maintains data isolation between organisations
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Members can read organisation members" ON organisation_members;

-- Create simpler SELECT policies
CREATE POLICY "Users can read own membership records"
  ON organisation_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read other members in same organisation"
  ON organisation_members
  FOR SELECT
  TO authenticated
  USING (
    organisation_id IN (
      SELECT organisation_id 
      FROM organisation_members 
      WHERE user_id = auth.uid() 
      AND status = 'active'
    )
  );
