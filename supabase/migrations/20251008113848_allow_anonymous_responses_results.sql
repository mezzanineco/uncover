/*
  # Allow Anonymous Access for Assessment Responses and Results (Demo Mode)

  1. Purpose
    - Enable demo/development mode for assessment responses and results
    - Allow anonymous users to save responses and results
    
  2. Changes
    - Add policies for assessment_responses table
    - Add policies for assessment_results table
    
  Note: In production, these policies should be removed or restricted
*/

-- Assessment Responses Policies
CREATE POLICY "Allow anonymous to read assessment_responses for demo"
  ON assessment_responses
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to insert assessment_responses for demo"
  ON assessment_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to update assessment_responses for demo"
  ON assessment_responses
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Assessment Results Policies
CREATE POLICY "Allow anonymous to read assessment_results for demo"
  ON assessment_results
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anonymous to insert assessment_results for demo"
  ON assessment_results
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous to update assessment_results for demo"
  ON assessment_results
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);