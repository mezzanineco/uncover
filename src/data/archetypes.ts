import type { ArchetypeName } from '../types';

export const ARCHETYPE_DATA = {
  Innocent: {
    name: 'Innocent',
    description: 'Optimistic, pure, and honest. Seeks happiness and harmony.',
    traits: ['Optimistic', 'Pure', 'Honest', 'Trustworthy', 'Happy'],
    color: '#fef3c7'
  },
  Everyman: {
    name: 'Everyman',
    description: 'Down-to-earth, relatable, and authentic. Values belonging and connection.',
    traits: ['Relatable', 'Authentic', 'Friendly', 'Practical', 'Inclusive'],
    color: '#d1fae5'
  },
  Hero: {
    name: 'Hero',
    description: 'Courageous, determined, and honorable. Rises to challenges.',
    traits: ['Courageous', 'Determined', 'Honorable', 'Brave', 'Triumphant'],
    color: '#fecaca'
  },
  Outlaw: {
    name: 'Outlaw',
    description: 'Revolutionary, rebellious, and wild. Breaks rules to create change.',
    traits: ['Revolutionary', 'Rebellious', 'Wild', 'Disruptive', 'Free'],
    color: '#c7d2fe'
  },
  Explorer: {
    name: 'Explorer',
    description: 'Adventurous, restless, and pioneering. Seeks freedom and new experiences.',
    traits: ['Adventurous', 'Independent', 'Pioneering', 'Restless', 'Curious'],
    color: '#fed7aa'
  },
  Creator: {
    name: 'Creator',
    description: 'Imaginative, artistic, and inventive. Values self-expression and innovation.',
    traits: ['Creative', 'Imaginative', 'Artistic', 'Inventive', 'Original'],
    color: '#e9d5ff'
  },
  Ruler: {
    name: 'Ruler',
    description: 'Authoritative, responsible, and organized. Seeks control and stability.',
    traits: ['Authoritative', 'Responsible', 'Organized', 'Leader', 'Stable'],
    color: '#fde68a'
  },
  Magician: {
    name: 'Magician',
    description: 'Visionary, inventive, and transformative. Makes dreams reality.',
    traits: ['Visionary', 'Transformative', 'Inventive', 'Inspiring', 'Mystical'],
    color: '#a7f3d0'
  },
  Lover: {
    name: 'Lover',
    description: 'Passionate, devoted, and intimate. Seeks love and relationships.',
    traits: ['Passionate', 'Devoted', 'Intimate', 'Romantic', 'Sensual'],
    color: '#fbb6ce'
  },
  Caregiver: {
    name: 'Caregiver',
    description: 'Caring, nurturing, and generous. Helps and protects others.',
    traits: ['Caring', 'Nurturing', 'Generous', 'Protective', 'Selfless'],
    color: '#bfdbfe'
  },
  Jester: {
    name: 'Jester',
    description: 'Playful, humorous, and lighthearted. Brings joy and fun.',
    traits: ['Playful', 'Humorous', 'Lighthearted', 'Fun', 'Entertaining'],
    color: '#fed7d7'
  },
  Sage: {
    name: 'Sage',
    description: 'Wise, intelligent, and thoughtful. Seeks knowledge and truth.',
    traits: ['Wise', 'Intelligent', 'Thoughtful', 'Knowledgeable', 'Analytical'],
    color: '#d1d5db'
  }
} as const;