import { createContext, useContext } from 'react';
import type { User, Organisation, OrganisationMember } from '../types/auth';

export interface AuthState {
  user: User | null;
  organisation: Organisation | null;
  member: OrganisationMember | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (emailOrUsername: string, password?: string) => Promise<void>;
  signup: (emailOrUsernameOrEmail: string, emailOrPassword?: string, password?: string) => Promise<void>;
  logout: () => void;
  verifyMagicLink: (token: string) => Promise<void>;
  resendConfirmationEmail?: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}