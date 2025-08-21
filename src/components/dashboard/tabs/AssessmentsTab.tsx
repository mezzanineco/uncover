import React, { useState } from 'react';
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
  CheckCircle
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
      name: 'Marketing Team Brand Assessment',
      description: 'Comprehensive brand archetype evaluation for the marketing department',
      projectId: 'proj-1',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'active',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-20T10:00:00Z'),
      updatedAt: new Date('2024-01-22T14:30:00Z'),
      inviteLink: 'https://app.example.com/join/ABC123',
      roomCode: 'ABC123',
      roomCodeExpiry: new Date('2024-01-25T10:00:00Z'),
      requireConsent: true,
      allowAnonymous: true,
      stats: {
        totalInvited: 12,
        totalStarted: 8,
        totalCompleted: 5,
        averageCompletionTime: 15
      }
    },
    {
      id: 'assess-2',
      name: 'Leadership Archetype Analysis',
      description: 'Executive team archetype assessment for leadership development',
      projectId: 'proj-2',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'completed',
      createdBy: 'user-1',
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-01-18T16:45:00Z'),
      requireConsent: true,
      allowAnonymous: false,
      stats: {
        totalInvited: 6,
        totalStarted: 6,
        totalCompleted: 6,
        averageCompletionTime: 22
      }
    },
    {
      id: 'assess-3',
      name: 'Sales Team Q1 Assessment',
      description: 'Quarterly sales team archetype evaluation',
      projectId: 'proj-3',
      organisationId: organisation.id,
      templateId: 'template-1',
      status: 'draft',
      createdBy: 'user-2',
      createdAt: new Date('2024-01-22T11:30:00Z'),
      updatedAt: new Date('2024-01-22T11:30:00Z'),
      requireConsent: true,
      allowAnonymous: true,
      stats: {
        totalInvited: 0,
        totalStarted: 0,
        totalCompleted: 0
      }
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const getStatusColor = (status: Assessment['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
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
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 sm:mt-0">
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
                      <div className="text-sm font-medium text-gray-900">{assessment.name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {assessment.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                        {getStatusIcon(assessment.status)}
                        <span className="ml-1 capitalize">{assessment.status}</span>
                      </span>
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
                          onClick={() => handleCopyInviteLink(assessment.inviteLink || '')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
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
                      {new Date(assessment.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
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
              Create Assessment
            </Button>
          )}
        </div>
      )}
    </div>
  );
}