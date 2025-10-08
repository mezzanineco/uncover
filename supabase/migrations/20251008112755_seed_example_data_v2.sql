/*
  # Seed Example Assessment Data

  1. Purpose
    - Create sample users for demonstration
    - Create sample organisation
    - Add organisation members
    - Create example assessments showing various stages:
      - Solo assessments (draft, in_progress, completed)
      - Group/team surveys (active with participants, completed)
    
  2. Sample Data Includes
    - 3 demo users
    - 1 demo organisation
    - 3 organisation members
    - 6 assessments:
      - 2 solo assessments (1 in_progress, 1 completed)
      - 4 team assessments (1 draft, 1 active, 1 in_progress, 1 completed)
    - Sample responses and results for completed assessments
*/

-- Create demo users
INSERT INTO users (id, email, name, username, email_verified, status, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'demo@example.com', 'Demo User', 'demo', true, 'active', NOW() - INTERVAL '30 days'),
  ('550e8400-e29b-41d4-a716-446655440002', 'sarah.johnson@example.com', 'Sarah Johnson', 'sarah', true, 'active', NOW() - INTERVAL '25 days'),
  ('550e8400-e29b-41d4-a716-446655440003', 'mike.chen@example.com', 'Mike Chen', 'mike', true, 'active', NOW() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Create demo organisation
INSERT INTO organisations (id, name, slug, created_by, industry, size, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440010', 'Demo Corporation', 'demo-corp', '550e8400-e29b-41d4-a716-446655440001', 'technology', 'medium', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- Add organisation members
INSERT INTO organisation_members (id, user_id, organisation_id, role, status, joined_at, last_active_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'user_admin', 'active', NOW() - INTERVAL '30 days', NOW()),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440010', 'participant', 'active', NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'participant', 'active', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Create example assessments
INSERT INTO assessments (id, name, description, organisation_id, template_id, status, created_by, created_at, updated_at, require_consent, allow_anonymous, stats)
VALUES 
  -- Solo Assessment - In Progress
  ('550e8400-e29b-41d4-a716-446655440100', 
   'My Personal Brand Discovery', 
   'Solo archetype assessment to discover my personal brand identity',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'in_progress',
   '550e8400-e29b-41d4-a716-446655440001',
   NOW() - INTERVAL '2 days',
   NOW() - INTERVAL '1 hour',
   true,
   false,
   '{"totalInvited": 1, "totalStarted": 1, "totalCompleted": 0, "averageCompletionTime": null}'::jsonb),

  -- Solo Assessment - Completed
  ('550e8400-e29b-41d4-a716-446655440101',
   'Brand Archetype Self-Assessment',
   'Completed personal brand archetype evaluation',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'completed',
   '550e8400-e29b-41d4-a716-446655440002',
   NOW() - INTERVAL '15 days',
   NOW() - INTERVAL '14 days',
   true,
   false,
   '{"totalInvited": 1, "totalStarted": 1, "totalCompleted": 1, "averageCompletionTime": 18}'::jsonb),

  -- Team Survey - Draft
  ('550e8400-e29b-41d4-a716-446655440102',
   'Q1 Marketing Team Assessment',
   'Quarterly brand alignment assessment for marketing team',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'draft',
   '550e8400-e29b-41d4-a716-446655440001',
   NOW() - INTERVAL '1 day',
   NOW() - INTERVAL '1 day',
   true,
   false,
   '{"totalInvited": 0, "totalStarted": 0, "totalCompleted": 0, "averageCompletionTime": null}'::jsonb),

  -- Team Survey - Active (participants invited but not all completed)
  ('550e8400-e29b-41d4-a716-446655440103',
   'Leadership Team Brand Alignment',
   'Executive team archetype assessment for strategic planning',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'active',
   '550e8400-e29b-41d4-a716-446655440001',
   NOW() - INTERVAL '10 days',
   NOW() - INTERVAL '5 days',
   true,
   false,
   '{"totalInvited": 8, "totalStarted": 6, "totalCompleted": 4, "averageCompletionTime": 16}'::jsonb),

  -- Team Survey - In Progress (some started, some completed)
  ('550e8400-e29b-41d4-a716-446655440104',
   'Product Team Workshop',
   'Brand archetype workshop for product development team',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'in_progress',
   '550e8400-e29b-41d4-a716-446655440001',
   NOW() - INTERVAL '7 days',
   NOW() - INTERVAL '2 days',
   true,
   true,
   '{"totalInvited": 12, "totalStarted": 10, "totalCompleted": 7, "averageCompletionTime": 14}'::jsonb),

  -- Team Survey - Completed
  ('550e8400-e29b-41d4-a716-446655440105',
   'Sales Team Brand Assessment',
   'Completed brand archetype analysis for sales team',
   '550e8400-e29b-41d4-a716-446655440010',
   'template-1',
   'completed',
   '550e8400-e29b-41d4-a716-446655440001',
   NOW() - INTERVAL '20 days',
   NOW() - INTERVAL '18 days',
   true,
   false,
   '{"totalInvited": 6, "totalStarted": 6, "totalCompleted": 6, "averageCompletionTime": 15}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add some sample responses for the in-progress solo assessment
INSERT INTO assessment_responses (assessment_id, user_id, question_id, response_value, response_timestamp, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'q1', '"Explorer"'::jsonb, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'q2', '"Innovation"'::jsonb, NOW() - INTERVAL '59 minutes', NOW() - INTERVAL '59 minutes'),
  ('550e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440001', 'q3', '"Adventure"'::jsonb, NOW() - INTERVAL '58 minutes', NOW() - INTERVAL '58 minutes')
ON CONFLICT (id) DO NOTHING;

-- Add sample results for completed solo assessment
INSERT INTO assessment_results (assessment_id, user_id, primary_archetype, secondary_archetype, all_scores, confidence, completed_at, section_scores)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440101', 
   '550e8400-e29b-41d4-a716-446655440002',
   'Explorer',
   'Creator',
   '[
     {"name": "Explorer", "score": 85, "percentage": 28.5},
     {"name": "Creator", "score": 78, "percentage": 26.1},
     {"name": "Hero", "score": 65, "percentage": 21.8},
     {"name": "Sage", "score": 52, "percentage": 17.4},
     {"name": "Magician", "score": 45, "percentage": 15.1}
   ]'::jsonb,
   87,
   NOW() - INTERVAL '14 days',
   '{
     "broad": {"Explorer": 30, "Creator": 28, "Hero": 22},
     "clarifier": {"Explorer": 28, "Creator": 26, "Hero": 21},
     "validator": {"Explorer": 27, "Creator": 24, "Hero": 22}
   }'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add sample results for completed team assessment
INSERT INTO assessment_results (assessment_id, user_id, primary_archetype, secondary_archetype, all_scores, confidence, completed_at, section_scores)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440105', 
   '550e8400-e29b-41d4-a716-446655440001',
   'Hero',
   'Ruler',
   '[
     {"name": "Hero", "score": 88, "percentage": 29.5},
     {"name": "Ruler", "score": 82, "percentage": 27.5},
     {"name": "Explorer", "score": 68, "percentage": 22.8},
     {"name": "Magician", "score": 48, "percentage": 16.1}
   ]'::jsonb,
   91,
   NOW() - INTERVAL '18 days',
   '{
     "broad": {"Hero": 32, "Ruler": 30, "Explorer": 24},
     "clarifier": {"Hero": 30, "Ruler": 28, "Explorer": 22},
     "validator": {"Hero": 26, "Ruler": 24, "Explorer": 22}
   }'::jsonb),
  ('550e8400-e29b-41d4-a716-446655440105',
   '550e8400-e29b-41d4-a716-446655440002',
   'Creator',
   'Sage',
   '[
     {"name": "Creator", "score": 86, "percentage": 28.8},
     {"name": "Sage", "score": 79, "percentage": 26.5},
     {"name": "Explorer", "score": 71, "percentage": 23.8}
   ]'::jsonb,
   89,
   NOW() - INTERVAL '18 days',
   '{
     "broad": {"Creator": 31, "Sage": 29, "Explorer": 25},
     "clarifier": {"Creator": 29, "Sage": 27, "Explorer": 24},
     "validator": {"Creator": 26, "Sage": 23, "Explorer": 22}
   }'::jsonb)
ON CONFLICT (id) DO NOTHING;