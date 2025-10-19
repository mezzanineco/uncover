import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Award, TrendingUp, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { reviewService } from '../../services/database';

interface ParticipantDetailModalProps {
  result: any;
  onClose: () => void;
}

export function ParticipantDetailModal({ result, onClose }: ParticipantDetailModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [reviewHistory, setReviewHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [result.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [participantDetails, history] = await Promise.all([
        reviewService.getParticipantDetails(result.id),
        reviewService.getReviewHistory(result.id)
      ]);

      setDetails(participantDetails);
      setReviewHistory(history || []);
    } catch (error) {
      console.error('Error loading participant details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Participant Details</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <User className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Participant Information</h3>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Name</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.users?.name || 'Anonymous'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Email</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.users?.email || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Assessment</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.assessments?.name || 'Unknown'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Award className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Assessment Results</h3>
              </div>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Primary Archetype</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.primary_archetype}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Secondary Archetype</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.secondary_archetype}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Confidence Score</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.confidence}%
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Quality Score</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {details?.response_quality_score || 0}/100
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <TrendingUp className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="text-sm font-semibold text-gray-900">Archetype Scores</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(details?.all_scores || {}).map(([archetype, score]: [string, any]) => (
                <div key={archetype} className="bg-white rounded p-3">
                  <div className="text-xs text-gray-500 mb-1">{archetype}</div>
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-900">{score}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {details?.assessment_responses && details.assessment_responses.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Response Summary</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Responses</span>
                  <span className="font-medium text-gray-900">
                    {details.assessment_responses.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completed At</span>
                  <span className="font-medium text-gray-900">
                    {new Date(details.completed_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {details?.review_notes && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-center mb-2">
                <FileText className="w-5 h-5 text-amber-600 mr-2" />
                <h3 className="text-sm font-semibold text-amber-900">Review Notes</h3>
              </div>
              <p className="text-sm text-amber-800">{details.review_notes}</p>
              {details.flagged_reason && (
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-700">
                    <strong>Flagged Reason:</strong> {details.flagged_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {reviewHistory.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-sm font-semibold text-gray-900">Review History</h3>
              </div>
              <div className="space-y-3">
                {reviewHistory.map((review) => (
                  <div key={review.id} className="bg-white rounded p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-900">
                        {review.reviewer?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Status changed:</span>
                      <span className="font-medium text-gray-700">
                        {review.previous_status || 'N/A'}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{review.new_status}</span>
                    </div>
                    {review.notes && (
                      <p className="text-xs text-gray-600 mt-2">{review.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
