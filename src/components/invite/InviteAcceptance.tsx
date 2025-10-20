import React, { useState, useEffect, useMemo } from 'react';
import { Mail, CheckCircle, XCircle, Loader2, UserPlus, Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import { inviteService, userService, memberService, passwordRequirementsService } from '../../services/database';
import { supabase } from '../../lib/supabase';
import { validatePassword, getDefaultPasswordRequirements } from '../../utils/passwordValidation';
import type { PasswordRequirements } from '../../types/auth';

interface InviteAcceptanceProps {
  token: string;
  onSuccess?: () => void;
}

interface InviteData {
  id: string;
  email: string;
  organisationId: string;
  assessmentId: string | null;
  role: string;
  status: string;
  expiresAt: string;
  invitedAt: string;
  organizationName?: string;
  assessmentName?: string;
}

export function InviteAcceptance({ token, onSuccess }: InviteAcceptanceProps) {
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [pwdRequirements, setPwdRequirements] = useState<PasswordRequirements>(getDefaultPasswordRequirements());

  const passwordValidation = useMemo(() => {
    const validation = validatePassword(newUserForm.password, pwdRequirements);
    return {
      requirements: validation.requirements,
      allMet: validation.isValid,
      passwordsMatch: newUserForm.password === newUserForm.confirmPassword && newUserForm.confirmPassword.length > 0
    };
  }, [newUserForm.password, newUserForm.confirmPassword, pwdRequirements]);

  useEffect(() => {
    loadInvite();
  }, [token]);

  const loadInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invites')
        .select(`
          *,
          organisations!invites_organisation_id_fkey(name),
          assessments!invites_assessment_id_fkey(name)
        `)
        .eq('token', token)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        setError('Invitation not found or has been revoked.');
        return;
      }

      if (data.status === 'accepted') {
        setError('This invitation has already been accepted.');
        return;
      }

      if (data.status === 'expired' || new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired.');
        return;
      }

      setInvite({
        id: data.id,
        email: data.email,
        organisationId: data.organisation_id,
        assessmentId: data.assessment_id,
        role: data.role,
        status: data.status,
        expiresAt: data.expires_at,
        invitedAt: data.invited_at,
        organizationName: data.organisations?.name,
        assessmentName: data.assessments?.name
      });

      try {
        const existingUser = await userService.getUserByEmail(data.email);
        setIsNewUser(!existingUser);
        console.log('User check:', { email: data.email, existingUser, isNewUser: !existingUser });
      } catch (userCheckError) {
        console.warn('Could not check for existing user, assuming new user:', userCheckError);
        setIsNewUser(true);
      }

      try {
        const orgReqs = await passwordRequirementsService.getByOrganisation(data.organisation_id);
        if (orgReqs) {
          setPwdRequirements(orgReqs);
        }
      } catch (reqsError) {
        console.warn('Could not load password requirements, using defaults:', reqsError);
      }
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Failed to load invitation details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invite) return;

    if (isNewUser) {
      if (!newUserForm.name.trim()) {
        setError('Please enter your name.');
        return;
      }
      if (!passwordValidation.allMet) {
        setError('Please meet all password requirements.');
        return;
      }
      if (!passwordValidation.passwordsMatch) {
        setError('Passwords do not match.');
        return;
      }
    }

    try {
      setAccepting(true);
      setError(null);

      let userId: string;
      let authUserId: string | null = null;

      if (isNewUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: invite.email,
          password: newUserForm.password,
          options: {
            data: {
              name: newUserForm.name
            },
            emailRedirectTo: window.location.origin
          }
        });

        if (authError) {
          console.error('Supabase Auth signup error:', authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }

        if (!authData.user) {
          throw new Error('Failed to create user account');
        }

        authUserId = authData.user.id;

        const newUser = await userService.createUser({
          email: invite.email,
          name: newUserForm.name
        });
        userId = newUser.id;
      } else {
        const existingUser = await userService.getUserByEmail(invite.email);
        if (!existingUser) {
          throw new Error('User not found. Please sign in first to accept this invitation.');
        }
        userId = existingUser.id;

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please sign in to accept this invitation.');
          return;
        }
      }

      await memberService.addMember({
        userId,
        organisationId: invite.organisationId,
        role: invite.role,
        invitedBy: undefined
      });

      await inviteService.updateInviteStatus(invite.id, 'accepted');

      await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id);

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (invite.assessmentId) {
        window.location.href = `/assessment/${invite.assessmentId}`;
      } else {
        window.location.href = '/dashboard';
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error accepting invite:', err);

      let errorMessage = 'Failed to accept invitation. Please try again.';

      if (err.message) {
        if (err.message.includes('already registered') || err.message.includes('already exists')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (err.message.includes('Authentication failed')) {
          errorMessage = err.message;
        } else if (err.message.includes('User not found')) {
          errorMessage = err.message;
        } else if (err.code === 'PGRST301' || err.code === '42501') {
          errorMessage = 'Permission denied. Please contact support.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }

      setError(errorMessage);
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {invite.assessmentId ? "You're Invited!" : 'Join Our Team'}
          </h1>
          <p className="text-gray-600">
            {invite.assessmentId
              ? `Complete the "${invite.assessmentName}" assessment`
              : `Join ${invite.organizationName}`
            }
          </p>
        </div>


        {isNewUser && (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-gray-600 flex items-center">
              <UserPlus className="w-4 h-4 mr-2" />
              Create your account to accept this invitation
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={newUserForm.name}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                disabled={accepting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={invite.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a secure password"
                disabled={accepting}
              />

              <div className="mt-3 space-y-2">
                {passwordValidation.requirements.map((req, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                      req.met ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {req.met ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={`text-sm ${req.met ? 'text-gray-900' : 'text-gray-600'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={newUserForm.confirmPassword}
                onChange={(e) => setNewUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Re-enter password"
                disabled={accepting}
              />

              {newUserForm.confirmPassword.length > 0 && (
                <div className="mt-2 flex items-center text-xs">
                  {passwordValidation.passwordsMatch ? (
                    <>
                      <Check className="w-4 h-4 text-green-600 mr-1.5" />
                      <span className="text-green-700">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-600 mr-1.5" />
                      <span className="text-red-700">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <XCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Button
          onClick={handleAcceptInvite}
          disabled={accepting || (isNewUser && (!passwordValidation.allMet || !passwordValidation.passwordsMatch))}
          size="lg"
          className="w-full"
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isNewUser ? 'Creating Account...' : 'Accepting...'}
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              {isNewUser ? 'Create Account & Accept' : 'Accept Invitation'}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Invitation expires on {new Date(invite.expiresAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
