/*
  # Add Review Functionality for Admin Dashboard

  1. Changes to assessment_results table
    - Add `review_status` column to track review state (pending, approved, flagged, rejected)
    - Add `reviewed_by` column to track who reviewed the result
    - Add `reviewed_at` column to track when the review occurred
    - Add `review_notes` column for reviewer comments
    - Add `flagged_reason` column for specific flagging reasons
    - Add `response_quality_score` column for automated quality scoring

  2. New table: result_reviews
    - Stores detailed review history and audit trail
    - Tracks all review actions and status changes
    - Enables review comments and collaborative review workflows

  3. Security
    - Enable RLS on result_reviews table
    - Add policies for super_admin and facilitator roles to manage reviews
    - Add policies for viewing review data based on organization membership

  4. Indexes
    - Add indexes on review_status for efficient filtering
    - Add indexes on reviewed_at for date range queries
    - Add composite index on assessment_id and review_status
*/

-- Add review-related columns to assessment_results table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'review_status'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'flagged', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN reviewed_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN reviewed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN review_notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'flagged_reason'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN flagged_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_results' AND column_name = 'response_quality_score'
  ) THEN
    ALTER TABLE assessment_results 
    ADD COLUMN response_quality_score integer DEFAULT 0 CHECK (response_quality_score >= 0 AND response_quality_score <= 100);
  END IF;
END $$;

-- Create result_reviews table for audit trail
CREATE TABLE IF NOT EXISTS result_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  result_id uuid NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users(id),
  previous_status text,
  new_status text NOT NULL CHECK (new_status IN ('pending', 'approved', 'flagged', 'rejected')),
  notes text,
  flagged_reason text,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS on result_reviews
ALTER TABLE result_reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super admins can view all reviews" ON result_reviews;
DROP POLICY IF EXISTS "Facilitators can view org reviews" ON result_reviews;
DROP POLICY IF EXISTS "Admins can create reviews" ON result_reviews;
DROP POLICY IF EXISTS "Admins can update review status" ON assessment_results;

-- Policies for result_reviews table

-- Super admins can view all reviews
CREATE POLICY "Super admins can view all reviews"
  ON result_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members
      WHERE organisation_members.user_id = auth.uid()
      AND organisation_members.role = 'super_admin'
      AND organisation_members.status = 'active'
    )
  );

-- Facilitators can view reviews for their organization's assessments
CREATE POLICY "Facilitators can view org reviews"
  ON result_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessment_results ar
      JOIN assessments a ON ar.assessment_id = a.id
      JOIN organisation_members om ON a.organisation_id = om.organisation_id
      WHERE ar.id = result_reviews.result_id
      AND om.user_id = auth.uid()
      AND om.role IN ('facilitator', 'super_admin')
      AND om.status = 'active'
    )
  );

-- Super admins and facilitators can create reviews
CREATE POLICY "Admins can create reviews"
  ON result_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members om
      JOIN assessment_results ar ON ar.id = result_reviews.result_id
      JOIN assessments a ON ar.assessment_id = a.id
      WHERE om.user_id = auth.uid()
      AND om.organisation_id = a.organisation_id
      AND om.role IN ('super_admin', 'facilitator')
      AND om.status = 'active'
    )
  );

-- Policies for updated assessment_results table

-- Allow admins to update review fields
CREATE POLICY "Admins can update review status"
  ON assessment_results FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN organisation_members om ON a.organisation_id = om.organisation_id
      WHERE a.id = assessment_results.assessment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'facilitator')
      AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN organisation_members om ON a.organisation_id = om.organisation_id
      WHERE a.id = assessment_results.assessment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'facilitator')
      AND om.status = 'active'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessment_results_review_status 
  ON assessment_results(review_status);

CREATE INDEX IF NOT EXISTS idx_assessment_results_reviewed_at 
  ON assessment_results(reviewed_at);

CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_review 
  ON assessment_results(assessment_id, review_status);

CREATE INDEX IF NOT EXISTS idx_result_reviews_result_id 
  ON result_reviews(result_id);

CREATE INDEX IF NOT EXISTS idx_result_reviews_reviewer_id 
  ON result_reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_result_reviews_created_at 
  ON result_reviews(created_at DESC);

-- Create a function to automatically create review audit trail
CREATE OR REPLACE FUNCTION create_review_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.review_status IS DISTINCT FROM NEW.review_status) THEN
    INSERT INTO result_reviews (
      result_id,
      reviewer_id,
      previous_status,
      new_status,
      notes,
      flagged_reason
    ) VALUES (
      NEW.id,
      NEW.reviewed_by,
      OLD.review_status,
      NEW.review_status,
      NEW.review_notes,
      NEW.flagged_reason
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic audit trail
DROP TRIGGER IF EXISTS assessment_results_review_audit ON assessment_results;
CREATE TRIGGER assessment_results_review_audit
  AFTER UPDATE ON assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION create_review_audit_trail();

-- Add comment for documentation
COMMENT ON TABLE result_reviews IS 'Audit trail for assessment result reviews';
COMMENT ON COLUMN assessment_results.review_status IS 'Current review status: pending, approved, flagged, or rejected';
COMMENT ON COLUMN assessment_results.reviewed_by IS 'User who performed the review';
COMMENT ON COLUMN assessment_results.reviewed_at IS 'Timestamp when review was completed';
COMMENT ON COLUMN assessment_results.review_notes IS 'Notes from the reviewer';
COMMENT ON COLUMN assessment_results.response_quality_score IS 'Automated quality score from 0-100 based on response patterns';