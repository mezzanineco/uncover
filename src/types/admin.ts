// Admin-specific types and interfaces

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'facilitator' | 'client_admin';
  clientId?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

interface Client {
  id: string;
  name: string;
  slug: string;
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    subdomain?: string;
  };
  createdAt: Date;
  createdBy: string;
}

export interface QuestionBank {
  id: string;
  version: string;
  status: 'draft' | 'published' | 'archived';
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  publishedAt?: Date;
  questionCount: number;
}

interface AssessmentTemplate {
  id: string;
  name: string;
  description?: string;
  bankId: string;
  bankVersion: string;
  config: {
    broadQuestions: string[]; // QIDs
    clarifierQuestions: string[]; // QIDs
    validatorQuestions: string[]; // QIDs
    shuffleWithinSections: boolean;
    timeLimit?: number;
  };
  assets: Record<string, string>; // Asset key to URL mapping
  createdBy: string;
  createdAt: Date;
  clientId?: string;
}

export interface Session {
  id: string;
  name: string;
  templateId: string;
  mode: 'workshop' | 'async';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  joinLink: string;
  roomCode: string;
  clientId?: string;
  facilitatorId: string;
  config: {
    maxParticipants?: number;
    expiresAt?: Date;
    allowAnonymous: boolean;
    showLiveResults: boolean;
  };
  stats: {
    participantCount: number;
    completedCount: number;
    averageCompletionTime?: number;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

interface Participant {
  id: string;
  sessionId: string;
  token: string;
  name?: string;
  email?: string;
  joinedAt: Date;
  completedAt?: Date;
  status: 'joined' | 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex?: number;
  responses: Response[];
  scores?: ArchetypeScore[];
}

export interface SessionStats {
  totalParticipants: number;
  completedAssessments: number;
  averageCompletionTime: number;
  topArchetypes: Array<{
    archetype: string;
    count: number;
    percentage: number;
  }>;
  completionRate: number;
}

export interface AdminDashboardStats {
  totalSessions: number;
  activeSessions: number;
  totalParticipants: number;
  completedAssessments: number;
  recentSessions: Session[];
  popularArchetypes: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
}

interface Asset {
  key: string;
  url: string;
  altText?: string;
  category: 'image' | 'icon' | 'document';
  uploadedBy: string;
  uploadedAt: Date;
}

// Permission checking
const PERMISSIONS = {
  MANAGE_QUESTION_BANKS: ['super_admin'],
  MANAGE_ARCHETYPES: ['super_admin'],
  MANAGE_CLIENTS: ['super_admin', 'facilitator'],
  CREATE_SESSIONS: ['super_admin', 'facilitator'],
  VIEW_ALL_RESULTS: ['super_admin'],
  VIEW_CLIENT_RESULTS: ['super_admin', 'facilitator', 'client_admin'],
  EXPORT_DATA: ['super_admin', 'facilitator'],
  MANAGE_WHITE_LABELING: ['super_admin', 'facilitator'],
} as const;

function hasPermission(userRole: User['role'], permission: keyof typeof PERMISSIONS): boolean {
  return PERMISSIONS[permission].includes(userRole);
}