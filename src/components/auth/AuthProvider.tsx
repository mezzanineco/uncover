import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { userService, organisationService, memberService } from '../../services/database';
import type { User, Organisation, OrganisationMember } from '../../types/auth';
import { AuthContext, type AuthContextType, type AuthState } from '../../contexts/AuthContext';
import { getAppUrl } from '../../utils/appUrl';

interface AuthProviderProps {
  children: React.ReactNode;
}

const LOADING_TIMEOUT = 10000;

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    organisation: null,
    member: null,
    isLoading: true,
    isAuthenticated: false
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    loadingTimeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        console.warn('Loading timeout reached, forcing load complete');
        setAuthState(prev => ({ ...prev, isLoading: false }));
        isLoadingRef.current = false;
      }
    }, LOADING_TIMEOUT);

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log('Auth state change event:', event, 'Session user:', session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in, loading user data...');
          await loadUserData(session.user.id, session.user.email!);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed, ensuring user data is loaded...');
          // Check if we already have user data, if not, load it
          if (!authState.user || !authState.isAuthenticated) {
            await loadUserData(session.user.id, session.user.email!);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          setAuthState({
            user: null,
            organisation: null,
            member: null,
            isLoading: false,
            isAuthenticated: false
          });
          isLoadingRef.current = false;
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        isLoadingRef.current = false;
      }
    });

    return () => {
      subscription.unsubscribe();
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured, checking localStorage');
        const token = localStorage.getItem('auth_token');
        if (token) {
          await loadDemoUserData();
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          isLoadingRef.current = false;
        }
        return;
      }

      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      );

      const { data: { session } } = await Promise.race([
        sessionPromise,
        timeoutPromise
      ]) as any;

      if (session?.user) {
        await loadUserData(session.user.id, session.user.email!);
      } else {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await loadDemoUserData();
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          isLoadingRef.current = false;
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await loadDemoUserData();
        } catch (demoError) {
          console.error('Demo data load failed:', demoError);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          isLoadingRef.current = false;
        }
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        isLoadingRef.current = false;
      }
    }
  };

  const loadUserData = async (userId: string, email: string) => {
    try {
      console.log('Loading user data for:', email, 'with ID:', userId);

      const getUserPromise = userService.getUserById(userId);
      const getUserTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );

      let user = await Promise.race([getUserPromise, getUserTimeout]) as any;

      if (!user) {
        console.log('User not found in database, creating...');
        try {
          const createUserPromise = userService.createUser({
            id: userId,
            email,
            name: email.split('@')[0]
          });
          const createUserTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Create user timeout')), 5000)
          );

          user = await Promise.race([createUserPromise, createUserTimeout]) as any;
          console.log('User created in database:', user.id);
        } catch (createError: any) {
          console.log('Error creating user:', createError.message);

          if (createError.message?.includes('duplicate key') ||
              createError.message?.includes('already exists') ||
              createError.code === '23505') {
            console.log('User already exists, fetching existing record...');
            user = await userService.getUserById(userId);

            if (!user) {
              console.log('Could not fetch user by ID, trying by email...');
              user = await userService.getUserByEmail(email);
            }
          }

          if (!user) {
            throw new Error('Failed to create or retrieve user record. Please contact support.');
          }
          console.log('User found after creation error:', user.id);
        }
      } else {
        console.log('User already exists in database:', user.id);
      }

      console.log('Looking for organisation memberships...');
      const membershipPromise = supabase
        .from('organisation_members')
        .select(`
          *,
          organisations (*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      const membershipTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Membership query timeout')), 5000)
      );

      const { data: memberships } = await Promise.race([
        membershipPromise,
        membershipTimeout
      ]) as any;

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
        isLoadingRef.current = false;
      } else {
        console.log('No organisation found, creating default organisation...');
        await createDefaultOrganisation(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      isLoadingRef.current = false;
      throw error;
    }
  };

  const loadDemoUserData = async () => {
    try {
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
      isLoadingRef.current = false;
    } catch (error) {
      console.error('Error loading demo user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      isLoadingRef.current = false;
    }
  };

  const createDefaultOrganisation = async (user: any) => {
    try {
      const organisation = await organisationService.createOrganisation({
        name: `${user.name || user.email.split('@')[0]}'s Organisation`,
        slug: `${user.email.split('@')[0]}-org-${Date.now()}`,
        createdBy: user.id,
        industry: 'other',
        size: 'small'
      });

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
      isLoadingRef.current = false;
    } catch (error) {
      console.error('Error creating default organisation:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      isLoadingRef.current = false;
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
      const signupPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, name: username },
          emailRedirectTo: `${getAppUrl()}/auth/confirm`
        }
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Signup request timed out')), 15000)
      );

      const { data, error } = await Promise.race([
        signupPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Supabase signup error:', error);

        // Handle specific error cases with user-friendly messages
        if (error.message?.toLowerCase().includes('already registered') ||
            error.message?.toLowerCase().includes('user already exists') ||
            error.message?.toLowerCase().includes('email address already registered')) {

          console.log('User already exists in Auth, attempting to sign in...');
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (signInError) {
              throw new Error('This email is already registered. Please sign in with your existing password, or use "Forgot Password" if you need to reset it.');
            }

            if (signInData.user) {
              console.log('Successfully signed in with existing account');
              await loadUserData(signInData.user.id, email);
              return;
            }
          } catch (signInAttemptError) {
            throw new Error('This email is already registered. Please use the sign in form instead.');
          }
        }

        // Handle rate limiting
        if (error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('too many requests')) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
        }

        // Handle invalid email format
        if (error.message?.toLowerCase().includes('invalid email')) {
          throw new Error('Please enter a valid email address.');
        }

        // Handle weak password
        if (error.message?.toLowerCase().includes('password') &&
            (error.message?.toLowerCase().includes('weak') ||
             error.message?.toLowerCase().includes('too short'))) {
          throw new Error('Password does not meet requirements. Please use a stronger password.');
        }

        // Generic error with the actual message
        throw new Error(error.message || 'Failed to create account. Please try again or contact support.');
      }

      if (data.user) {
        console.log('User created in Supabase Auth');
        console.log('Auth user ID:', data.user.id);

        const needsEmailConfirmation = !data.user.identities || data.user.identities.length === 0;

        if (needsEmailConfirmation) {
          console.log('Email confirmation required - user must verify email before accessing platform');
          const confirmError = new Error('EMAIL_CONFIRMATION_REQUIRED');
          (confirmError as any).email = email;
          (confirmError as any).needsConfirmation = true;
          throw confirmError;
        }

        console.log('No email confirmation required, loading user data...');

        const loadUserPromise = loadUserData(data.user.id, email);
        const loadUserTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Failed to load user data - please refresh the page')), 10000)
        );

        try {
          await Promise.race([loadUserPromise, loadUserTimeout]);
        } catch (loadError) {
          console.error('Error loading user data after signup:', loadError);
          throw new Error('Account created but failed to load profile. Please refresh the page.');
        }
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

  const resendConfirmationEmail = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/auth/confirm`
        }
      });

      if (error) {
        console.error('Error resending confirmation email:', error);
        throw new Error(error.message || 'Failed to resend confirmation email');
      }

      console.log('Confirmation email resent successfully');
    } catch (error) {
      throw error;
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
    verifyMagicLink,
    resendConfirmationEmail
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}