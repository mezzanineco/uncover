/*
  # Initial Schema for Archetype Finder Application

  1. New Tables
    - `users` - User accounts and profiles
    - `organisations` - Organisation/company data
    - `organisation_members` - User membership in organisations
    - `assessments` - Assessment sessions and configurations
    - `assessment_responses` - Individual question responses
    - `assessment_results` - Calculated archetype results
    - `invites` - Invitation management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access based on organisation membership

  3. Indexes
    - Performance indexes for common queries
    - Foreign key relationships
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  username text UNIQUE,
  avatar text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'))
);

-- Organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo text,
  industry text,
  size text CHECK (size IN ('startup', 'small', 'medium', 'large', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  settings jsonb DEFAULT '{
    "allowGuestParticipants": true,
    "requireConsent": true,
    "dataRetentionDays": 365
  }'::jsonb
);

-- Organisation members table
CREATE TABLE IF NOT EXISTS organisation_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('super_admin', 'facilitator', 'user_admin', 'participant')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  invited_by uuid REFERENCES users(id),
  invited_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organisation_id)
);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  project_id uuid,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  template_id text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'in_progress', 'paused', 'completed', 'archived')),
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  invite_link text,
  room_code text,
  room_code_expiry timestamptz,
  max_participants integer,
  require_consent boolean DEFAULT true,
  allow_anonymous boolean DEFAULT false,
  stats jsonb DEFAULT '{
    "totalInvited": 0,
    "totalStarted": 0,
    "totalCompleted": 0,
    "averageCompletionTime": null
  }'::jsonb
);

-- Assessment responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  participant_token text,
  question_id text NOT NULL,
  response_value jsonb NOT NULL,
  response_timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Assessment results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  participant_token text,
  primary_archetype text NOT NULL,
  secondary_archetype text NOT NULL,
  all_scores jsonb NOT NULL,
  confidence integer NOT NULL,
  completed_at timestamptz NOT NULL,
  section_scores jsonb NOT NULL
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
  assessment_id uuid REFERENCES assessments(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('user_admin', 'participant')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE,
  invited_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  token text UNIQUE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for organisations
CREATE POLICY "Organisation members can read organisation" ON organisations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = organisations.id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Organisation admins can update organisation" ON organisations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = organisations.id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  );

-- RLS Policies for organisation_members
CREATE POLICY "Members can read organisation members" ON organisation_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can manage organisation members" ON organisation_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin')
      AND om.status = 'active'
    )
  );

-- RLS Policies for assessments
CREATE POLICY "Organisation members can read assessments" ON assessments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = assessments.organisation_id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Assessment creators and admins can manage assessments" ON assessments
  FOR ALL TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = assessments.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin', 'facilitator')
      AND status = 'active'
    )
  );

-- RLS Policies for assessment_responses
CREATE POLICY "Users can read own responses" ON assessment_responses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own responses" ON assessment_responses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Assessment admins can read all responses" ON assessment_responses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN organisation_members om ON om.organisation_id = a.organisation_id
      WHERE a.id = assessment_responses.assessment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin', 'facilitator')
      AND om.status = 'active'
    )
  );

-- RLS Policies for assessment_results
CREATE POLICY "Users can read own results" ON assessment_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own results" ON assessment_results
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Assessment admins can read all results" ON assessment_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN organisation_members om ON om.organisation_id = a.organisation_id
      WHERE a.id = assessment_results.assessment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin', 'facilitator')
      AND om.status = 'active'
    )
  );

-- RLS Policies for invites
CREATE POLICY "Organisation members can read invites" ON invites
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can manage invites" ON invites
  FOR ALL TO authenticated
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organisations_slug ON organisations(slug);
CREATE INDEX IF NOT EXISTS idx_organisation_members_user_org ON organisation_members(user_id, organisation_id);
CREATE INDEX IF NOT EXISTS idx_assessments_organisation ON assessments(organisation_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_assessment ON assessment_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user ON assessment_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();