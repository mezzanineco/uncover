import React, { useState } from 'react';
import { 
  Plus, 
  Users, 
  Mail, 
  MoreHorizontal,
  UserCheck,
  UserX,
  Clock,
  Shield,
  Crown,
  Send,
  Trash2
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Invite } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';

interface TeamTabProps {
  organisation: Organisation;
  member: OrganisationMember;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'user_admin' | 'participant';
  status: 'active' | 'invited' | 'suspended';
  lastActiveAt?: Date;
  joinedAt: Date;
}

export function TeamTab({ organisation, member }: TeamTabProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'member-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user_admin',
      status: 'active',
      lastActiveAt: new Date('2024-01-22T10:30:00Z'),
      joinedAt: new Date('2024-01-01T09:00:00Z')
    },
    {
      id: 'member-2',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      role: 'participant',
      status: 'active',
      lastActiveAt: new Date('2024-01-21T16:45:00Z'),
      joinedAt: new Date('2024-01-05T14:20:00Z')
    },
    {
      id: 'member-3',
      name: 'Mike Wilson',
      email: 'mike@example.com',
      role: 'participant',
      status: 'invited',
      joinedAt: new Date('2024-01-20T11:15:00Z')
    }
  ]);

  const [pendingInvites, setPendingInvites] = useState<Invite[]>([
    {
      id: 'invite-1',
      email: 'alex@example.com',
      organisationId: organisation.id,
      role: 'participant',
      status: 'pending',
      invitedBy: 'user-1',
      invitedAt: new Date('2024-01-21T14:30:00Z'),
      expiresAt: new Date('2024-01-28T14:30:00Z'),
      token: 'invite-token-1'
    }
  ]);

  // Load pending invites from localStorage on component mount
  useEffect(() => {
    const loadStoredInvites = () => {
      try {
        const storedInvites = localStorage.getItem('pendingInvites');
        if (storedInvites) {
          const parsedInvites = JSON.parse(storedInvites);
          console.log('Loading stored invites:', parsedInvites);
          setPendingInvites(prev => {
            // Merge stored invites with default ones, avoiding duplicates
            const merged = [...prev];
            parsedInvites.forEach((stored: Invite) => {
              const existingIndex = merged.findIndex(i => i.id === stored.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = {
                  ...stored,
                  invitedAt: new Date(stored.invitedAt),
                  expiresAt: new Date(stored.expiresAt)
                };
              } else {
                merged.push({
                  ...stored,
                  invitedAt: new Date(stored.invitedAt),
                  expiresAt: new Date(stored.expiresAt)
                });
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Error loading stored invites:', error);
      }
    };

    loadStoredInvites();
  }, []);

  // Save pending invites to localStorage whenever they change
  useEffect(() => {
    try {
      // Only save user-created invites (not the default mock ones)
      const userInvites = pendingInvites.filter(invite => 
        !['invite-1'].includes(invite.id)
      );
      if (userInvites.length > 0) {
        localStorage.setItem('pendingInvites', JSON.stringify(userInvites));
        console.log('Saved pending invites to localStorage:', userInvites);
      }
    } catch (error) {
      console.error('Error saving invites to localStorage:', error);
    }
  }, [pendingInvites]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    emails: '',
    role: 'participant' as 'user_admin' | 'participant',
    message: ''
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user_admin':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'participant':
        return <Users className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user_admin':
        return 'Admin';
      case 'participant':
        return 'Participant';
      default:
        return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'invited':
        return 'bg-amber-100 text-amber-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSendInvites = () => {
    const emails = inviteForm.emails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (emails.length === 0) return;

    const newInvites: Invite[] = emails.map(email => ({
      id: `invite-${Date.now()}-${Math.random()}`,
      email,
      organisationId: organisation.id,
      role: inviteForm.role,
      status: 'pending',
      invitedBy: 'current-user',
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      token: `token-${Date.now()}`
    }));

    setPendingInvites(prev => [...prev, ...newInvites]);
    setInviteForm({ emails: '', role: 'participant', message: '' });
    setShowInviteModal(false);
  };

  const handleRevokeInvite = (inviteId: string) => {
    setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
  };

  const handleResendInvite = (inviteId: string) => {
    setPendingInvites(prev => prev.map(invite => 
      invite.id === inviteId 
        ? { ...invite, invitedAt: new Date(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
        : invite
    ));
  };

  const canInviteMembers = hasPermission(member.role, 'INVITE_MEMBERS');
  const canManageMembers = hasPermission(member.role, 'MANAGE_MEMBERS');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-600 mt-1">
            Manage your team members and send invitations
          </p>
        </div>
        
        {canInviteMembers && (
          <Button onClick={() => setShowInviteModal(true)} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Invite Members
          </Button>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                {canManageMembers && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((teamMember) => (
                <tr key={teamMember.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">
                          {teamMember.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{teamMember.name}</div>
                        <div className="text-sm text-gray-500">{teamMember.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(teamMember.role)}
                      <span className="ml-2 text-sm text-gray-900">{getRoleLabel(teamMember.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(teamMember.status)}`}>
                      {teamMember.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teamMember.lastActiveAt ? (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(teamMember.lastActiveAt).toLocaleDateString()}
                      </div>
                    ) : (
                      'Never'
                    )}
                  </td>
                  {canManageMembers && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-gray-600 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Pending Invites</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                    <div className="text-sm text-gray-500">
                      Invited as {getRoleLabel(invite.role)} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {canManageMembers && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendInvite(invite.id)}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Resend
                    </Button>
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Members</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses *
                </label>
                <textarea
                  value={inviteForm.emails}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, emails: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter email addresses separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="participant">Participant</option>
                  <option value="user_admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Add a personal message to the invitation"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteForm({ emails: '', role: 'participant', message: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendInvites}
                disabled={!inviteForm.emails.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}