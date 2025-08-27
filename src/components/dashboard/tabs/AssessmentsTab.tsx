import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Play, 
  Users, 
  Calendar, 
  Clock, 
  MoreHorizontal,
  Edit,
  Archive,
  Trash2,
  Copy,
  CheckCircle,
  User,
  Mail,
  UserCheck,
  X
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Assessment } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';

interface AssessmentsTabProps {
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

export function AssessmentsTab({ organisation, member }: AssessmentsTabProps) {
  // All hooks must be at the top level
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamWorkshopModal, setShowTeamWorkshopModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, 'user_admin' | 'participant'>>({});
  const [newInviteEmails, setNewInviteEmails] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'user_admin' | 'participant'>('participant');
  const [teamWorkshopForm, setTeamWorkshopForm] = useState({
    name: '',
    description: '',
    maxParticipants: 50,
    allowAnonymous: false,
    showLiveResults: true
  });

  // Load assessments and team members on component mount
  useEffect(() => {
    const loadAssessments = () => {
      const defaultAssessments: Assessment[] = [
        {
          id: 'assess-1',
          name: 'Marketing Team Brand Assessment',
          description: 'Comprehensive brand archetype assessment for the marketing team',
          projectId: 'proj-1',
          organisationId: organisation.id,
          templateId: 'template-1',
          status: 'active',
          createdBy: 'user-1',
          createdAt: new Date('2024-01-22T10:00:00Z'),
          updatedAt: new Date('2024-01-22T14:30:00Z'),
          requireConsent: true,
          allowAnonymous: false,
          stats: {
            totalInvited: 8,
            totalStarted: 6,
            totalCompleted: 4,
            averageCompletionTime: 15
          }
        },
        {
          id: 'assess-2',
          name: 'Leadership Assessment',
          description: 'Executive team archetype evaluation',
          projectId: 'proj-2',
          organisationId: organisation.id,
          templateId: 'template-1',
          status: 'completed',
          createdBy: 'user-1',
          createdAt: new Date('2024-01-18T16:00:00Z'),
          updatedAt: new Date('2024-01-20T10:15:00Z'),
          requireConsent: true,
          allowAnonymous: false,
          stats: {
            totalInvited: 6,
            totalStarted: 6,
            totalCompleted: 6,
            averageCompletionTime: 18
          }
        },
        {
          id: 'assess-3',
          name: 'Sales Team Assessment',
          description: 'Quarterly sales team evaluation',
          projectId: 'proj-3',
          organisationId: organisation.id,
          templateId: 'template-1',
          status: 'draft',
          createdBy: 'user-2',
          createdAt: new Date('2024-01-15T11:30:00Z'),
          updatedAt: new Date('2024-01-18T13:45:00Z'),
          requireConsent: true,
          allowAnonymous: true,
          stats: {
            totalInvited: 0,
            totalStarted: 0,
            totalCompleted: 0
          }
        }
      ];

      try {
        const storedAssessments = localStorage.getItem('userAssessments');
        const userAssessments = storedAssessments ? JSON.parse(storedAssessments) : [];
        
        // Check for any saved progress assessments
        let progressAssessments: Assessment[] = [];
        const progressKeys = Object.keys(localStorage).filter(key => key.startsWith('assessmentProgress_'));
        progressKeys.forEach(key => {
          try {
            const progress = JSON.parse(localStorage.getItem(key) || '{}');
            if (progress.assessment) {
              progressAssessments.push(progress.assessment);
            }
          } catch (error) {
            console.error('Error parsing progress assessment:', error);
          }
        });
        
        // Also check for legacy progress format
        const legacyProgress = localStorage.getItem('assessmentProgress');
        if (legacyProgress) {
          try {
            const progress = JSON.parse(legacyProgress);
            if (progress.assessment) {
              progressAssessments.push(progress.assessment);
            }
          } catch (error) {
            console.error('Error parsing legacy progress:', error);
          }
        }
        
        setAssessments([...userAssessments, ...progressAssessments, ...defaultAssessments]);
      } catch (error) {
        console.error('Error loading assessments:', error);
        setAssessments(defaultAssessments);
      }
    };

    const loadTeamMembers = () => {
      try {
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
          const parsedMembers = JSON.parse(storedMembers);
          const membersWithDates = parsedMembers.map((member: any) => ({
            ...member,
            joinedAt: new Date(member.joinedAt),
            lastActiveAt: member.lastActiveAt ? new Date(member.lastActiveAt) : undefined
          }));
          setTeamMembers(membersWithDates);
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };

    loadAssessments();
    loadTeamMembers();

    const handleAssessmentChange = () => {
      loadAssessments();
    };

    const handleSoloAssessmentStart = () => {
      // Create a new solo assessment when user starts one
      const soloAssessment: Assessment = {
        id: `solo-assess-${Date.now()}`,
        name: 'My Brand Archetype Assessment',
        description: 'Personal brand archetype discovery assessment',
        projectId: 'solo-project',
        organisationId: organisation.id,
        templateId: 'template-1',
        status: 'in_progress',
        createdBy: 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        requireConsent: true,
        allowAnonymous: false,
        stats: {
          totalInvited: 1,
          totalStarted: 1,
          totalCompleted: 0
        }
      };
      
      setAssessments(prev => [soloAssessment, ...prev]);
    };
    window.addEventListener('assessmentSaved', handleAssessmentChange);
    window.addEventListener('assessmentCompleted', handleAssessmentChange);
    window.addEventListener('startSoloAssessment', handleSoloAssessmentStart);
    window.addEventListener('storage', handleAssessmentChange);

    return () => {
      window.removeEventListener('assessmentSaved', handleAssessmentChange);
      window.removeEventListener('assessmentCompleted', handleAssessmentChange);
      window.removeEventListener('startSoloAssessment', handleSoloAssessmentStart);
      window.removeEventListener('storage', handleAssessmentChange);
    };
  }, [organisation.id]);

  const handleContinueAssessment = (assessmentId: string) => {
    window.dispatchEvent(new CustomEvent('continueAssessment', {
      detail: { assessmentId }
    }));
  };

  const handleStartSoloAssessment = () => {
    window.dispatchEvent(new CustomEvent('startSoloAssessment', {
      detail: { fromDashboard: true }
    }));
  };

  const handleCreateTeamWorkshop = () => {
    if (!teamWorkshopForm.name.trim()) return;

    const newAssessment: Assessment = {
      id: `assess-${Date.now()}`,
      name: teamWorkshopForm.name || 'Team Workshop Assessment',
      description: teamWorkshopForm.description,
      projectId: 'solo-project',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'active',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      requireConsent: true,
      allowAnonymous: teamWorkshopForm.allowAnonymous,
      stats: {
        totalInvited: selectedMembers.length + (newInviteEmails ? newInviteEmails.split(',').filter(e => e.trim()).length : 0),
        totalStarted: 0,
        totalCompleted: 0
      }
    };

    // Add new assessment to list
    setAssessments(prev => [newAssessment, ...prev]);

    // Handle new invites
    if (newInviteEmails.trim()) {
      const emails = newInviteEmails.split(',').map(e => e.trim()).filter(e => e);
      const newInvites = emails.map(email => ({
        id: `invite-${Date.now()}-${Math.random()}`,
        email,
        organisationId: organisation.id,
        role: newInviteRole,
        status: 'pending' as const,
        invitedBy: 'current-user',
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        token: `token-${Date.now()}`
      }));

      // Add to pending invites
      try {
        const existingInvites = JSON.parse(localStorage.getItem('pendingInvites') || '[]');
        localStorage.setItem('pendingInvites', JSON.stringify([...existingInvites, ...newInvites]));
        window.dispatchEvent(new CustomEvent('inviteChange'));
      } catch (error) {
        console.error('Error saving invites:', error);
      }
    }

    // Reset form and close modal
    setTeamWorkshopForm({
      name: '',
      description: '',
      maxParticipants: 50,
      allowAnonymous: false,
      showLiveResults: true
    });
    setSelectedMembers([]);
    setMemberRoles({});
    setNewInviteEmails('');
    setNewInviteRole('participant');
    setShowTeamWorkshopModal(false);
  };

  const handleSelectAllMembers = () => {
    const activeMembers = teamMembers.filter(m => m.status === 'active');
    setSelectedMembers(activeMembers.map(m => m.id));
    
    // Set default roles
    const roles: Record<string, 'user_admin' | 'participant'> = {};
    activeMembers.forEach(member => {
      roles[member.id] = member.role;
    });
    setMemberRoles(roles);
  };

  const handleDeselectAllMembers = () => {
    setSelectedMembers([]);
    setMemberRoles({});
  };

  const handleMemberToggle = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    setSelectedMembers(prev => {
      const isSelected = prev.includes(memberId);
      if (isSelected) {
        // Remove member and their role
        setMemberRoles(prevRoles => {
          const newRoles = { ...prevRoles };
          delete newRoles[memberId];
          return newRoles;
        });
        return prev.filter(id => id !== memberId);
      } else {
        // Add member with their default role
        setMemberRoles(prevRoles => ({
          ...prevRoles,
          [memberId]: member.role
        }));
        return [...prev, memberId];
      }
    });
  };

  const handleMemberRoleChange = (memberId: string, role: 'user_admin' | 'participant') => {
    setMemberRoles(prev => ({
      ...prev,
      [memberId]: role
    }));
  };

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canCreateAssessment = hasPermission(member.role, 'CREATE_ASSESSMENT');
  const canEditAssessment = hasPermission(member.role, 'EDIT_ASSESSMENT');
  const canDeleteAssessment = hasPermission(member.role, 'DELETE_ASSESSMENT');

  const activeTeamMembers = teamMembers.filter(m => m.status === 'active');
  const totalParticipants = selectedMembers.length + (newInviteEmails ? newInviteEmails.split(',').filter(e => e.trim()).length : 0);

  const parseNewInviteEmails = () => {
    if (!newInviteEmails.trim()) return [];
    return newInviteEmails.split(',').map(e => e.trim()).filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">
            Create and manage brand archetype assessments
          </p>
        </div>
        
        {canCreateAssessment && (
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        )}
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">{assessment.name}</h3>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(assessment.createdAt).toLocaleDateString()}
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                  {assessment.status.replace('_', ' ')}
                </span>
              </div>
              
              {(canEditAssessment || canDeleteAssessment) && (
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {assessment.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {assessment.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{assessment.stats.totalInvited}</div>
                <div className="text-gray-500">Invited</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-900">{assessment.stats.totalCompleted}</div>
                <div className="text-gray-500">Completed</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {assessment.status === 'in_progress' && (
                <Button 
                  size="sm" 
                  onClick={() => handleContinueAssessment(assessment.id)}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Continue
                </Button>
              )}
              {assessment.status === 'active' && (
                <Button variant="outline" size="sm" className="flex-1">
                  <Users className="w-4 h-4 mr-1" />
                  Manage
                </Button>
              )}
              {assessment.status === 'completed' && (
                <Button variant="outline" size="sm" className="flex-1">
                  View Results
                </Button>
              )}
              {assessment.status === 'draft' && (
                <Button size="sm" className="flex-1">
                  <Play className="w-4 h-4 mr-1" />
                  Launch
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {assessments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first assessment to get started
            </p>
            {canCreateAssessment && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Assessment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Assessment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Assessment</h3>
            
            <div className="space-y-4">
              <Button
                onClick={handleStartSoloAssessment}
                className="w-full justify-start p-4 h-auto"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Solo Assessment</div>
                  <div className="text-sm text-gray-500">Take the assessment yourself</div>
                </div>
              </Button>
              
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowTeamWorkshopModal(true);
                }}
                className="w-full justify-start p-4 h-auto"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-medium">Team Workshop</div>
                  <div className="text-sm text-gray-500">Create assessment for your team</div>
                </div>
              </Button>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Workshop Modal */}
      {showTeamWorkshopModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Create Team Workshop</h3>
              <button
                onClick={() => setShowTeamWorkshopModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Assessment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Name *
                  </label>
                  <input
                    type="text"
                    value={teamWorkshopForm.name}
                    onChange={(e) => setTeamWorkshopForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter assessment name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={teamWorkshopForm.description}
                    onChange={(e) => setTeamWorkshopForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe your assessment (optional)"
                  />
                </div>
              </div>

              {/* Team Member Selection */}
              {activeTeamMembers.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Select Team Members</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        {selectedMembers.length} of {activeTeamMembers.length} selected
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleSelectAllMembers}
                        disabled={selectedMembers.length === activeTeamMembers.length}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeselectAllMembers}
                        disabled={selectedMembers.length === 0}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {activeTeamMembers.map((member) => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleMemberToggle(member.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3 flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <select
                              value={memberRoles[member.id] || member.role}
                              onChange={(e) => handleMemberRoleChange(member.id, e.target.value as 'user_admin' | 'participant')}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="participant">Participant</option>
                              <option value="user_admin">Admin</option>
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invite New Members */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-4">Invite New Members</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Addresses
                    </label>
                    <textarea
                      value={newInviteEmails}
                      onChange={(e) => setNewInviteEmails(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Enter email addresses separated by commas"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple emails with commas
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role for New Members
                    </label>
                    <select
                      value={newInviteRole}
                      onChange={(e) => setNewInviteRole(e.target.value as 'user_admin' | 'participant')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="participant">Participant</option>
                      <option value="user_admin">Admin</option>
                    </select>
                  </div>

                  {/* Preview new invites */}
                  {parseNewInviteEmails().length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">New Invitations Preview:</h5>
                      <div className="space-y-1">
                        {parseNewInviteEmails().map((email, index) => (
                          <div key={index} className="flex items-center text-sm text-blue-800">
                            <Mail className="w-4 h-4 mr-2" />
                            <span>{email}</span>
                            <span className="ml-2 text-xs bg-blue-200 px-2 py-0.5 rounded">
                              {newInviteRole === 'user_admin' ? 'Admin' : 'Participant'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Summary */}
              {totalParticipants > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h5 className="font-medium text-green-900">Assessment Summary</h5>
                      <p className="text-sm text-green-700">
                        Total participants: {totalParticipants} 
                        ({selectedMembers.length} existing members + {parseNewInviteEmails().length} new invites)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Allow Anonymous Participation</label>
                    <p className="text-xs text-gray-500">Allow participants to join without creating an account</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teamWorkshopForm.allowAnonymous}
                      onChange={(e) => setTeamWorkshopForm(prev => ({ ...prev, allowAnonymous: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Show Live Results</label>
                    <p className="text-xs text-gray-500">Display results in real-time during the session</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teamWorkshopForm.showLiveResults}
                      onChange={(e) => setTeamWorkshopForm(prev => ({ ...prev, showLiveResults: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => setShowTeamWorkshopModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeamWorkshop}
                disabled={!teamWorkshopForm.name.trim()}
              >
                Create Workshop
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}