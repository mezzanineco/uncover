import React, { useState, useEffect } from 'react';
import { assessmentService, inviteService, responseService, userService } from '../../../services/database';
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
  const [newInvites, setNewInvites] = useState<Array<{ name: string; email: string; role: 'user_admin' | 'participant' }>>([
    { name: '', email: '', role: 'participant' }
  ]);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [showSoloAssessmentModal, setShowSoloAssessmentModal] = useState(false);
  const [soloAssessmentForm, setSoloAssessmentForm] = useState({ name: '', description: '' });
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
              assessmentType: assessment.assessment_type || 'solo',
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
              assessmentType: assessment.assessment_type || 'solo',
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
            allowAnonymous: soloAssessment.allowAnonymous,
            assessmentType: 'solo'
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
    setSoloAssessmentForm({
      name: 'My Brand Archetype Assessment',
      description: 'Personal brand archetype discovery assessment'
    });
    setShowSoloAssessmentModal(true);
  };

  const handleCreateSoloAssessment = async () => {
    if (!soloAssessmentForm.name.trim()) return;

    try {
      const soloAssessment: Assessment = {
        id: `solo-assess-${Date.now()}`,
        name: soloAssessmentForm.name,
        description: soloAssessmentForm.description,
        projectId: 'solo-project',
        organisationId: organisation.id,
        templateId: 'template-1',
        status: 'in_progress',
        assessmentType: 'solo',
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

      if (user) {
        try {
          const dbAssessment = await assessmentService.createAssessment({
            name: soloAssessment.name,
            description: soloAssessment.description,
            organisationId: organisation.id,
            createdBy: user.id,
            templateId: soloAssessment.templateId,
            requireConsent: soloAssessment.requireConsent,
            allowAnonymous: soloAssessment.allowAnonymous,
            assessmentType: 'solo'
          });

          soloAssessment.id = dbAssessment.id;

          setShowSoloAssessmentModal(false);
          setSoloAssessmentForm({ name: '', description: '' });

          window.dispatchEvent(new CustomEvent('startSoloAssessmentWithId', {
            detail: {
              assessmentId: dbAssessment.id,
              fromDashboard: true
            }
          }));
        } catch (error) {
          console.error('Error saving solo assessment to database:', error);
        }
      }
    } catch (error) {
      console.error('Error creating solo assessment:', error);
    }
  };

  const handleCreateTeamWorkshop = async () => {
    if (!teamWorkshopForm.name.trim()) return;

    try {
      const validNewInvites = getValidNewInvites();

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
        assessmentType: 'team',
        createdBy: user?.id || 'current-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        requireConsent: true,
        allowAnonymous: teamWorkshopForm.allowAnonymous,
        stats: {
          totalInvited: selectedMembers.length + validNewInvites.length,
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
            allowAnonymous: newAssessment.allowAnonymous,
            assessmentType: 'team'
          });
          
          // Update assessment with database ID
          newAssessment.id = dbAssessment.id;
        } catch (error) {
          console.error('Error saving assessment to database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();

      // Save selected team members as invites to database
      if (selectedMembers.length > 0 && user) {
        try {
          for (const memberId of selectedMembers) {
            const member = teamMembers.find(m => m.id === memberId);
            if (member) {
              await inviteService.createInvite({
                email: member.email,
                organisationId: organisation.id,
                assessmentId: newAssessment.id,
                role: memberRoles[memberId] || 'participant',
                invitedBy: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
          console.log(`Successfully invited ${selectedMembers.length} team members`);
        } catch (error) {
          console.error('Error saving team member invites to database:', error);
        }
      }

      // Handle new invites from the structured form
      if (validNewInvites.length > 0 && user) {
        try {
          for (const invite of validNewInvites) {
            await inviteService.createInvite({
              email: invite.email,
              organisationId: organisation.id,
              assessmentId: newAssessment.id,
              role: invite.role,
              invitedBy: user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
          }
          console.log(`Successfully created ${validNewInvites.length} new invites`);
        } catch (error) {
          console.error('Error saving invites to database:', error);
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
      setNewInvites([{ name: '', email: '', role: 'participant' }]);
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
    
    // Reset invite form fields
    setSelectedMembers([]);
    setMemberRoles({});
    setNewInviteEmails('');
    setNewInviteRole('participant');
    setNewInvites([{ name: '', email: '', role: 'participant' }]);

    setShowManageModal(true);
  };

  const loadAssessmentParticipants = async (assessmentId: string) => {
    try {
      console.log('Loading participants for assessment:', assessmentId);
      const invites = await inviteService.getInvitesByAssessment(assessmentId);
      console.log('Found invites:', invites);

      const participantsWithDetails = await Promise.all(invites.map(async (invite: any) => {
        let userName = invite.email.split('@')[0];
        let userStatus = invite.status || 'invited';
        let progress = 0;

        try {
          const user = await userService.getUserByEmail(invite.email);
          if (user) {
            userName = user.name || userName;

            const responses = await responseService.getResponsesByAssessment(assessmentId, user.id);
            const totalQuestions = 20;
            progress = Math.round((responses.length / totalQuestions) * 100);

            if (progress > 0 && progress < 100) {
              userStatus = 'in_progress';
            } else if (progress === 100) {
              userStatus = 'completed';
            } else if (userStatus === 'accepted') {
              userStatus = 'accepted';
            }
          }
        } catch (error) {
          console.log('Could not fetch user details for', invite.email);
        }

        return {
          id: invite.id,
          name: userName,
          email: invite.email,
          status: userStatus,
          invitedAt: new Date(invite.invited_at),
          acceptedAt: invite.accepted_at ? new Date(invite.accepted_at) : undefined,
          progress
        };
      }));

      console.log('Participants with details:', participantsWithDetails);
      setAssessmentParticipants(participantsWithDetails);
    } catch (error) {
      console.error('Error loading assessment participants:', error);
      setAssessmentParticipants([]);
    }
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
      const validNewInvites = getValidNewInvites();
      const updatedAssessment: Assessment = {
        ...managingAssessment,
        name: teamWorkshopForm.name,
        description: teamWorkshopForm.description,
        allowAnonymous: teamWorkshopForm.allowAnonymous,
        updatedAt: new Date(),
        stats: {
          ...managingAssessment.stats,
          totalInvited: managingAssessment.stats.totalInvited + selectedMembers.length + validNewInvites.length
        }
      };

      // Update in database
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

      // Save selected team members as invites to database
      if (selectedMembers.length > 0) {
        try {
          for (const memberId of selectedMembers) {
            const member = teamMembers.find(m => m.id === memberId);
            if (member) {
              await inviteService.createInvite({
                email: member.email,
                organisationId: organisation.id,
                assessmentId: managingAssessment.id,
                role: memberRoles[memberId] || 'participant',
                invitedBy: user?.id || '550e8400-e29b-41d4-a716-446655440001',
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
              });
            }
          }
        } catch (error) {
          console.error('Error saving team member invites to database:', error);
        }
      }

      // Reload assessments from database
      await loadAssessments();

      // Reload participants to show newly added invites
      await loadAssessmentParticipants(managingAssessment.id);

      // Handle new invites from the structured form
      if (validNewInvites.length > 0) {
        // Save invites to database
        try {
          for (const invite of validNewInvites) {
            await inviteService.createInvite({
              email: invite.email,
              organisationId: organisation.id,
              assessmentId: managingAssessment.id,
              role: invite.role,
              invitedBy: user?.id || '550e8400-e29b-41d4-a716-446655440001',
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
          }

          console.log(`Successfully created ${validNewInvites.length} new invites`);
        } catch (error) {
          console.error('Error saving invites to database:', error);
        }

        // Reload participants to show newly added invites
        await loadAssessmentParticipants(managingAssessment.id);
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
      setNewInvites([{ name: '', email: '', role: 'participant' }]);
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

  const getValidNewInvites = () => {
    return newInvites.filter(invite =>
      invite.name.trim() &&
      invite.email.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email)
    );
  };

  const activeTeamMembers = teamMembers.filter(m => m.status === 'active');
  const totalParticipants = selectedMembers.length + getValidNewInvites().length;

  const handleNewInviteChange = (index: number, field: 'name' | 'email' | 'role', value: string) => {
    const updated = [...newInvites];
    updated[index] = { ...updated[index], [field]: value };
    setNewInvites(updated);

    // Auto-add new row if this is the last row and has content
    const isLastRow = index === newInvites.length - 1;
    const hasContent = updated[index].name.trim() || updated[index].email.trim();
    if (isLastRow && hasContent) {
      setNewInvites([...updated, { name: '', email: '', role: 'participant' }]);
    }
  };

  const removeInviteRow = (index: number) => {
    if (newInvites.length > 1) {
      setNewInvites(newInvites.filter((_, i) => i !== index));
    }
  };

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
                  Type
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
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                      assessment.assessmentType === 'team'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}>
                      {assessment.assessmentType === 'team' ? (
                        <>
                          <Users className="w-3 h-3 mr-1" />
                          Team
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Solo
                        </>
                      )}
                    </span>
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
                      {/* Show Continue button for solo assessments in progress */}
                      {assessment.assessmentType === 'solo' && (assessment.status === 'in_progress' || (assessment.status === 'draft' && assessment.questionsAnswered > 0)) && (
                        <Button
                          size="sm"
                          onClick={() => handleContinueAssessment(assessment.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                      )}
                      {/* Show Manage button for team assessments */}
                      {assessment.assessmentType === 'team' && (
                        <Button variant="outline" size="sm">
                          <Users className="w-4 h-4 mr-1" />
                          <span onClick={() => handleManageAssessment(assessment)}>Manage</span>
                        </Button>
                      )}
                      {/* Show View Results for completed assessments */}
                      {assessment.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          <span onClick={() => handleViewResults(assessment)}>View Results</span>
                        </Button>
                      )}
                      {/* Show Launch button for solo assessments not started */}
                      {assessment.assessmentType === 'solo' && assessment.status === 'draft' && !assessment.questionsAnswered && (
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

      {/* Solo Assessment Modal */}
      {showSoloAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Solo Assessment</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Name *
                </label>
                <input
                  type="text"
                  value={soloAssessmentForm.name}
                  onChange={(e) => setSoloAssessmentForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter assessment name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={soloAssessmentForm.description}
                  onChange={(e) => setSoloAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
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
                  setShowSoloAssessmentModal(false);
                  setSoloAssessmentForm({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateSoloAssessment}
                disabled={!soloAssessmentForm.name.trim()}
              >
                Start Assessment
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
              {assessmentParticipants.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-blue-900">Assessment Status</h4>
                      <p className="text-sm text-blue-700">
                        {assessmentParticipants.filter(p => p.status === 'completed').length} of {assessmentParticipants.length} participants completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round((assessmentParticipants.filter(p => p.status === 'completed').length / assessmentParticipants.length) * 100)}%
                      </div>
                      <div className="text-sm text-blue-700">Complete</div>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(assessmentParticipants.filter(p => p.status === 'completed').length / assessmentParticipants.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-medium text-yellow-900">No Participants Yet</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This assessment doesn't have any participants. Add team members or invite people using email addresses below to get started.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
                        {assessmentParticipants.filter(p => p.status !== 'invited' && p.status !== 'pending').length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                              No active participants yet. Invited participants will appear here once they accept the invitation.
                            </td>
                          </tr>
                        ) : (
                          assessmentParticipants.filter(p => p.status !== 'invited' && p.status !== 'pending').map((participant) => (
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
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pending Assessment Invites */}
              {assessmentParticipants.filter(p => p.status === 'invited' || p.status === 'pending').length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Assessment Invites</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="divide-y divide-gray-200">
                      {assessmentParticipants.filter(p => p.status === 'invited' || p.status === 'pending').map((invite) => (
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
                    <h4 className="font-medium text-gray-900">Add Existing Team Members</h4>
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

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {activeTeamMembers.map((member) => {
                      const isSelected = selectedMembers.includes(member.id);
                      return (
                        <div key={member.id} className="flex items-center justify-between py-2 px-3 border border-gray-100 rounded hover:bg-gray-50">
                          <div className="flex items-center flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleMemberToggle(member.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                            />
                            <div className="ml-3 flex items-center min-w-0">
                              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                <span className="text-xs font-medium text-blue-600">
                                  {member.name.charAt(0)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900 truncate">
                                {member.name} <span className="text-gray-500">{member.email}</span>
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <select
                              value={memberRoles[member.id] || member.role}
                              onChange={(e) => handleMemberRoleChange(member.id, e.target.value as 'user_admin' | 'participant')}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-shrink-0 ml-2"
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

                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 px-2">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-5">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Invite rows */}
                  {newInvites.map((invite, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={invite.name}
                        onChange={(e) => handleNewInviteChange(index, 'name', e.target.value)}
                        placeholder="Full name"
                        className="col-span-4 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="email"
                        value={invite.email}
                        onChange={(e) => handleNewInviteChange(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                        className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={invite.role}
                        onChange={(e) => handleNewInviteChange(index, 'role', e.target.value as 'user_admin' | 'participant')}
                        className="col-span-2 px-2 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="participant">Participant</option>
                        <option value="user_admin">Admin</option>
                      </select>
                      {newInvites.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInviteRow(index)}
                          className="col-span-1 text-gray-400 hover:text-red-600 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Preview valid invites */}
                  {getValidNewInvites().length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <h5 className="text-xs font-medium text-blue-900 mb-2">
                        {getValidNewInvites().length} new invitation{getValidNewInvites().length !== 1 ? 's' : ''} ready
                      </h5>
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
              {(totalParticipants > 0 || assessmentParticipants.length > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <h5 className="font-medium text-green-900">Assessment Summary</h5>
                      <p className="text-sm text-green-700">
                        Current participants: {assessmentParticipants.length}
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

                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700 px-2">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-5">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Invite rows */}
                  {newInvites.map((invite, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={invite.name}
                        onChange={(e) => handleNewInviteChange(index, 'name', e.target.value)}
                        placeholder="Full name"
                        className="col-span-4 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="email"
                        value={invite.email}
                        onChange={(e) => handleNewInviteChange(index, 'email', e.target.value)}
                        placeholder="email@example.com"
                        className="col-span-5 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <select
                        value={invite.role}
                        onChange={(e) => handleNewInviteChange(index, 'role', e.target.value as 'user_admin' | 'participant')}
                        className="col-span-2 px-2 py-2 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="participant">Participant</option>
                        <option value="user_admin">Admin</option>
                      </select>
                      {newInvites.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInviteRow(index)}
                          className="col-span-1 text-gray-400 hover:text-red-600 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Preview valid invites */}
                  {getValidNewInvites().length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                      <h5 className="text-xs font-medium text-blue-900 mb-2">
                        {getValidNewInvites().length} new invitation{getValidNewInvites().length !== 1 ? 's' : ''} ready
                      </h5>
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
                        ({selectedMembers.length} existing members + {getValidNewInvites().length} new invites)
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