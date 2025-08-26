// Authentication and user management types

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  status: 'active' | 'suspended' | 'pending';
}

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  industry?: string;
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  createdAt: Date;
  createdBy: string;
  settings: {
    allowGuestParticipants: boolean;
    requireConsent: boolean;
    dataRetentionDays: number;
  };
}

export interface OrganisationMember {
  id: string;
  userId: string;
  organisationId: string;
  role: 'super_admin' | 'facilitator' | 'user_admin' | 'participant';
  status: 'active' | 'invited' | 'suspended';
  invitedBy?: string;
  invitedAt?: Date;
  joinedAt?: Date;
  lastActiveAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  organisationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assessmentCount: number;
  status: 'active' | 'archived';
}

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  organisationId: string;
  templateId: string;
  status: 'draft' | 'active' | 'in_progress' | 'paused' | 'completed' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Participant management
  inviteLink?: string;
  roomCode?: string;
  roomCodeExpiry?: Date;
  maxParticipants?: number;
  requireConsent: boolean;
  allowAnonymous: boolean;
  
  // Statistics
  stats: {
    totalInvited: number;
    totalStarted: number;
    totalCompleted: number;
    averageCompletionTime?: number;
  };
}

export interface Participant {
  id: string;
  assessmentId: string;
  organisationId: string;
  userId?: string; // null for guest participants
  email?: string;
  name?: string;
  status: 'invited' | 'started' | 'completed' | 'abandoned';
  invitedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  isGuest: boolean;
  claimToken?: string; // for guest account claiming
  responses?: any[];
  results?: any;
}

export interface Invite {
  id: string;
  email: string;
  organisationId: string;
  assessmentId?: string; // null for org invites
  role: 'user_admin' | 'participant';
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  token: string;
}

export interface MagicLink {
  id: string;
  email: string;
  token: string;
  type: 'signup' | 'login' | 'invite' | 'claim';
  expiresAt: Date;
  usedAt?: Date;
  metadata?: {
    inviteId?: string;
    claimToken?: string;
    organisationId?: string;
  };
}

export interface PDFExport {
  id: string;
  assessmentId: string;
  organisationId: string;
  type: 'individual' | 'consolidated' | 'summary';
  filename: string;
  url: string;
  generatedBy: string;
  generatedAt: Date;
  downloadCount: number;
  lastDownloadedAt?: Date;
}

export interface AuthState {
  user: User | null;
  organisation: Organisation | null;
  member: OrganisationMember | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface DashboardStats {
  projectCount: number;
  assessmentCount: number;
  totalParticipants: number;
  completedAssessments: number;
  recentActivity: Array<{
    id: string;
    type: 'assessment_created' | 'participant_completed' | 'invite_sent';
    description: string;
    timestamp: Date;
  }>;
}

// Permission checking
export const PERMISSIONS = {
  // Organisation management
  MANAGE_ORGANISATION: ['super_admin', 'user_admin'],
  VIEW_ORGANISATION: ['super_admin', 'facilitator', 'user_admin'],
  
  // Project management
  CREATE_PROJECT: ['super_admin', 'facilitator', 'user_admin'],
  EDIT_PROJECT: ['super_admin', 'facilitator', 'user_admin'],
  DELETE_PROJECT: ['super_admin', 'user_admin'],
  
  // Assessment management
  CREATE_ASSESSMENT: ['super_admin', 'facilitator', 'user_admin'],
  EDIT_ASSESSMENT: ['super_admin', 'facilitator', 'user_admin'],
  DELETE_ASSESSMENT: ['super_admin', 'user_admin'],
  VIEW_RESULTS: ['super_admin', 'facilitator', 'user_admin'],
  EXPORT_RESULTS: ['super_admin', 'facilitator', 'user_admin'],
  
  // Team management
  INVITE_MEMBERS: ['super_admin', 'user_admin'],
  MANAGE_MEMBERS: ['super_admin', 'user_admin'],
  VIEW_MEMBERS: ['super_admin', 'facilitator', 'user_admin'],
  
  // System administration
  MANAGE_TEMPLATES: ['super_admin', 'facilitator'],
  VIEW_AUDIT_LOG: ['super_admin', 'user_admin'],
} as const;

export function hasPermission(
  role: OrganisationMember['role'], 
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(role);
}

export function canAccessRoute(
  role: OrganisationMember['role'], 
  route: string
): boolean {
  const routePermissions: Record<string, keyof typeof PERMISSIONS> = {
    '/dashboard': 'VIEW_ORGANISATION',
    '/projects': 'VIEW_ORGANISATION',
    '/assessments': 'VIEW_ORGANISATION',
    '/team': 'VIEW_MEMBERS',
    '/settings': 'VIEW_ORGANISATION',
    '/admin': 'MANAGE_TEMPLATES',
  };
  
  const requiredPermission = routePermissions[route];
  return requiredPermission ? hasPermission(role, requiredPermission) : false;
}