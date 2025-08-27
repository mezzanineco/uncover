import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Check,
  FileText, 
  Users, 
  Play, 
  Pause, 
  Square,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  X,
  Edit3,
  Trash2,
  UserPlus,
  UserCheck,
  Mail
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Assessment, Invite } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';

interface AssessmentsTabProps {
  organisation: Organisation;
  member: OrganisationMember;
}

export function AssessmentsTab({ organisation, member }: AssessmentsTabProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: 'assess-1',
      name: 'My Brand Archetype Assessment',
      description: 'Solo brand archetype discovery completed on January 22, 2024',
      projectId: 'solo-1',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'completed',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-20T10:00:00Z'),
      updatedAt: new Date('2024-01-22T14:30:00Z'),
      inviteLink: undefined,
      roomCode: undefined,
      roomCodeExpiry: undefined,
      requireConsent: true,
      allowAnonymous: false,
      stats: {
        totalInvited: 1,
        totalStarted: 1,
        totalCompleted: 1,
        averageCompletionTime: 15
      }
    },
    {
      id: 'assess-2',
      name: 'Personal Brand Discovery',
      description: 'Solo assessment completed on January 18, 2024',
      projectId: 'solo-2',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'completed',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-01-18T16:45:00Z'),
      requireConsent: true,
      allowAnonymous: false,
      stats: {
        totalInvited: 1,
        totalStarted: 1,
        totalCompleted: 1,
        averageCompletionTime: 22
      }
    },
    {
      id: 'assess-3',
      name: 'Marketing Team Workshop',
      description: 'Team workshop for marketing department - in progress',
      projectId: 'team-1',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'in_progress',
      createdBy: 'user-2',
      createdAt: new Date('2024-01-22T11:30:00Z'),
      updatedAt: new Date('2024-01-22T11:30:00Z'),
      inviteLink: 'https://app.example.com/join/MKT123',
      roomCode: 'MKT123',
      roomCodeExpiry: new Date('2024-01-25T11:30:00Z'),
      requireConsent: true,
      allowAnonymous: true,
      stats: {
        totalInvited: 8,
        totalStarted: 5,
        totalCompleted: 2
      }
    }
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [newInviteEmails, setNewInviteEmails] = useState('');
  const [assessmentForm, setAssessmentForm] = useState({
    name: 'Team Workshop Assessment',
    description: '',
    notes: ''
  });
  const [memberRoles, setMemberRoles] = useState<Record<string, 'user_admin' | 'participant'>>({});
  const [newMemberRoles, setNewMemberRoles] = useState<Record<string, 'user_admin' | 'participant'>>({});
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showEditAssessmentModal, setShowEditAssessmentModal] = useState(false);
  const [editSelectedMembers, setEditSelectedMembers] = useState<string[]>([]);
  const [editNewInviteEmails, setEditNewInviteEmails] = useState('');
  const [assessmentParticipants, setAssessmentParticipants] = useState<Record<string, any[]>>({});

  // Load assessments from localStorage on component mount
  useEffect(() => {
    const loadStoredAssessments = () => {
      try {
        const storedAssessments = localStorage.getItem('userAssessments');
        if (storedAssessments) {
          const parsedAssessments = JSON.parse(storedAssessments);
          console.log('Loading stored assessments:', parsedAssessments);
          setAssessments(prev => {
            // Merge stored assessments with default ones, avoiding duplicates
            const merged = [...prev];
            parsedAssessments.forEach((stored: Assessment) => {
              const existingIndex = merged.findIndex(a => a.id === stored.id);
              if (existingIndex >= 0) {
                merged[existingIndex] = stored;
              } else {
                merged.unshift(stored);
              }
            });
            return merged;
          });
        }
      } catch (error) {
        console.error('Error loading stored assessments:', error);
      }
    };

    const loadTeamMembers = () => {
      try {
        const storedMembers = localStorage.getItem('teamMembers');
        if (storedMembers) {
          const parsedMembers = JSON.parse(storedMembers);
          setTeamMembers(parsedMembers.map((member: any) => ({
            ...member,
            joinedAt: new Date(member.joinedAt),
            lastActiveAt: member.lastActiveAt ? new Date(member.lastActiveAt) : undefined
          })));
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };

    loadStoredAssessments();
    loadTeamMembers();
  }, []);

  // Save assessments to localStorage whenever assessments change
  useEffect(() => {
    try {
      // Only save user-created assessments (not the default mock ones)
      const userAssessments = assessments.filter(a => 
        !['assess-1', 'assess-2', 'assess-3'].includes(a.id)
      );
      if (userAssessments.length > 0) {
        localStorage.setItem('userAssessments', JSON.stringify(userAssessments));
        console.log('Saved user assessments to localStorage:', userAssessments);
      }
    } catch (error) {
      console.error('Error saving assessments to localStorage:', error);
    }
  }, [assessments]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showAssessmentTypeModal, setShowAssessmentTypeModal] = useState(false);

  // Load any saved assessment progress on component mount
  useEffect(() => {
    console.log('Checking for saved assessment progress...');
    try {
      const savedProgress = localStorage.getItem('assessmentProgress');
      if (savedProgress) {
        const { assessment } = JSON.parse(savedProgress);
        console.log('Found saved assessment progress:', assessment);
        
        // Add to assessments if not already present
        setAssessments(prev => {
          const exists = prev.some(a => a.id === assessment.id);
          if (!exists) {
            console.log('Adding saved assessment to list');
            return [assessment, ...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Error loading saved assessment progress:', error);
    }
  }, []);

  // Listen for saved assessments
  useEffect(() => {
    console.log('Setting up event listeners in AssessmentsTab');
    
    const handleAssessmentSaved = (event: CustomEvent) => {
      const { assessment } = event.detail;
      console.log('Assessment saved event received:', assessment);
      setAssessments(prevAssessments => {
        // Check if assessment already exists
        const existingIndex = prevAssessments.findIndex(a => a.id === assessment.id);
        let updatedAssessments: Assessment[];
        if (existingIndex >= 0) {
          // Update existing assessment
          updatedAssessments = [...prevAssessments];
          updatedAssessments[existingIndex] = { ...assessment, updatedAt: new Date() };
        } else {
          // Add new assessment
          updatedAssessments = [{ ...assessment, updatedAt: new Date() }, ...prevAssessments];
        }
        // Sort by updatedAt descending (most recent first)
        return updatedAssessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    const handleAssessmentCompleted = (event: CustomEvent) => {
      const { assessment } = event.detail;
      console.log('Assessment completed event received:', assessment);
      setAssessments(prevAssessments => {
        let updatedAssessments: Assessment[];
        // Check if assessment already exists (from draft)
        const existingIndex = prevAssessments.findIndex(a => 
          a.name === assessment.name && (a.status === 'draft' || a.status === 'active' || a.status === 'in_progress')
        );
        if (existingIndex >= 0) {
          // Update existing draft to completed
          updatedAssessments = [...prevAssessments];
          updatedAssessments[existingIndex] = { ...assessment, updatedAt: new Date() };
        } else {
          // Add new completed assessment
          updatedAssessments = [{ ...assessment, updatedAt: new Date() }, ...prevAssessments];
        }
        // Sort by updatedAt descending (most recent first)
        return updatedAssessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };
    
    window.addEventListener('assessmentSaved', handleAssessmentSaved as EventListener);
    window.addEventListener('assessmentCompleted', handleAssessmentCompleted as EventListener);
    
    return () => {
      console.log('Cleaning up event listeners in AssessmentsTab');
      window.removeEventListener('assessmentSaved', handleAssessmentSaved as EventListener);
      window.removeEventListener('assessmentCompleted', handleAssessmentCompleted as EventListener);
    };
  }, []); // Empty dependency array to ensure listeners are set up once

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-amber-100 text-amber-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Assessment['status']) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleCopyInviteLink = (link: string) => {
    navigator.clipboard.writeText(link);
    // Show toast notification
  };

  const handleGenerateRoomCode = (assessmentId: string) => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    setAssessments(prev => prev.map(assessment => 
      assessment.id === assessmentId 
        ? { ...assessment, roomCode, roomCodeExpiry: expiry }
        : assessment
    ));
  };

  const canCreateAssessment = hasPermission(member.role, 'CREATE_ASSESSMENT');
  const canEditAssessment = hasPermission(member.role, 'EDIT_ASSESSMENT');
  const canViewResults = hasPermission(member.role, 'VIEW_RESULTS');
  const canExportResults = hasPermission(member.role, 'EXPORT_RESULTS');

  const getQuestionsAnswered = (assessmentId: string) => {
    try {
      const savedProgress = localStorage.getItem(`assessmentProgress_${assessmentId}`);
      if (savedProgress) {
        const { responses } = JSON.parse(savedProgress);
        return responses?.length || 0;
      }
    } catch (error) {
      console.error('Error getting questions answered count:', error);
    }
    return 0;
  };

  const handleContinueAssessment = (assessmentId: string) => {
    console.log('Continue button clicked for assessment:', assessmentId);
    console.log('Dispatching continueAssessment event with ID:', assessmentId);
    
    // Update the assessment's updatedAt timestamp when continuing
    setAssessments(prev => {
      const updatedAssessments = prev.map(assessment => 
        assessment.id === assessmentId 
          ? { ...assessment, updatedAt: new Date() }
          : assessment
      );
      // Sort by updatedAt descending (most recent first)
      return updatedAssessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    });
    
    window.dispatchEvent(new CustomEvent('continueAssessment', {
      detail: { assessmentId }
    }));
  };

  const handleEditName = (assessmentId: string, currentName: string) => {
    setEditingAssessmentId(assessmentId);
    setEditingName(currentName);
  };

  const handleSaveName = (assessmentId: string) => {
    if (editingName.trim()) {
      setAssessments(prev => {
        const updatedAssessments = prev.map(assessment => 
          assessment.id === assessmentId 
            ? { ...assessment, name: editingName.trim(), updatedAt: new Date() }
            : assessment
        );
        // Sort by updatedAt descending (most recent first)
        return updatedAssessments.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    }
    setEditingAssessmentId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingAssessmentId(null);
    setEditingName('');
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setAssessments(prev => prev.filter(assessment => assessment.id !== assessmentId));
  };

  const handleSaveAssessmentEdit = () => {
    if (!editingAssessment) return;

    // Process new email invites
    const newEmails = editNewInviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    // Create new invites for email addresses
    if (newEmails.length > 0) {
      const newInvites: Invite[] = newEmails.map(email => ({
        id: `invite-${Date.now()}-${Math.random()}`,
        email,
        organisationId: organisation.id,
        assessmentId: editingAssessment.id,
        role: 'participant',
        status: 'pending',
        invitedBy: 'current-user',
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        token: `token-${Date.now()}`
      }));

      // Add to pending invites
      try {
        const existingInvites = JSON.parse(localStorage.getItem('pendingInvites') || '[]');
        const updatedInvites = [...existingInvites, ...newInvites];
        localStorage.setItem('pendingInvites', JSON.stringify(updatedInvites));
        
        // Add pending members to team list
        const pendingMembers = newEmails.map(email => ({
          id: `pending-${Date.now()}-${Math.random()}`,
          name: email.split('@')[0],
          email,
          role: 'participant' as const,
          status: 'invited' as const,
          joinedAt: new Date(),
          lastActiveAt: undefined
        }));

        const existingMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
        const updatedMembers = [...existingMembers, ...pendingMembers];
        localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
        setTeamMembers(updatedMembers);
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('inviteChange'));
      } catch (error) {
        console.error('Error saving invites:', error);
      }
    }

    // Update the assessment with new participant count
    const totalParticipants = editSelectedMembers.length + newEmails.length;
    setAssessments(prev => prev.map(assessment => 
      assessment.id === editingAssessment.id 
        ? { 
            ...assessment, 
            stats: {
              ...assessment.stats,
              totalInvited: totalParticipants
            },
            updatedAt: new Date()
          }
        : assessment
    ));

    // Close modal and reset form
    setShowEditAssessmentModal(false);
    setEditingAssessment(null);
    setEditSelectedMembers([]);
    setEditNewInviteEmails('');
    
    // Dispatch event to update header stats
    window.dispatchEvent(new CustomEvent('inviteChange'));
  };

  const handleSelectAll = () => {
    const activeMembers = teamMembers.filter(m => m.status === 'active').map(m => m.id);
    setSelectedMembers(activeMembers);
    // Set default roles for all selected members
    const defaultRoles: Record<string, 'user_admin' | 'participant'> = {};
    activeMembers.forEach(id => {
      const member = teamMembers.find(m => m.id === id);
      defaultRoles[id] = member?.role || 'participant';
    });
    setMemberRoles(defaultRoles);
  };

  const handleDeselectAll = () => {
    setSelectedMembers([]);
    setMemberRoles({});
  };

  const activeTeamMembers = teamMembers.filter(m => m.status === 'active');
  const handleCreateTeamWorkshop = () => {
    if (selectedMembers.length === 0 && !newInviteEmails.trim()) return;

    // Process new email invites
    const newEmails = newInviteEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    // Create new invites for email addresses
    if (newEmails.length > 0) {
      const newInvites: Invite[] = newEmails.map(email => ({
        id: `invite-${Date.now()}-${Math.random()}`,
        email,
        organisationId: organisation.id,
        role: 'participant',
        status: 'pending',
        invitedBy: 'current-user',
        invitedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        token: `token-${Date.now()}`
      }));

      // Add to pending invites
      try {
        const existingInvites = JSON.parse(localStorage.getItem('pendingInvites') || '[]');
        const updatedInvites = [...existingInvites, ...newInvites];
        localStorage.setItem('pendingInvites', JSON.stringify(updatedInvites));
        
        // Add pending members to team list
        const pendingMembers = newEmails.map(email => ({
          id: `pending-${Date.now()}-${Math.random()}`,
          name: email.split('@')[0],
          email,
          role: 'participant' as const,
          status: 'invited' as const,
          joinedAt: new Date(),
          lastActiveAt: undefined
        }));

        const existingMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
        const updatedMembers = [...existingMembers, ...pendingMembers];
        localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
        setTeamMembers(updatedMembers);
        
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('inviteChange'));
      } catch (error) {
        console.error('Error saving invites:', error);
      }
    }

    // Create the assessment
    const totalParticipants = selectedMembers.length + newEmails.length;
    const newAssessment: Assessment = {
      id: `assess-${Date.now()}`,
      name: 'Team Workshop Assessment',
      description: `Team workshop with ${totalParticipants} participants`,
      projectId: 'team-project',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'active',
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      inviteLink: `https://app.example.com/join/TEAM${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      roomCode: `TEAM${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      roomCodeExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      requireConsent: true,
      allowAnonymous: false,
      stats: {
        totalInvited: totalParticipants,
        totalStarted: 0,
        totalCompleted: 0
      }
    };

    setAssessments(prev => [newAssessment, ...prev]);
    
    // Reset form
    setSelectedMembers([]);
    setNewInviteEmails('');
    setShowCreateModal(false);
  };

  const isSoloAssessment = (assessment: Assessment) => {
    return assessment.stats.totalInvited === 1 && !assessment.roomCode;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">
            Manage your archetype assessments and track participant progress
          </p>
        </div>
        
        {canCreateAssessment && (
          <Button onClick={() => setShowAssessmentTypeModal(true)} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            New Assessment
          </Button>
        )}
      </div>

      {/* Assessments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Participants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      {editingAssessmentId === assessment.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveName(assessment.id);
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                            className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveName(assessment.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 flex items-center group"
                          onClick={() => handleEditName(assessment.id, assessment.name)}
                        >
                          <span>{assessment.name}</span>
                          <Edit3 className="w-3 h-3 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {assessment.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {assessment.status === 'in_progress' ? 'In Progress' : 
                         assessment.status === 'completed' ? 'Completed' :
                         assessment.status === 'active' ? 'Active' :
                         assessment.status === 'paused' ? 'Paused' :
                         assessment.status === 'draft' ? 'Draft' :
                         assessment.status}
                      </span>
                      {assessment.status === 'in_progress' && (
                        <div className="ml-3 flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                              style={{ 
                                width: `${Math.min((getQuestionsAnswered(assessment.id) / 41) * 100, 100)}%` 
                              }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-500">
                            {getQuestionsAnswered(assessment.id)}/41
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assessment.stats.totalCompleted}/{assessment.stats.totalInvited}
                    </div>
                    <div className="text-sm text-gray-500">completed</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {assessment.roomCode ? (
                      <div className="flex items-center space-x-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                          {assessment.roomCode}
                        </code>
                        <button
                          onClick={() => {
                            setEditingAssessment(assessment);
                            setEditSelectedMembers([]);
                            setEditNewInviteEmails('');
                            setShowEditAssessmentModal(true);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isSoloAssessment(assessment) ? (
                      <span className="text-sm text-gray-500">Solo Assessment</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateRoomCode(assessment.id)}
                        disabled={assessment.status === 'completed'}
                      >
                        Generate
                      </Button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(assessment.updatedAt).toLocaleDateString()} {new Date(assessment.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {assessment.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleContinueAssessment(assessment.id);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {canViewResults && (
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" title="View Results" />
                        </button>
                      )}
                      {assessment.status === 'completed' && (
                        <button 
                          className="text-green-600 hover:text-green-900"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        className="text-red-600 hover:text-red-900"
                        title="Delete Assessment"
                        onClick={() => handleDeleteAssessment(assessment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {assessments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first assessment to start gathering archetype insights
          </p>
          {canCreateAssessment && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          )}
        </div>
      )}

      {/* Assessment Type Selection Modal */}
      {showAssessmentTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Assessment Type</h3>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowAssessmentTypeModal(false);
                  // Trigger solo assessment - this would call the existing assessment flow
                  window.dispatchEvent(new CustomEvent('startSoloAssessment', {
                    detail: { fromDashboard: true }
                  }));
                }}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Solo Assessment</h4>
                    <p className="text-sm text-gray-500">Quick personal assessment to discover your brand archetype</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowAssessmentTypeModal(false);
                  setShowCreateModal(true);
                }}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Team Workshop</h4>
                    <p className="text-sm text-gray-500">Collaborative assessment for teams and groups</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAssessmentTypeModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Team Workshop Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Team Workshop</h3>
            
            <div className="space-y-6">
              {/* Assessment Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Name *
                  </label>
                  <input
                    type="text"
                    value={assessmentForm.name}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter assessment name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={assessmentForm.notes}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Add any notes or instructions for this assessment"
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Team Members
                  </label>
                  <div className="text-sm text-gray-500">
                    {selectedMembers.length} of {activeTeamMembers.length} selected
                  </div>
                </div>
                
                {/* Existing Team Members */}
                {activeTeamMembers.length > 0 && (
                  <div className="mb-4">
                    {/* Select All/Deselect All Controls */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAll}
                          disabled={selectedMembers.length === activeTeamMembers.length}
                          className="text-xs"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeselectAll}
                          disabled={selectedMembers.length === 0}
                          className="text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Deselect All
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {activeTeamMembers.length} available members
                      </div>
                    </div>

                    {/* Member Checklist */}
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                      {activeTeamMembers.map((member, index) => (
                        <div 
                          key={member.id} 
                          className={`flex items-center justify-between p-3 hover:bg-gray-50 transition-colors ${
                            index !== activeTeamMembers.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <label className="flex items-center flex-1 min-w-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMembers(prev => [...prev, member.id]);
                                  setMemberRoles(prev => ({ ...prev, [member.id]: member.role }));
                                } else {
                                  setSelectedMembers(prev => prev.filter(id => id !== member.id));
                                  setMemberRoles(prev => {
                                    const { [member.id]: removed, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-3 flex-shrink-0"
                            />
                            
                            {/* Member Avatar */}
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                              <span className="text-xs font-medium text-blue-600">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            
                            {/* Member Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {member.name}
                                </span>
                                {selectedMembers.includes(member.id) && (
                                  <Check className="w-4 h-4 text-green-500 ml-2 flex-shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-gray-500 truncate">{member.email}</div>
                            </div>
                          </label>
                          
                          {/* Role Selection */}
                          {selectedMembers.includes(member.id) && (
                            <div className="ml-3 flex-shrink-0">
                              <select
                                value={memberRoles[member.id] || member.role}
                                onChange={(e) => setMemberRoles(prev => ({ 
                                  ...prev, 
                                  [member.id]: e.target.value as 'user_admin' | 'participant' 
                                }))}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              >
                                <option value="participant">Participant</option>
                                <option value="user_admin">Admin</option>
                              </select>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* No Team Members State */}
                {activeTeamMembers.length === 0 && (
                  <div className="text-center py-6 border border-gray-200 rounded-lg bg-gray-50">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">No active team members found</p>
                    <p className="text-xs text-gray-500">Add team members in the Team tab first, or invite new members below</p>
                  </div>
                )}
                
                {/* Invite New Members Section */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-3">
                    <UserPlus className="w-4 h-4 text-gray-500 mr-2" />
                    <label className="block text-sm font-medium text-gray-700">
                      Invite New Members
                    </label>
                  </div>
                  
                  <div className="space-y-3">
                    <textarea
                      value={newInviteEmails}
                      onChange={(e) => {
                        setNewInviteEmails(e.target.value);
                        // Initialize roles for new emails
                        const emails = e.target.value.split(',').map(email => email.trim()).filter(email => email);
                        const newRoles: Record<string, 'user_admin' | 'participant'> = {};
                        emails.forEach(email => {
                          if (!newMemberRoles[email]) {
                            newRoles[email] = 'participant';
                          }
                        });
                        setNewMemberRoles(prev => ({ ...prev, ...newRoles }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={2}
                      placeholder="Enter email addresses separated by commas (e.g., john@company.com, sarah@company.com)"
                    />
                    
                    <div className="text-xs text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      New members will be added to your team as 'pending' until they accept the invitation
                    </div>
                    
                    {/* Role Assignment for New Invites */}
                    {newInviteEmails.trim() && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-700 mb-2">Set roles for new members:</div>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {newInviteEmails.split(',')
                            .map(email => email.trim())
                            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                            .map(email => (
                              <div key={email} className="flex items-center justify-between bg-blue-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center flex-1 min-w-0">
                                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <Mail className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <span className="text-sm text-gray-700 truncate">{email}</span>
                                </div>
                                <select
                                  value={newMemberRoles[email] || 'participant'}
                                  onChange={(e) => setNewMemberRoles(prev => ({ 
                                    ...prev, 
                                    [email]: e.target.value as 'user_admin' | 'participant' 
                                  }))}
                                  className="ml-3 text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white flex-shrink-0"
                                >
                                  <option value="participant">Participant</option>
                                  <option value="user_admin">Admin</option>
                                </select>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Summary Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Assessment Summary</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          Total participants: {selectedMembers.length + (newInviteEmails.split(',').filter(email => email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())).length)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedMembers([]);
                  setNewInviteEmails('');
                  setAssessmentForm({ name: 'Team Workshop Assessment', description: '', notes: '' });
                  setMemberRoles({});
                  setNewMemberRoles({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeamWorkshop}
                disabled={!assessmentForm.name.trim() || (selectedMembers.length === 0 && !newInviteEmails.trim())}
              >
                <Play className="w-4 h-4 mr-2" />
                Start Assessment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assessment Modal */}
      {showEditAssessmentModal && editingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Assessment: {editingAssessment.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Current Participants
                </label>
                
                {/* Existing Team Members */}
                {teamMembers.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Team Members</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {teamMembers.map((member) => (
                        <label key={member.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editSelectedMembers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditSelectedMembers(prev => [...prev, member.id]);
                              } else {
                                setEditSelectedMembers(prev => prev.filter(id => id !== member.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <span className="text-sm font-medium text-gray-900">{member.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({member.email})</span>
                            {member.status === 'suspended' && (
                              <span className="text-xs text-red-500 ml-2">(Suspended)</span>
                            )}
                            {member.status === 'invited' && (
                              <span className="text-xs text-amber-500 ml-2">(Pending)</span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add New Invites */}
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Add New Participants</h4>
                  <textarea
                    value={editNewInviteEmails}
                    onChange={(e) => setEditNewInviteEmails(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Enter email addresses separated by commas"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    New participants will be added to your team as 'pending' until they accept
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Current:</strong> {editingAssessment.stats.totalInvited} participants
                  <br />
                  <strong>New Total:</strong> {editSelectedMembers.length + (editNewInviteEmails.split(',').filter(email => email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())).length)} participants
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditAssessmentModal(false);
                  setEditingAssessment(null);
                  setEditSelectedMembers([]);
                  setEditNewInviteEmails('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAssessmentEdit}
                disabled={editSelectedMembers.length === 0 && !editNewInviteEmails.trim()}
              >
                Update Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}