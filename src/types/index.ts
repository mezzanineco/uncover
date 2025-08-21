// Core types for the Archetype Finder application

export interface ArchetypeScore {
  archetype: string;
  score: number;
  percentage: number;
}

export interface Response {
  questionId: string;
  answer: string | number | string[];
  scores: Record<string, number>;
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

export interface AssessmentState {
  currentQuestionIndex: number;
  responses: Response[];
  scores: Record<string, number>;
  isComplete: boolean;
}

export interface QuestionProps {
  question: ParsedQuestion;
  onAnswer: (answer: string | number | string[]) => void;
  selectedAnswer?: string | number | string[];
}

export interface ArchetypeResult {
  name: string;
  score: number;
  percentage: number;
  description: string;
  color: string;
}

export interface AssessmentResults {
  primaryArchetype: ArchetypeResult;
  secondaryArchetype: ArchetypeResult;
  allArchetypes: ArchetypeResult[];
  totalQuestions: number;
  completionTime?: number;
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