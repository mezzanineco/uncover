import React, { useState, useEffect } from 'react';
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
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'participant' as 'user_admin' | 'participant'
  });

  // Load pending invites from localStorage on component mount
  useEffect(() => {
    const loadStoredInvites = () => {
      try {
        const storedInvites = localStorage.getItem('pendingInvites');
        if (storedInvites) {
          const parsedInvites = JSON.parse(storedInvites);
          console.log('Loading stored invites:', parsedInvites);
          setPendingInvites(parsedInvites.map((invite: any) => ({
            ...invite,
            invitedAt: new Date(invite.invitedAt),
            expiresAt: new Date(invite.expiresAt)
          })));
        }
      } catch (error) {
        console.error('Error loading stored invites:', error);
      }
    };

    const loadStoredMembers = () => {
      try {
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
          const parsedMembers = JSON.parse(storedMembers);
          console.log('Loading stored team members:', parsedMembers);
          setTeamMembers(parsedMembers.map((member: any) => ({
            ...member,
            joinedAt: new Date(member.joinedAt),
            lastActiveAt: member.lastActiveAt ? new Date(member.lastActiveAt) : undefined
          })));
        }
      } catch (error) {
        console.error('Error loading stored team members:', error);
      }
    };

    loadStoredInvites();
    loadStoredMembers();
  }, []);

  // Save team members to localStorage whenever they change
  useEffect(() => {
    try {
      if (teamMembers.length > 0) {
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
        console.log('Saved team members to localStorage:', teamMembers);
      }
    } catch (error) {
      console.error('Error saving team members to localStorage:', error);
    }
  }, [teamMembers]);

  // Save pending invites to localStorage whenever they change
  useEffect(() => {
    try {
      if (pendingInvites.length > 0) {
        localStorage.setItem('pendingInvites', JSON.stringify(pendingInvites));
        console.log('Saved pending invites to localStorage:', pendingInvites);
      } else {
        localStorage.removeItem('pendingInvites');
      }
    } catch (error) {
      console.error('Error saving invites to localStorage:', error);
    }
  }, [pendingInvites]);

  // Listen for invite acceptance (simulated)
  useEffect(() => {
    const handleInviteAccepted = (event: CustomEvent) => {
      const { inviteId, memberData } = event.detail;
      
      // Remove from pending invites
      setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
      // Add to team members
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name: memberData.name || memberData.email.split('@')[0],
        email: memberData.email,
        role: memberData.role,
        status: 'active',
        joinedAt: new Date(),
        lastActiveAt: new Date()
      };
      
      setTeamMembers(prev => [...prev, newMember]);
      
      // Dispatch event to update header stats
      window.dispatchEvent(new CustomEvent('inviteChange'));
    };

    window.addEventListener('inviteAccepted', handleInviteAccepted as EventListener);
    
    return () => {
      window.removeEventListener('inviteAccepted', handleInviteAccepted as EventListener);
    };
  }, []);

  const handleEditMember = (teamMember: TeamMember) => {
    setEditingMember(teamMember);
    setEditForm({
      name: teamMember.name,
      email: teamMember.email,
      role: teamMember.role
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingMember) return;

    setTeamMembers(prev => prev.map(member => 
      member.id === editingMember.id 
        ? { ...member, ...editForm, lastActiveAt: new Date() }
        : member
    ));

    setShowEditModal(false);
    setEditingMember(null);
    setEditForm({ name: '', email: '', role: 'participant' });
    
    // Dispatch event to update header stats
    window.dispatchEvent(new CustomEvent('inviteChange'));
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setTeamMembers(prev => prev.filter(member => member.id !== memberId));
      
      // Dispatch event to update header stats
      window.dispatchEvent(new CustomEvent('inviteChange'));
    }
  };

  const handleSuspendMember = (memberId: string) => {
    setTeamMembers(prev => prev.map(member => 
      member.id === memberId 
        ? { ...member, status: member.status === 'suspended' ? 'active' : 'suspended' }
        : member
    ));
  };

  const handleSimulateAcceptInvite = (inviteId: string) => {
    const invite = pendingInvites.find(i => i.id === inviteId);
    if (invite) {
      // Simulate invite acceptance
      window.dispatchEvent(new CustomEvent('inviteAccepted', {
        detail: {
          inviteId,
          memberData: {
            email: invite.email,
            role: invite.role
          }
        }
      }));
    }
  };

  // Save pending invites to localStorage whenever they change (updated logic)
  useEffect(() => {
    try {
      if (pendingInvites.length > 0) {
        localStorage.setItem('pendingInvites', JSON.stringify(pendingInvites));
        console.log('Saved pending invites to localStorage:', pendingInvites);
      } else {
        // Only remove if we explicitly have an empty array (not initial state)
        const stored = localStorage.getItem('pendingInvites');
        if (stored) {
          localStorage.removeItem('pendingInvites');
        }
      }
    } catch (error) {
      console.error('Error saving invites to localStorage:', error);
    }
  }, [pendingInvites]);

  // Remove the old save logic that was duplicated
  useEffect(() => {
    const loadStoredInvites = () => {
      try {
        const storedInvites = localStorage.getItem('pendingInvites');
        if (storedInvites) {
          const parsedInvites = JSON.parse(storedInvites);
          console.log('Loading stored invites:', parsedInvites);
          setPendingInvites(parsedInvites.map((invite: any) => ({
            ...invite,
            invitedAt: new Date(invite.invitedAt),
            expiresAt: new Date(invite.expiresAt)
          })));
        }
      } catch (error) {
        console.error('Error loading stored invites:', error);
      }
    };

    const loadStoredMembers = () => {
      try {
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
          const parsedMembers = JSON.parse(storedMembers);
          console.log('Loading stored team members:', parsedMembers);
          setTeamMembers(parsedMembers.map((member: any) => ({
            ...member,
            joinedAt: new Date(member.joinedAt),
            lastActiveAt: member.lastActiveAt ? new Date(member.lastActiveAt) : undefined
          })));
        }
      } catch (error) {
        console.error('Error loading stored team members:', error);
      }
    };

    loadStoredInvites();
    loadStoredMembers();
  }, []);

  // Save team members to localStorage whenever they change
  useEffect(() => {
    try {
      if (teamMembers.length > 0) {
        localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
        console.log('Saved team members to localStorage:', teamMembers);
      } else {
        // Only remove if we explicitly have an empty array after having members
        const stored = localStorage.getItem('teamMembers');
        if (stored) {
          const existing = JSON.parse(stored);
          if (existing.length > 0) {
            localStorage.removeItem('teamMembers');
          }
        }
      }
    } catch (error) {
      console.error('Error saving team members to localStorage:', error);
    }
  }, [teamMembers]);

  // Save pending invites to localStorage whenever they change
  useEffect(() => {
    try {
      if (pendingInvites.length > 0) {
        localStorage.setItem('pendingInvites', JSON.stringify(pendingInvites));
        console.log('Saved pending invites to localStorage:', pendingInvites);
      } else {
        // Only remove if we explicitly have an empty array after having invites
        const stored = localStorage.getItem('pendingInvites');
        if (stored) {
          const existing = JSON.parse(stored);
          if (existing.length > 0) {
            localStorage.removeItem('pendingInvites');
          });
        }
      } catch (error) {
        console.error('Error saving invites to localStorage:', error);
      }
    }
  }, [pendingInvites]);

  // Listen for invite acceptance (simulated)
  useEffect(() => {
    const handleInviteAccepted = (event: CustomEvent) => {
      const { inviteId, memberData } = event.detail;
      
      // Remove from pending invites
      setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
      
      // Add to team members
      const newMember: TeamMember = {
        id: `member-${Date.now()}`,
        name: memberData.name || memberData.email.split('@')[0],
        email: memberData.email,
        role: memberData.role,
        status: 'active',
        joinedAt: new Date(),
        lastActiveAt: new Date()
      };
      
      setTeamMembers(prev => [...prev, newMember]);
      
      // Dispatch event to update header stats
      window.dispatchEvent(new CustomEvent('inviteChange'));
    };

    window.addEventListener('inviteAccepted', handleInviteAccepted as EventListener);
    
    return () => {
      window.removeEventListener('inviteAccepted', handleInviteAccepted as EventListener);
    };
  }, []);

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
    
    // Dispatch event to update header stats
    window.dispatchEvent(new CustomEvent('inviteChange'));
  };

  const handleRevokeInvite = (inviteId: string) => {
    setPendingInvites(prev => prev.filter(invite => invite.id !== inviteId));
    
    // Dispatch event to update header stats
    window.dispatchEvent(new CustomEvent('inviteChange'));
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSimulateAcceptInvite(invite.id)}
                      className="bg-green-50 text-green-600 hover:bg-green-100"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Accept (Demo)
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

      {/* Edit Member Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter member name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="participant">Participant</option>
                  <option value="user_admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMember(null);
                  setEditForm({ name: '', email: '', role: 'participant' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavEdit}
                disabled={!editForm.name.trim() || !editForm.email.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}