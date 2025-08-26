import React, { useState, useEffect } from 'react';
import { 
  Plus, 
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
  X
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Assessment } from '../../../types/auth';
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

    loadStoredAssessments();
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
                          className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                          onClick={() => handleEditName(assessment.id, assessment.name)}
                        >
                          {assessment.name}
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
                          onClick={() => handleCopyInviteLink(assessment.inviteLink || '')}
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
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {canExportResults && assessment.stats.totalCompleted > 0 && (
                        <button className="text-green-600 hover:text-green-900">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {canEditAssessment && (
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Team Workshop</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workshop Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter workshop name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your team workshop (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Members
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter email addresses separated by commas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Invitations will be sent to these email addresses
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  // Handle team workshop creation
                }}
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