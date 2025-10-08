/*
  # Initial Schema for Archetype Finder Application

  1. New Tables
    - `users` - User accounts and profiles
      - `id` (uuid, primary key)
      - `email` (text, unique, required)
      - `name` (text, optional)
      - `username` (text, unique, optional)
      - `avatar` (text, optional)
      - `email_verified` (boolean, default false)
      - `created_at` (timestamptz, default now)
      - `last_login_at` (timestamptz, optional)
      - `status` (text, default 'active', check constraint)

    - `organisations` - Organisation/company data
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `slug` (text, unique, required)
      - `logo` (text, optional)
      - `industry` (text, optional)
      - `size` (text, check constraint)
      - `created_at` (timestamptz, default now)
      - `created_by` (uuid, foreign key to users)
      - `settings` (jsonb, includes guest participants, consent, retention policies)

    - `organisation_members` - User membership in organisations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `organisation_id` (uuid, foreign key to organisations)
      - `role` (text, check constraint: super_admin, facilitator, user_admin, participant)
      - `status` (text, check constraint: active, invited, suspended)
      - `invited_by` (uuid, optional foreign key to users)
      - `invited_at` (timestamptz, optional)
      - `joined_at` (timestamptz, default now)
      - `last_active_at` (timestamptz, default now)
      - Unique constraint on (user_id, organisation_id)

    - `assessments` - Assessment sessions and configurations
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `project_id` (uuid, optional)
      - `organisation_id` (uuid, foreign key to organisations)
      - `template_id` (text, required)
      - `status` (text, check constraint: draft, active, in_progress, paused, completed, archived)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
      - `invite_link` (text, optional)
      - `room_code` (text, optional)
      - `room_code_expiry` (timestamptz, optional)
      - `max_participants` (integer, optional)
      - `require_consent` (boolean, default true)
      - `allow_anonymous` (boolean, default false)
      - `stats` (jsonb, tracking invited, started, completed counts and completion time)

    - `assessment_responses` - Individual question responses
      - `id` (uuid, primary key)
      - `assessment_id` (uuid, foreign key to assessments)
      - `user_id` (uuid, optional foreign key to users)
      - `participant_token` (text, optional for anonymous participants)
      - `question_id` (text, required)
      - `response_value` (jsonb, stores the answer)
      - `response_timestamp` (timestamptz, required)
      - `created_at` (timestamptz, default now)

    - `assessment_results` - Calculated archetype results
      - `id` (uuid, primary key)
      - `assessment_id` (uuid, foreign key to assessments)
      - `user_id` (uuid, optional foreign key to users)
      - `participant_token` (text, optional)
      - `primary_archetype` (text, required)
      - `secondary_archetype` (text, required)
      - `all_scores` (jsonb, stores all archetype scores)
      - `confidence` (integer, required)
      - `completed_at` (timestamptz, required)
      - `section_scores` (jsonb, stores scores by category)

    - `invites` - Invitation management
      - `id` (uuid, primary key)
      - `email` (text, required)
      - `organisation_id` (uuid, foreign key to organisations)
      - `assessment_id` (uuid, optional foreign key to assessments)
      - `role` (text, check constraint: user_admin, participant)
      - `status` (text, check constraint: pending, accepted, expired, revoked)
      - `invited_by` (uuid, foreign key to users)
      - `invited_at` (timestamptz, default now)
      - `expires_at` (timestamptz, required)
      - `token` (text, unique, required)

  2. Security
    - Enable RLS on all tables
    - Users can read and update their own data
    - Organisation members can read their organisation and other members
    - Admins can update organisations and manage members
    - Assessment creators and admins can manage assessments
    - Users can manage their own responses and results
    - Assessment admins can read all responses and results for their assessments
    - Organisation members can read invites, admins can manage them

  3. Indexes
    - Performance indexes for common queries on:
      - users.email
      - organisations.slug
      - organisation_members (user_id, organisation_id)
      - assessments.organisation_id
      - assessment_responses (assessment_id, user_id)
      - assessment_results.assessment_id
      - invites (email, token)

  4. Triggers
    - Auto-update `updated_at` timestamp on assessments table
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
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for organisations
CREATE POLICY "Organisation members can read organisation"
  ON organisations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = organisations.id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Organisation admins can update organisation"
  ON organisations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = organisations.id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = organisations.id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create organisations"
  ON organisations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- RLS Policies for organisation_members
CREATE POLICY "Members can read organisation members"
  ON organisation_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can insert organisation members"
  ON organisation_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin')
      AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can update organisation members"
  ON organisation_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin')
      AND om.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organisation_members om
      WHERE om.organisation_id = organisation_members.organisation_id 
      AND om.user_id = auth.uid()
      AND om.role IN ('super_admin', 'user_admin')
      AND om.status = 'active'
    )
  );

CREATE POLICY "Admins can delete organisation members"
  ON organisation_members
  FOR DELETE
  TO authenticated
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
CREATE POLICY "Organisation members can read assessments"
  ON assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = assessments.organisation_id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create assessments"
  ON assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Assessment creators and admins can update assessments"
  ON assessments
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = assessments.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin', 'facilitator')
      AND status = 'active'
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = assessments.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin', 'facilitator')
      AND status = 'active'
    )
  );

CREATE POLICY "Assessment creators and admins can delete assessments"
  ON assessments
  FOR DELETE
  TO authenticated
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
CREATE POLICY "Users can read own responses"
  ON assessment_responses
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own responses"
  ON assessment_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Assessment admins can read all responses"
  ON assessment_responses
  FOR SELECT
  TO authenticated
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
CREATE POLICY "Users can read own results"
  ON assessment_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own results"
  ON assessment_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Assessment admins can read all results"
  ON assessment_results
  FOR SELECT
  TO authenticated
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
CREATE POLICY "Organisation members can read invites"
  ON invites
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can insert invites"
  ON invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can update invites"
  ON invites
  FOR UPDATE
  TO authenticated
  USING (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  )
  WITH CHECK (
    invited_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organisation_members 
      WHERE organisation_id = invites.organisation_id 
      AND user_id = auth.uid()
      AND role IN ('super_admin', 'user_admin')
      AND status = 'active'
    )
  );

CREATE POLICY "Admins can delete invites"
  ON invites
  FOR DELETE
  TO authenticated
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