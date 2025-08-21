import { loadQuestionsFromCSV } from './csvLoader';
import type { ParsedQuestion } from '../types';

// Load questions from CSV data
export const QUESTIONS: ParsedQuestion[] = loadQuestionsFromCSV();

export const ASSESSMENT_CONFIG = {
  title: 'Brand Archetype Discovery',
  description: 'Uncover your unique brand archetype mix through our comprehensive assessment',
  timeEstimate: 20,
  questions: QUESTIONS
};