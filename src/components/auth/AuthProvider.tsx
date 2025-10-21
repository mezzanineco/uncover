import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { userService, organisationService, memberService } from '../../services/database';
import type { User, Organisation, OrganisationMember } from '../../types/auth';
import { AuthContext, type AuthContextType, type AuthState } from '../../contexts/AuthContext';

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
    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.id, session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          organisation: null,
          member: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      // Check for existing Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserData(session.user.id, session.user.email!);
      } else {
        // Fallback to localStorage for demo purposes
        const token = localStorage.getItem('auth_token');
        if (token) {
          await loadDemoUserData();
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadUserData = async (userId: string, email: string) => {
    try {
      console.log('Loading user data for:', email);
      // Get user data
      let user = await userService.getUserByEmail(email);

      if (!user) {
        // Create user if doesn't exist
        console.log('User not found in database, creating...');
        user = await userService.createUser({
          id: userId,
          email,
          name: email.split('@')[0]
        });
        console.log('User created in database:', user.id);
      }

      // Get user's organisation memberships
      console.log('Looking for organisation memberships...');
      const { data: memberships } = await supabase
        .from('organisation_members')
        .select(`
          *,
          organisations (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      if (memberships && memberships.length > 0) {
        console.log('Found existing organisation membership');
        const membership = memberships[0];
        const organisation = membership.organisations;

        setAuthState({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
            emailVerified: user.email_verified,
            createdAt: new Date(user.created_at),
            lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
            status: user.status as 'active' | 'suspended' | 'pending'
          },
          organisation: {
            id: organisation.id,
            name: organisation.name,
            slug: organisation.slug,
            logo: organisation.logo,
            industry: organisation.industry,
            size: organisation.size,
            createdAt: new Date(organisation.created_at),
            createdBy: organisation.created_by,
            settings: organisation.settings
          },
          member: {
            id: membership.id,
            userId: membership.user_id,
            organisationId: membership.organisation_id,
            role: membership.role,
            status: membership.status,
            invitedBy: membership.invited_by,
            invitedAt: membership.invited_at ? new Date(membership.invited_at) : undefined,
            joinedAt: membership.joined_at ? new Date(membership.joined_at) : undefined,
            lastActiveAt: membership.last_active_at ? new Date(membership.last_active_at) : undefined
          },
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        // User has no organisation, create a default one
        console.log('No organisation found, creating default organisation...');
        await createDefaultOrganisation(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const loadDemoUserData = async () => {
    // Keep existing demo functionality for development
    const mockUser: User = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'demo@example.com',
      name: 'Demo User',
      username: 'demo',
      emailVerified: true,
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date(),
      status: 'active'
    };

    const mockOrganisation: Organisation = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'Demo Corporation',
      slug: 'demo-corp',
      createdAt: new Date('2024-01-01'),
      createdBy: '550e8400-e29b-41d4-a716-446655440001',
      settings: {
        allowGuestParticipants: true,
        requireConsent: true,
        dataRetentionDays: 365
      }
    };

    const mockMember: OrganisationMember = {
      id: '550e8400-e29b-41d4-a716-446655440020',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      organisationId: '550e8400-e29b-41d4-a716-446655440010',
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
  };

  const createDefaultOrganisation = async (user: any) => {
    try {
      // Create default organisation
      const organisation = await organisationService.createOrganisation({
        name: `${user.name || user.email.split('@')[0]}'s Organisation`,
        slug: `${user.email.split('@')[0]}-org-${Date.now()}`,
        createdBy: user.id,
        industry: 'other',
        size: 'small'
      });

      // Add user as admin
      const membership = await memberService.addMember({
        userId: user.id,
        organisationId: organisation.id,
        role: 'user_admin'
      });

      setAuthState({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          emailVerified: user.email_verified,
          createdAt: new Date(user.created_at),
          lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : undefined,
          status: user.status as 'active' | 'suspended' | 'pending'
        },
        organisation: {
          id: organisation.id,
          name: organisation.name,
          slug: organisation.slug,
          logo: organisation.logo,
          industry: organisation.industry,
          size: organisation.size,
          createdAt: new Date(organisation.created_at),
          createdBy: organisation.created_by,
          settings: organisation.settings
        },
        member: {
          id: membership.id,
          userId: membership.user_id,
          organisationId: membership.organisation_id,
          role: membership.role,
          status: membership.status,
          invitedBy: membership.invited_by,
          invitedAt: membership.invited_at ? new Date(membership.invited_at) : undefined,
          joinedAt: membership.joined_at ? new Date(membership.joined_at) : undefined,
          lastActiveAt: membership.last_active_at ? new Date(membership.last_active_at) : undefined
        },
        isLoading: false,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Error creating default organisation:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (emailOrUsername: string, password?: string) => {
    // If password is provided, do password login
    if (password) {
      return loginWithPassword(emailOrUsername, password);
    }
    
    // Otherwise, send magic link
    console.log('Sending magic link to:', emailOrUsername);
    // In production, this would make an API call to send the magic link
  };

  const loginWithPassword = async (username: string, password: string) => {
    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.includes('@') ? username : `${username}@example.com`,
        password
      });

      if (data.user && !error) {
        await loadUserData(data.user.id, data.user.email!);
        return;
      }

      // If Supabase auth fails, check for demo credentials
      if (error && (username === 'demo' || username === 'super') && password === 'password') {
        // For demo mode, create a temporary Supabase session
        await createDemoSupabaseSession(username);
      } else if (error) {
        throw new Error('Invalid username or password');
      }
    } catch (error) {
      throw error;
    }
  };

  const createDemoSupabaseSession = async (username: string) => {
    try {
      // Try to sign up demo user in Supabase for database operations
      const email = username === 'super' ? 'super@example.com' : 'demo@example.com';
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'password123',
        options: {
          data: { 
            username,
            name: username === 'super' ? 'Super Admin' : 'Demo User'
          }
        }
      });

      if (data.user) {
        await loadUserData(data.user.id, email);
        return;
      }

      // If signup fails (user might already exist), try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123'
      });

      if (signInData.user) {
        await loadUserData(signInData.user.id, email);
        return;
      }

      // If both fail, fall back to mock data
      await loadDemoUserByUsername(username);
    } catch (error) {
      console.warn('Failed to create Supabase session, using mock data:', error);
      await loadDemoUserByUsername(username);
    }
  };

  const loadDemoUserByUsername = async (username?: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (username && (username === 'demo' || username === 'super')) {
        // Use database IDs that match seed data
        const mockUser: User = {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'demo@example.com',
          name: 'Demo User',
          username: username,
          emailVerified: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
          status: 'active'
        };

        const mockOrganisation: Organisation = {
          id: '550e8400-e29b-41d4-a716-446655440010',
          name: 'Demo Corporation',
          slug: 'demo-corp',
          createdAt: new Date('2024-01-01'),
          createdBy: '550e8400-e29b-41d4-a716-446655440001',
          settings: {
            allowGuestParticipants: true,
            requireConsent: true,
            dataRetentionDays: 365
          }
        };

        const mockMember: OrganisationMember = {
          id: '550e8400-e29b-41d4-a716-446655440020',
          userId: '550e8400-e29b-41d4-a716-446655440001',
          organisationId: '550e8400-e29b-41d4-a716-446655440010',
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
      
        // Store auth token
        localStorage.setItem('auth_token', 'mock-jwt-token');
    }
  };
  
  const signup = async (emailOrUsernameOrEmail: string, emailOrPassword?: string, password?: string) => {
    // If all three parameters are provided, do password signup
    if (emailOrPassword && password) {
      return signupWithPassword(emailOrUsernameOrEmail, emailOrPassword, password);
    }
    
    // Otherwise, send magic link for signup
    console.log('Sending signup magic link to:', emailOrUsernameOrEmail);
    // In production, this would make an API call to create user and send magic link
  };

  const signupWithPassword = async (username: string, email: string, password: string) => {
    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, name: username }
        }
      });

      if (error) {
        console.error('Supabase signup error:', error);
        throw new Error(error.message || 'Failed to create account');
      }

      if (data.user) {
        console.log('User created in Supabase, loading user data...');
        await loadUserData(data.user.id, email);
        return;
      }

      // Fallback to demo signup for development
      console.log('No Supabase user created, using demo signup');
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
        id: '550e8400-e29b-41d4-a716-446655440006',
        email: 'user@example.com',
        name: 'John Doe',
        emailVerified: true,
        createdAt: new Date('2024-01-01'),
        lastLoginAt: new Date(),
        status: 'active'
      };

      const mockOrganisation: Organisation = {
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Acme Corp',
        slug: 'acme-corp',
        createdAt: new Date('2024-01-01'),
        createdBy: '550e8400-e29b-41d4-a716-446655440006',
        settings: {
          allowGuestParticipants: true,
          requireConsent: true,
          dataRetentionDays: 365
        }
      };

      const mockMember: OrganisationMember = {
        id: '550e8400-e29b-41d4-a716-446655440008',
        userId: '550e8400-e29b-41d4-a716-446655440006',
        organisationId: '550e8400-e29b-41d4-a716-446655440007',
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
    // Sign out from Supabase if configured
    if (isSupabaseConfigured) {
      supabase.auth.signOut();
    }
    
    // Clear local storage
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
    signup,
    logout,
    verifyMagicLink
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}