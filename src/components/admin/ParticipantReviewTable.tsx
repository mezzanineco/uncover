import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '../common/Button';
import { ParticipantDetailModal } from './ParticipantDetailModal';
import { ReviewActionModal } from './ReviewActionModal';
import { reviewService } from '../../services/database';

interface ParticipantReviewTableProps {
  results: any[];
  selectedResults: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onReviewUpdate: () => void;
  currentUserId: string;
}

export function ParticipantReviewTable({
  results,
  selectedResults,
  onSelectionChange,
  onReviewUpdate,
  currentUserId
}: ParticipantReviewTableProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'flag' | 'reject'>('approve');

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(new Set(results.map(r => r.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelection = new Set(selectedResults);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const handleViewDetails = (result: any) => {
    setSelectedResult(result);
    setDetailModalOpen(true);
  };

  const handleAction = (result: any, action: 'approve' | 'flag' | 'reject') => {
    setSelectedResult(result);
    setActionType(action);
    setActionModalOpen(true);
  };

  const handleReviewSubmit = async (notes?: string, flaggedReason?: string) => {
    if (!selectedResult) return;

    try {
      const statusMap = {
        approve: 'approved' as const,
        flag: 'flagged' as const,
        reject: 'rejected' as const
      };

      await reviewService.updateReviewStatus(selectedResult.id, {
        reviewStatus: statusMap[actionType],
        reviewedBy: currentUserId,
        reviewNotes: notes,
        flaggedReason: flaggedReason
      });

      setActionModalOpen(false);
      setSelectedResult(null);
      onReviewUpdate();
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: <AlertTriangle className="w-3 h-3" /> },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-3 h-3" /> },
      flagged: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertTriangle className="w-3 h-3" /> },
      rejected: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <XCircle className="w-3 h-3" /> }
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${variant.bg} ${variant.text}`}>
        {variant.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getQualityIndicator = (score: number) => {
    if (score >= 80) return { color: 'text-green-600', label: 'High' };
    if (score >= 60) return { color: 'text-amber-600', label: 'Medium' };
    return { color: 'text-red-600', label: 'Low' };
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <AlertTriangle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No results found</h3>
        <p className="text-gray-500">No assessment results match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedResults.size === results.length && results.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assessment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Archetype
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quality
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((result) => {
              const quality = getQualityIndicator(result.response_quality_score || 0);
              return (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedResults.has(result.id)}
                      onChange={() => handleSelectOne(result.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {result.users?.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.users?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{result.assessments?.name || 'Unknown'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{result.primary_archetype}</div>
                    <div className="text-xs text-gray-500">
                      Confidence: {result.confidence}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${quality.color}`}>
                      {quality.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {result.response_quality_score || 0}/100
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(result.review_status || 'pending')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(result.completed_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(result)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {result.review_status !== 'approved' && (
                        <button
                          onClick={() => handleAction(result, 'approve')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      {result.review_status !== 'flagged' && (
                        <button
                          onClick={() => handleAction(result, 'flag')}
                          className="text-amber-600 hover:text-amber-900"
                          title="Flag for Review"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      )}

                      {result.review_status !== 'rejected' && (
                        <button
                          onClick={() => handleAction(result, 'reject')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      {result.review_notes && (
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Has notes"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detailModalOpen && selectedResult && (
        <ParticipantDetailModal
          result={selectedResult}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedResult(null);
          }}
        />
      )}

      {actionModalOpen && selectedResult && (
        <ReviewActionModal
          result={selectedResult}
          actionType={actionType}
          onSubmit={handleReviewSubmit}
          onClose={() => {
            setActionModalOpen(false);
            setSelectedResult(null);
          }}
        />
      )}
    </>
  );
}
