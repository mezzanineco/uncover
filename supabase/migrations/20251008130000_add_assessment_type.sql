/*
  # Add assessment_type column to assessments table

  1. Changes
    - Add `assessment_type` column to assessments table with values 'solo' or 'team'
    - Default to 'solo' for existing assessments
    - Add check constraint to ensure only valid values

  2. Notes
    - This helps distinguish between solo assessments (one user) and team assessments (multiple participants)
*/

-- Add assessment_type column with default value
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS assessment_type text DEFAULT 'solo'
CHECK (assessment_type IN ('solo', 'team'));

-- Create index for faster filtering by assessment type
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);
