// Core types for the Archetype Finder application

export interface ArchetypeScore {
  archetype: string;
  score: number;
  percentage: number;
}

export interface Response {
  questionId: string;
  value: string | number | string[];
  timestamp: Date;
}

export interface ParsedQuestion {
  id: string;
  question: string;
  format: 'Forced Choice' | 'Word Choice' | 'Word Choice (Multi)' | 'Ranking' | 'Likert Scale' | 'Slider' | 'Image Choice' | 'Story Completion' | 'Scenario';
  category: 'Broad' | 'Clarifier' | 'Validator';
  options?: string[];
  archetypeMapping?: Record<string, Record<string, number>>;
  assetKeys?: string[];
  maxSelections?: number;
  notes?: string;
  status?: 'active' | 'archived';
  usedInSessions?: boolean;
}

interface AssessmentState {
  currentQuestionIndex: number;
  responses: Response[];
  scores: Record<string, number>;
  isComplete: boolean;
}

interface QuestionProps {
  question: ParsedQuestion;
  onAnswer: (answer: string | number | string[]) => void;
  selectedAnswer?: string | number | string[];
}

interface ArchetypeResult {
  name: string;
  score: number;
  percentage: number;
  description: string;
  traits: string[];
  color: string;
}

export interface AssessmentResult {
  primaryArchetype: ArchetypeResult;
  secondaryArchetype: ArchetypeResult;
  allScores: ArchetypeResult[];
  confidence: number;
  completedAt: Date;
  sectionScores: {
    broad: Record<string, number>;
    clarifier: Record<string, number>;
    validator: Record<string, number>;
  };
}

// Archetype definitions
export const ARCHETYPES = [
  'Hero',
  'Magician', 
  'Outlaw',
  'Lover',
  'Jester',
  'Everyman',
  'Caregiver',
  'Ruler',
  'Creator',
  'Innocent',
  'Sage',
  'Explorer'
] as const;

export type ArchetypeName = typeof ARCHETYPES[number];