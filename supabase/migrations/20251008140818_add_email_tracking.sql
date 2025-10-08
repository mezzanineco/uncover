/*
  # Add Email Tracking for Invites

  1. Schema Changes
    - Add `email_sent_at` to invites table - timestamp when email was sent
    - Add `email_delivered_at` to invites table - timestamp when email was delivered
    - Add `email_opened_at` to invites table - timestamp when email was opened
    - Add `email_error` to invites table - stores any email delivery errors
    - Add `accepted_at` to invites table - timestamp when invite was accepted
    - Add `resend_count` to invites table - tracks how many times invite was resent

  2. Important Notes
    - These fields support full email lifecycle tracking
    - Helps with debugging delivery issues
    - Enables analytics on invite acceptance rates
*/

-- Add email tracking fields to invites table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN email_sent_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'email_delivered_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN email_delivered_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'email_opened_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN email_opened_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'email_error'
  ) THEN
    ALTER TABLE invites ADD COLUMN email_error text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'accepted_at'
  ) THEN
    ALTER TABLE invites ADD COLUMN accepted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invites' AND column_name = 'resend_count'
  ) THEN
    ALTER TABLE invites ADD COLUMN resend_count integer DEFAULT 0;
  END IF;
END $$;

-- Create index for email tracking queries
CREATE INDEX IF NOT EXISTS idx_invites_email_tracking ON invites(email_sent_at, status);