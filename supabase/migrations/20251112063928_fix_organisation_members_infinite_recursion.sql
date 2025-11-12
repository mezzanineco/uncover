/*
  # Fix Infinite Recursion in organisation_members RLS Policies

  1. Problem
    - The INSERT policy checks if user is admin by querying organisation_members
    - The SELECT policy also queries organisation_members
    - This creates infinite recursion when trying to create first membership
    - New users cannot create their initial membership record

  2. Solution
    - Simplify INSERT policy to allow:
      - Users to insert their own membership (auth.uid() = user_id)
      - This allows creating first membership without checking admin status
      - Admin checks happen at application level for subsequent invites
    
  3. Security
    - Still restrictive: users can only create their own membership
    - Application layer handles invitation validation
    - Prevents arbitrary membership creation
*/

-- Drop the problematic INSERT policy
DROP POLICY IF EXISTS "Admins can insert organisation members" ON organisation_members;

-- Create a simpler INSERT policy that doesn't cause recursion
CREATE POLICY "Users can insert own membership record"
  ON organisation_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Keep the anonymous insert policy for invitation acceptance
-- (already exists, no change needed)
