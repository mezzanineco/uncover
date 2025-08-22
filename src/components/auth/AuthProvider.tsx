import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, User, Organisation, OrganisationMember } from '../../types/auth';

interface AuthContextType extends AuthState {
  login: (email: string) => Promise<void>;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  signup: (email: string) => Promise<void>;
  signupWithPassword: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  verifyMagicLink: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    organisation: null,
    member: null,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // Simulate checking for existing session
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Mock user data - in production this would come from API
        const mockUser: User = {
          id: 'user-1',
          email: 'user@example.com',
          name: 'John Doe',
          username: 'johndoe',
          username: 'johndoe',
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
          status: 'active'
        };

        const mockOrganisation: Organisation = {
          id: 'org-1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-1',
          settings: {
            allowGuestParticipants: true,
            requireConsent: true,
            dataRetentionDays: 365
          }
        };

        const mockMember: OrganisationMember = {
          id: 'member-1',
          userId: 'user-1',
          organisationId: 'org-1',
          role: 'user_admin',
          status: 'active',
          joinedAt: new Date('2024-01-01'),
          lastActiveAt: new Date()
        };

        setAuthState({
          user: mockUser,
          organisation: mockOrganisation,
          member: mockMember,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string) => {
    // Simulate sending magic link
    console.log('Sending magic link to:', email);
    // In production, this would make an API call to send the magic link
  };

  const loginWithPassword = async (username: string, password: string) => {
    try {
      // Simulate API call for username/password login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock validation - in production, this would validate against your backend
      if (username === 'demo' && password === 'password') {
        const mockUser: User = {
          id: 'user-1',
          email: 'demo@example.com',
          name: 'Demo User',
          username: 'demo',
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
          status: 'active'
        };

        const mockOrganisation: Organisation = {
          id: 'org-1',
          name: 'Demo Corp',
          slug: 'demo-corp',
          createdAt: new Date('2024-01-01'),
          createdBy: 'user-1',
          settings: {
            allowGuestParticipants: true,
            requireConsent: true,
            dataRetentionDays: 365
          }
        };

        const mockMember: OrganisationMember = {
          id: 'member-1',
          userId: 'user-1',
          organisationId: 'org-1',
          role: 'user_admin',
          status: 'active',
          joinedAt: new Date('2024-01-01'),
          lastActiveAt: new Date()
        };

        // Store auth token
        localStorage.setItem('auth_token', 'mock-jwt-token');

        setAuthState({
          user: mockUser,
          organisation: mockOrganisation,
          member: mockMember,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      throw error;
    }
  };
  const signup = async (email: string) => {
    // Simulate sending magic link for signup
    console.log('Sending signup magic link to:', email);
    // In production, this would make an API call to create user and send magic link
  };

  const signupWithPassword = async (username: string, email: string, password: string) => {
    try {
      // Simulate API call for username/password signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user creation - in production, this would create user in your backend
      const mockUser: User = {
        id: 'user-' + Date.now(),
        email,
        name: username,
        username,
        emailVerified: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        status: 'active'
      };

      const mockOrganisation: Organisation = {
        id: 'org-' + Date.now(),
        name: `${username}'s Organisation`,
        slug: username.toLowerCase().replace(/\s+/g, '-'),
        createdAt: new Date(),
        createdBy: mockUser.id,
        settings: {
          allowGuestParticipants: true,
          requireConsent: true,
          dataRetentionDays: 365
        }
      };

      const mockMember: OrganisationMember = {
        id: 'member-' + Date.now(),
        userId: mockUser.id,
        organisationId: mockOrganisation.id,
        role: 'user_admin',
        status: 'active',
        joinedAt: new Date(),
        lastActiveAt: new Date()
      };

      // Store auth token
      localStorage.setItem('auth_token', 'mock-jwt-token');

      setAuthState({
        user: mockUser,
        organisation: mockOrganisation,
        member: mockMember,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      throw error;
    }
  };
  const verifyMagicLink = async (token: string) => {
    try {
      // Simulate magic link verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful verification
      const mockUser: User = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
        status: 'active'
      };

      const mockOrganisation: Organisation = {
        id: 'org-1',
        name: 'Acme Corp',
        slug: 'acme-corp',
        createdAt: new Date('2024-01-01'),
        createdBy: 'user-1',
        settings: {
          allowGuestParticipants: true,
          requireConsent: true,
          dataRetentionDays: 365
        }
      };

      const mockMember: OrganisationMember = {
        id: 'member-1',
        userId: 'user-1',
        organisationId: 'org-1',
        role: 'user_admin',
        status: 'active',
        joinedAt: new Date('2024-01-01'),
        lastActiveAt: new Date()
      };

      // Store auth token
      localStorage.setItem('auth_token', 'mock-jwt-token');

      setAuthState({
        user: mockUser,
        organisation: mockOrganisation,
        member: mockMember,
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      throw new Error('Magic link verification failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setAuthState({
      user: null,
      organisation: null,
      member: null,
      isLoading: false,
      isAuthenticated: false
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    loginWithPassword,
    signup,
    signupWithPassword,
    logout,
    verifyMagicLink
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}