import React, { useState, useEffect } from 'react';
import { assessmentService, inviteService, responseService } from '../../../services/database';
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
  X,
  BarChart3
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Assessment } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';
import { ResultsDashboard } from '../../results/ResultsDashboard';
import { ARCHETYPE_DATA } from '../../../data/archetypes';
import type { AssessmentResult, ArchetypeScore } from '../../../types';

interface AssessmentsTabProps {
  user: any;
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

export function AssessmentsTab({ user, organisation, member }: AssessmentsTabProps) {
  // All hooks must be at the top level
  const [isLoading, setIsLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamWorkshopModal, setShowTeamWorkshopModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedAssessmentResults, setSelectedAssessmentResults] = useState<AssessmentResult | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, 'user_admin' | 'participant'>>({});
  const [newInviteEmails, setNewInviteEmails] = useState('');
  const [newInviteRole, setNewInviteRole] = useState<'user_admin' | 'participant'>('participant');
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [assessmentParticipants, setAssessmentParticipants] = useState<Array<{
    id: string;
    name: string;
    email: string;
    status: 'invited' | 'accepted' | 'in_progress' | 'completed';
    invitedAt: Date;
    acceptedAt?: Date;
    completedAt?: Date;
    progress: number;
  }>>([]);
  const [pendingAssessmentInvites, setPendingAssessmentInvites] = useState<Array<{
    id: string;
    email: string;
    assessmentId: string;
    status: 'pending' | 'expired';
    invitedAt: Date;
    expiresAt: Date;
  }>>([]);
  const [teamWorkshopForm, setTeamWorkshopForm] = useState({
    name: '',
    description: '',
    maxParticipants: 50,
    allowAnonymous: false,
    showLiveResults: true
  });
  const [showManageModal, setShowManageModal] = useState(false);
  const [managingAssessment, setManagingAssessment] = useState<Assessment | null>(null);
  
  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Clear invalid cached data on component mount
  useEffect(() => {
    if (organisation && !isValidUUID(organisation.id)) {
      console.warn('Invalid organisation ID detected, clearing cached data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('userAssessments');
      localStorage.removeItem('assessmentProgress');
      localStorage.removeItem('teamMembers');
      localStorage.removeItem('pendingInvites');
      // Force page reload to reinitialize with proper UUIDs
      window.location.reload();
      return;
    }
  }, [organisation]);

  // Load assessments on component mount
  useEffect(() => {
    loadAssessments();
  }, [organisation.id, user?.id]);

  const loadAssessments = async () => {
    if (!organisation || !isValidUUID(organisation.id)) {
      console.error('Invalid organisation ID for database query');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Load assessments from database
      const dbAssessments = await assessmentService.getAssessmentsByOrganisation(organisation.id);

      // Load response counts for each assessment to calculate progress
      const assessmentsWithProgress = await Promise.all(
        dbAssessments.map(async (assessment: any) => {
          try {
            const responses = await responseService.getResponsesByAssessment(assessment.id, user?.id);
            const uniqueQuestions = new Set(responses.map((r: any) => r.question_id));
            const questionsAnswered = uniqueQuestions.size;

            return {
              id: assessment.id,
              name: assessment.name,
              description: assessment.description,
              projectId: assessment.project_id,
              organisationId: assessment.organisation_id,
              templateId: assessment.template_id,
              status: assessment.status,
              createdBy: assessment.created_by,
              createdAt: new Date(assessment.created_at),
              updatedAt: new Date(assessment.updated_at),
              requireConsent: assessment.require_consent,
              allowAnonymous: assessment.allow_anonymous,
              stats: assessment.stats,
              questionsAnswered
            };
          } catch (error) {
            return {
              id: assessment.id,
              name: assessment.name,
              description: assessment.description,
              projectId: assessment.project_id,
              organisationId: assessment.organisation_id,
              templateId: assessment.template_id,
              status: assessment.status,
              createdBy: assessment.created_by,
              createdAt: new Date(assessment.created_at),
              updatedAt: new Date(assessment.updated_at),
              requireConsent: assessment.require_consent,
              allowAnonymous: assessment.allow_anonymous,
              stats: assessment.stats,
              questionsAnswered: 0
            };
          }
        })
      );

      setAssessments(assessmentsWithProgress);
    } catch (error) {
      console.error('Error loading assessments:', error);
      setAssessments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load team members and setup event listeners
  useEffect(() => {
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

    loadTeamMembers();

    const handleAssessmentChange = () => {
      loadAssessments();
    };

    const handleSoloAssessmentStart = async (event: CustomEvent) => {
      // Create a new solo assessment when user starts one
      const soloAssessment: Assessment = {
        id: `solo-assess-${Date.now()}`,
        name: 'My Brand Archetype Assessment',
        description: 'Personal brand archetype discovery assessment',
        projectId: 'solo-project',
        organisationId: organisation.id,
        templateId: 'template-1',
        status: 'in_progress',
        createdBy: user?.id || 'current-user',
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

      // Save to database if user is authenticated
      if (user) {
        try {
          const dbAssessment = await assessmentService.createAssessment({
            name: soloAssessment.name,
            description: soloAssessment.description,
            organisationId: organisation.id,
            createdBy: user.id,
            templateId: soloAssessment.templateId,
            requireConsent: soloAssessment.requireConsent,
            allowAnonymous: soloAssessment.allowAnonymous
          });

          // Use database ID
          soloAssessment.id = dbAssessment.id;

          // Dispatch event with the assessment ID so App.tsx can track it
          window.dispatchEvent(new CustomEvent('startSoloAssessmentWithId', {
            detail: {
              assessmentId: dbAssessment.id,
              fromDashboard: event.detail?.fromDashboard || false
            }
          }));

          return;
        } catch (error) {
          console.error('Error saving solo assessment to database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();
    };

    window.addEventListener('assessmentSaved', handleAssessmentChange);
    window.addEventListener('assessmentCompleted', handleAssessmentChange);
    window.addEventListener('startSoloAssessment', handleSoloAssessmentStart as EventListener);
    window.addEventListener('storage', handleAssessmentChange);

    return () => {
      window.removeEventListener('assessmentSaved', handleAssessmentChange);
      window.removeEventListener('assessmentCompleted', handleAssessmentChange);
      window.removeEventListener('startSoloAssessment', handleSoloAssessmentStart as EventListener);
      window.removeEventListener('storage', handleAssessmentChange);
    };
  }, [organisation.id, user?.id]);

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

  const handleCreateTeamWorkshop = async () => {
    if (!teamWorkshopForm.name.trim()) return;

    try {
      // Generate a unique room code for the assessment
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const newAssessment: Assessment = {
        id: `assess-${Date.now()}`, // Will be replaced by database ID
        name: teamWorkshopForm.name || 'Team Workshop Assessment',
        description: teamWorkshopForm.description,
        projectId: 'solo-project',
        organisationId: organisation.id,
        templateId: 'template-1',
        status: 'active',
        createdBy: user?.id || 'current-user',
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

      // Save to database if user is authenticated
      if (user) {
        try {
          const dbAssessment = await assessmentService.createAssessment({
            name: newAssessment.name,
            description: newAssessment.description,
            organisationId: organisation.id,
            createdBy: user.id,
            templateId: newAssessment.templateId,
            requireConsent: newAssessment.requireConsent,
            allowAnonymous: newAssessment.allowAnonymous
          });
          
          // Update assessment with database ID
          newAssessment.id = dbAssessment.id;
        } catch (error) {
          console.error('Error saving assessment to database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();

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

        // Save invites to database if user is authenticated
        if (user) {
          try {
            for (const email of emails) {
              await inviteService.createInvite({
                email,
                organisationId: organisation.id,
                assessmentId: newAssessment.id,
                role: 'participant',
                invitedBy: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          } catch (error) {
            console.error('Error saving invites to database:', error);
          }
        }

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
    } catch (error) {
      console.error('Error creating team workshop:', error);
    }
  };

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment);
    setEditForm({
      name: assessment.name,
      description: assessment.description || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingAssessment || !editForm.name.trim()) return;

    try {
      const updatedAssessment = {
        ...editingAssessment,
        name: editForm.name,
        description: editForm.description,
        updatedAt: new Date()
      };

      // Update in database if user is authenticated
      if (user) {
        try {
          await assessmentService.updateAssessment(editingAssessment.id, {
            name: updatedAssessment.name,
            description: updatedAssessment.description,
            require_consent: updatedAssessment.requireConsent,
            allow_anonymous: updatedAssessment.allowAnonymous
          });
        } catch (error) {
          console.error('Error updating assessment in database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();

      setShowEditModal(false);
      setEditingAssessment(null);
      setEditForm({ name: '', description: '' });
      
      // Dispatch event to trigger re-render
      window.dispatchEvent(new CustomEvent('assessmentUpdated'));
    } catch (error) {
      console.error('Error saving assessment edit:', error);
    }
  };

  const handleManageAssessment = (assessment: Assessment) => {
    setManagingAssessment(assessment);
    
    
    // Load assessment participants and their progress
    loadAssessmentParticipants(assessment.id);
    
    // Load pending invites for this assessment
    loadPendingAssessmentInvites(assessment.id);
    
    // Pre-populate form with current assessment data
    setTeamWorkshopForm({
      name: assessment.name,
      description: assessment.description || '',
      maxParticipants: 50,
      allowAnonymous: assessment.allowAnonymous,
      showLiveResults: true
    });
    
    // Load current participants/invites for this assessment
    // In a real app, this would fetch from the backend
    setSelectedMembers([]);
    setMemberRoles({});
    setNewInviteEmails('');
    setNewInviteRole('participant');
    
    setShowManageModal(true);
  };

  const loadAssessmentParticipants = (assessmentId: string) => {
    // Mock data - in production this would come from API
    const mockParticipants = [
      {
        id: 'p1',
        name: 'Sarah Johnson',
        email: 'sarah@company.com',
        status: 'completed' as const,
        invitedAt: new Date('2024-01-20T10:00:00Z'),
        acceptedAt: new Date('2024-01-20T14:30:00Z'),
        completedAt: new Date('2024-01-21T16:45:00Z'),
        progress: 100
      },
      {
        id: 'p2',
        name: 'Mike Chen',
        email: 'mike@company.com',
        status: 'in_progress' as const,
        invitedAt: new Date('2024-01-20T10:00:00Z'),
        acceptedAt: new Date('2024-01-21T09:15:00Z'),
        progress: 65
      },
      {
        id: 'p3',
        name: 'Emma Davis',
        email: 'emma@company.com',
        status: 'accepted' as const,
        invitedAt: new Date('2024-01-20T10:00:00Z'),
        acceptedAt: new Date('2024-01-22T11:20:00Z'),
        progress: 0
      },
      {
        id: 'p4',
        name: 'John Smith',
        email: 'john@company.com',
        status: 'invited' as const,
        invitedAt: new Date('2024-01-20T10:00:00Z'),
        progress: 0
      }
    ];
    setAssessmentParticipants(mockParticipants);
  };

  const loadPendingAssessmentInvites = (assessmentId: string) => {
    // Check localStorage for pending assessment invites
    try {
      const storedInvites = localStorage.getItem(`assessmentInvites_${assessmentId}`);
      if (storedInvites) {
        const parsedInvites = JSON.parse(storedInvites);
        const invitesWithDates = parsedInvites.map((invite: any) => ({
          ...invite,
          invitedAt: new Date(invite.invitedAt),
          expiresAt: new Date(invite.expiresAt)
        }));
        setPendingAssessmentInvites(invitesWithDates);
      } else {
        setPendingAssessmentInvites([]);
      }
    } catch (error) {
      console.error('Error loading pending assessment invites:', error);
      setPendingAssessmentInvites([]);
    }
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (confirm('Are you sure you want to remove this participant from the assessment?')) {
      setAssessmentParticipants(prev => prev.filter(p => p.id !== participantId));
    }
  };

  const handleResendInvite = (participantId: string) => {
    const participant = assessmentParticipants.find(p => p.id === participantId);
    if (participant) {
      // Update the invited date
      setAssessmentParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, invitedAt: new Date() }
          : p
      ));
      
      // Show success message (in production, this would trigger an actual email)
      alert(`Invitation resent to ${participant.email}`);
    }
  };

  const handleResendPendingInvite = (inviteId: string) => {
    setPendingAssessmentInvites(prev => prev.map(invite => 
      invite.id === inviteId 
        ? { 
            ...invite, 
            invitedAt: new Date(), 
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        : invite
    ));
    
    const invite = pendingAssessmentInvites.find(i => i.id === inviteId);
    if (invite) {
      alert(`Invitation resent to ${invite.email}`);
    }
  };

  const handleRemovePendingInvite = (inviteId: string) => {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      setPendingAssessmentInvites(prev => prev.filter(i => i.id !== inviteId));
      
      // Update localStorage
      if (managingAssessment) {
        const remaining = pendingAssessmentInvites.filter(i => i.id !== inviteId);
        localStorage.setItem(`assessmentInvites_${managingAssessment.id}`, JSON.stringify(remaining));
      }
    }
  };

  const handleUpdateAssessment = async () => {
    if (!managingAssessment || !teamWorkshopForm.name.trim()) return;

    try {
      const updatedAssessment: Assessment = {
        ...managingAssessment,
        name: teamWorkshopForm.name,
        description: teamWorkshopForm.description,
        allowAnonymous: teamWorkshopForm.allowAnonymous,
        updatedAt: new Date(),
        stats: {
          ...managingAssessment.stats,
          totalInvited: managingAssessment.stats.totalInvited + selectedMembers.length + (newInviteEmails ? newInviteEmails.split(',').filter(e => e.trim()).length : 0)
        }
      };

      // Update in database if user is authenticated
      if (user) {
        try {
          await assessmentService.updateAssessment(managingAssessment.id, {
            name: updatedAssessment.name,
            description: updatedAssessment.description,
            require_consent: updatedAssessment.requireConsent,
            allow_anonymous: updatedAssessment.allowAnonymous
          });
        } catch (error) {
          console.error('Error updating assessment in database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();

      // Handle new invites
      if (newInviteEmails.trim()) {
        const emails = newInviteEmails.split(',').map(e => e.trim()).filter(e => e);
        const newInvites = emails.map(email => ({
          id: `invite-${Date.now()}-${Math.random()}`,
          email,
          organisationId: organisation.id,
          assessmentId: managingAssessment.id,
          role: newInviteRole,
          status: 'pending' as const,
          invitedBy: 'current-user',
          invitedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          token: `token-${Date.now()}`
        }));

        // Save invites to database if user is authenticated
        if (user) {
          try {
            for (const email of emails) {
              await inviteService.createInvite({
                email,
                organisationId: organisation.id,
                assessmentId: managingAssessment.id,
                role: 'participant',
                invitedBy: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          } catch (error) {
            console.error('Error saving invites to database:', error);
          }
        }

        // Add to pending invites
        try {
          const existingInvites = JSON.parse(localStorage.getItem('pendingInvites') || '[]');
          localStorage.setItem('pendingInvites', JSON.stringify([...existingInvites, ...newInvites]));
          window.dispatchEvent(new CustomEvent('inviteChange'));
        } catch (error) {
          console.error('Error saving invites:', error);
        }
        
        // Save new invites to localStorage for this assessment
        if (newInviteEmails.trim()) {
          const emails = newInviteEmails
            .split(',')
            .map(email => email.trim())
            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
          
          const newInvites = emails.map(email => ({
            id: `invite-${Date.now()}-${Math.random()}`,
            email,
            assessmentId: managingAssessment.id,
            status: 'pending' as const,
            invitedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }));
          
          const existingInvites = pendingAssessmentInvites;
          const allInvites = [...existingInvites, ...newInvites];
          setPendingAssessmentInvites(allInvites);
          
          // Save to localStorage
          localStorage.setItem(`assessmentInvites_${managingAssessment.id}`, JSON.stringify(allInvites));
        }
      }

      // Update localStorage if it's a user-created assessment
      try {
        const storedAssessments = JSON.parse(localStorage.getItem('userAssessments') || '[]');
        const updatedStored = storedAssessments.map((assessment: Assessment) =>
          assessment.id === managingAssessment.id ? updatedAssessment : assessment
        );
        localStorage.setItem('userAssessments', JSON.stringify(updatedStored));
      } catch (error) {
        console.error('Error updating stored assessment:', error);
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
      setShowManageModal(false);
      setManagingAssessment(null);
      
      // Dispatch event to trigger re-render
      window.dispatchEvent(new CustomEvent('assessmentUpdated'));
    } catch (error) {
      console.error('Error updating assessment:', error);
    }
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from database if user is authenticated
      if (user) {
        await assessmentService.deleteAssessment(assessmentId);
      }

      // Remove any progress data for this assessment
      localStorage.removeItem(`assessmentProgress_${assessmentId}`);

      // Reload assessments from database
      await loadAssessments();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert('Failed to delete assessment. Please try again.');
    }
  };

  const handleViewResults = (assessment: Assessment) => {
    // Generate mock results for completed assessments
    const mockResults: AssessmentResult = {
      primaryArchetype: {
        name: 'Explorer',
        score: 85,
        percentage: 28.5,
        description: ARCHETYPE_DATA.Explorer.description,
        traits: ARCHETYPE_DATA.Explorer.traits,
        color: ARCHETYPE_DATA.Explorer.color
      },
      secondaryArchetype: {
        name: 'Creator',
        score: 72,
        percentage: 24.1,
        description: ARCHETYPE_DATA.Creator.description,
        traits: ARCHETYPE_DATA.Creator.traits,
        color: ARCHETYPE_DATA.Creator.color
      },
      allScores: Object.keys(ARCHETYPE_DATA).map((archetype, index) => ({
        name: archetype,
        score: Math.max(20, 100 - (index * 8) + Math.random() * 10),
        percentage: Math.max(5, 30 - (index * 2.5) + Math.random() * 5),
        description: ARCHETYPE_DATA[archetype as keyof typeof ARCHETYPE_DATA].description,
        traits: ARCHETYPE_DATA[archetype as keyof typeof ARCHETYPE_DATA].traits,
        color: ARCHETYPE_DATA[archetype as keyof typeof ARCHETYPE_DATA].color
      })).sort((a, b) => b.percentage - a.percentage),
      confidence: 87,
      completedAt: new Date(),
      sectionScores: {
        broad: { Explorer: 30, Creator: 25, Hero: 20 },
        clarifier: { Explorer: 28, Creator: 24, Hero: 18 },
        validator: { Explorer: 27, Creator: 23, Hero: 19 }
      }
    };
    
    setSelectedAssessmentResults(mockResults);
    setShowResultsModal(true);
  };

  const getProgressPercentage = (assessment: any) => {
    if (assessment.status === 'completed') return 100;
    if (assessment.status === 'draft' && !assessment.questionsAnswered) return 0;

    const TOTAL_QUESTIONS = 31;
    const questionsAnswered = assessment.questionsAnswered || 0;

    if (questionsAnswered === 0) return 0;

    return Math.round((questionsAnswered / TOTAL_QUESTIONS) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-amber-500';
    return 'bg-gray-300';
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

  const getParticipantStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-amber-100 text-amber-800';
      case 'invited':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'accepted':
        return 'Accepted';
      case 'invited':
        return 'Invited';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Assessments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                  Created
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
                      <div className="text-sm font-medium text-gray-900">{assessment.name}</div>
                      {assessment.description && (
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {assessment.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                      {assessment.status.replace('_', ' ')}
                    </span>
                    {/* Progress Bar */}
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(getProgressPercentage(assessment))}`}
                        style={{ width: `${getProgressPercentage(assessment)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getProgressPercentage(assessment)}% complete
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assessment.stats.totalCompleted}/{assessment.stats.totalInvited}
                    </div>
                    <div className="text-sm text-gray-500">completed</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {(assessment.status === 'in_progress' || (assessment.status === 'draft' && assessment.questionsAnswered > 0)) && (
                        <Button
                          size="sm"
                          onClick={() => handleContinueAssessment(assessment.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {assessment.status === 'active' && (
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-1" />
                          <span onClick={() => handleManageAssessment(assessment)}>Manage</span>
                        </Button>
                      )}
                      {assessment.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          <span onClick={() => handleViewResults(assessment)}>View Results</span>
                        </Button>
                      )}
                      {assessment.status === 'draft' && !assessment.questionsAnswered && (
                        <Button
                          size="sm"
                          onClick={() => handleContinueAssessment(assessment.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Launch
                        </Button>
                      )}
                      
                      {canEditAssessment && (
                        <button
                          onClick={() => handleEditAssessment(assessment)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Assessment"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {canDeleteAssessment && (
                        <button
                          onClick={() => handleDeleteAssessment(assessment.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Empty state */}
        {assessments.length === 0 && (
          <div className="text-center py-12">
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

      {/* Edit Assessment Modal */}
      {showEditModal && editingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Assessment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter assessment name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your assessment (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAssessment(null);
                  setEditForm({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={!editForm.name.trim()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Assessment Modal */}
      {showManageModal && managingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Manage Assessment: {managingAssessment.name}</h3>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setManagingAssessment(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Current Assessment Status */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Assessment Status</h4>
                    <p className="text-sm text-blue-700">
                      {managingAssessment.stats.totalCompleted} of {managingAssessment.stats.totalInvited} participants completed
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {managingAssessment.stats.totalInvited > 0 
                        ? Math.round((managingAssessment.stats.totalCompleted / managingAssessment.stats.totalInvited) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Complete</div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${managingAssessment.stats.totalInvited > 0 
                        ? (managingAssessment.stats.totalCompleted / managingAssessment.stats.totalInvited) * 100
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Current Participants */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Participants</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participant
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invited
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assessmentParticipants.map((participant) => (
                          <tr key={participant.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-blue-600">
                                    {participant.name.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                                  <div className="text-sm text-gray-500">{participant.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getParticipantStatusColor(participant.status)}`}>
                                {getStatusLabel(participant.status)}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-full bg-gray-200 rounded-full h-2 mr-2" style={{ width: '80px' }}>
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${participant.progress}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-600 min-w-[40px]">{participant.progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(participant.invitedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {participant.status === 'invited' && (
                                  <button
                                    onClick={() => handleResendInvite(participant.id)}
                                    className="text-blue-600 hover:text-blue-900 text-xs"
                                  >
                                    Resend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveParticipant(participant.id)}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pending Assessment Invites */}
              {pendingAssessmentInvites.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Assessment Invites</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {pendingAssessmentInvites.map((invite) => (
                        <div key={invite.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                              <Mail className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                              <div className="text-sm text-gray-500">
                                Invited {new Date(invite.invitedAt).toLocaleDateString()} • 
                                Expires {new Date(invite.expiresAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getParticipantStatusColor(invite.status)}`}>
                              {getStatusLabel(invite.status)}
                            </span>
                            <button
                              onClick={() => handleResendPendingInvite(invite.id)}
                              className="text-blue-600 hover:text-blue-900 text-xs px-2 py-1"
                            >
                              Resend
                            </button>
                            <button
                              onClick={() => handleRemovePendingInvite(invite.id)}
                              className="text-red-600 hover:text-red-900 text-xs px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                    <h4 className="font-medium text-gray-900">Add Team Members</h4>
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
                <h4 className="font-medium text-gray-900 mb-4">Invite Additional Members</h4>
                
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

              {/* Assessment Summary */}
              {(totalParticipants > 0 || managingAssessment.stats.totalInvited > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h5 className="font-medium text-green-900">Assessment Summary</h5>
                      <p className="text-sm text-green-700">
                        Current participants: {managingAssessment.stats.totalInvited}
                        {totalParticipants > 0 && (
                          <span> • Adding: {totalParticipants} new participants</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManageModal(false);
                  setManagingAssessment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAssessment}
                disabled={!teamWorkshopForm.name.trim()}
              >
                Update Assessment
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

      {/* Results Modal */}
      {showResultsModal && selectedAssessmentResults && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Assessment Results</h3>
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setSelectedAssessmentResults(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <ResultsDashboard
                  result={selectedAssessmentResults}
                  onRestart={() => {
                    setShowResultsModal(false);
                    setSelectedAssessmentResults(null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}