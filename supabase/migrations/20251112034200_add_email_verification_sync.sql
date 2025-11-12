/*
  # Sync Email Verification Status from Supabase Auth

  1. Changes
    - Add email_verified_at timestamp column to users table
    - Create trigger to sync email verification status from auth.users
    - Create function to handle email verification updates
    - Update existing users to sync their confirmation status

  2. Purpose
    - Keep public.users table in sync with Supabase Auth confirmation status
    - Track when user email was verified with timestamp
    - Ensure email_verified boolean matches auth.users confirmed_at status

  3. Security
    - Trigger runs with security definer to access auth schema
    - Only updates email verification fields, no other user data
*/

-- Add email_verified_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified_at timestamptz;
  END IF;
END $$;

-- Create function to sync email verification from auth.users
CREATE OR REPLACE FUNCTION public.sync_email_verification()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the public.users table with auth confirmation status
  UPDATE public.users
  SET 
    email_verified = (NEW.email_confirmed_at IS NOT NULL),
    email_verified_at = NEW.email_confirmed_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for INSERT events
-- This catches new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_verification();

-- Create trigger on auth.users for UPDATE events
-- This catches when user confirms their email
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_email_verification();

-- Sync existing users' email verification status
-- This updates any existing users to match their auth status
UPDATE public.users u
SET 
  email_verified = (a.email_confirmed_at IS NOT NULL),
  email_verified_at = a.email_confirmed_at
FROM auth.users a
WHERE u.id = a.id
AND (
  u.email_verified IS DISTINCT FROM (a.email_confirmed_at IS NOT NULL)
  OR u.email_verified_at IS DISTINCT FROM a.email_confirmed_at
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON public.users(email_verified_at);
