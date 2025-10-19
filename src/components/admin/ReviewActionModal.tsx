import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '../common/Button';

interface ReviewActionModalProps {
  result: any;
  actionType: 'approve' | 'flag' | 'reject';
  onSubmit: (notes?: string, flaggedReason?: string) => void;
  onClose: () => void;
}

export function ReviewActionModal({
  result,
  actionType,
  onSubmit,
  onClose
}: ReviewActionModalProps) {
  const [notes, setNotes] = useState('');
  const [flaggedReason, setFlaggedReason] = useState('');

  const config = {
    approve: {
      title: 'Approve Assessment Result',
      description: 'Mark this assessment result as approved and ready for use.',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonText: 'Approve'
    },
    flag: {
      title: 'Flag for Review',
      description: 'Mark this assessment result for additional review.',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      buttonText: 'Flag'
    },
    reject: {
      title: 'Reject Assessment Result',
      description: 'Reject this assessment result as invalid or problematic.',
      icon: XCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonText: 'Reject'
    }
  };

  const currentConfig = config[actionType];
  const Icon = currentConfig.icon;

  const flagReasons = [
    'Incomplete responses',
    'Response time too fast',
    'Inconsistent answers',
    'Low quality score',
    'Suspicious patterns',
    'Requires manual verification',
    'Other'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes || undefined, flaggedReason || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{currentConfig.title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className={`${currentConfig.bgColor} ${currentConfig.borderColor} border rounded-lg p-4`}>
              <div className="flex items-start">
                <Icon className={`w-5 h-5 ${currentConfig.iconColor} mr-3 mt-0.5`} />
                <div>
                  <p className="text-sm text-gray-900">{currentConfig.description}</p>
                  <div className="mt-3 text-xs text-gray-600">
                    <div><strong>Participant:</strong> {result.users?.name || 'Anonymous'}</div>
                    <div><strong>Primary Archetype:</strong> {result.primary_archetype}</div>
                    <div><strong>Confidence:</strong> {result.confidence}%</div>
                  </div>
                </div>
              </div>
            </div>

            {actionType === 'flag' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Flagging <span className="text-red-500">*</span>
                </label>
                <select
                  value={flaggedReason}
                  onChange={(e) => setFlaggedReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a reason...</option>
                  {flagReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder={
                  actionType === 'approve'
                    ? 'Add any additional notes (optional)...'
                    : actionType === 'flag'
                    ? 'Provide details about what needs review...'
                    : 'Explain why this result is being rejected...'
                }
                required={actionType === 'reject'}
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {currentConfig.buttonText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
