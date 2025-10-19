import React, { useState, useEffect } from 'react';
import {
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '../common/Button';
import { ParticipantReviewTable } from './ParticipantReviewTable';
import { reviewService } from '../../services/database';

interface ReportsViewProps {
  organisationId: string;
  currentUserId: string;
}

type TabType = 'overview' | 'pending' | 'approved' | 'flagged' | 'rejected';

export function ReportsView({ organisationId, currentUserId }: ReportsViewProps) {
  const [currentTab, setCurrentTab] = useState<TabType>('overview');
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    flagged: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    assessmentId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [organisationId, currentTab, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      const reviewStats = await reviewService.getReviewStats(organisationId);
      setStats(reviewStats);

      if (currentTab === 'overview') {
        const allResults = await reviewService.getResultsForReview(organisationId, {
          assessmentId: filters.assessmentId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        });
        setResults(allResults || []);
      } else {
        const filteredResults = await reviewService.getResultsForReview(organisationId, {
          status: currentTab as any,
          assessmentId: filters.assessmentId || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        });
        setResults(filteredResults || []);
      }
    } catch (error) {
      console.error('Error loading review data:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedResults.size === 0) return;

    try {
      await reviewService.bulkUpdateReviewStatus(
        Array.from(selectedResults),
        {
          reviewStatus: 'approved',
          reviewedBy: currentUserId,
          reviewNotes: 'Bulk approved'
        }
      );

      setSelectedResults(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk approving:', error);
    }
  };

  const handleBulkFlag = async () => {
    if (selectedResults.size === 0) return;

    try {
      await reviewService.bulkUpdateReviewStatus(
        Array.from(selectedResults),
        {
          reviewStatus: 'flagged',
          reviewedBy: currentUserId,
          reviewNotes: 'Flagged for review'
        }
      );

      setSelectedResults(new Set());
      loadData();
    } catch (error) {
      console.error('Error bulk flagging:', error);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Assessment', 'Primary Archetype', 'Confidence', 'Status', 'Completed At'].join(','),
      ...results.map(r => [
        r.users?.name || 'Anonymous',
        r.users?.email || '',
        r.assessments?.name || '',
        r.primary_archetype,
        r.confidence,
        r.review_status,
        new Date(r.completed_at).toLocaleString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', count: stats.total },
    { id: 'pending', label: 'Pending', count: stats.pending, icon: Clock },
    { id: 'approved', label: 'Approved', count: stats.approved, icon: CheckCircle },
    { id: 'flagged', label: 'Flagged', count: stats.flagged, icon: AlertTriangle },
    { id: 'rejected', label: 'Rejected', count: stats.rejected, icon: XCircle }
  ];

  const statCards = [
    {
      title: 'Total Results',
      value: stats.total,
      icon: CheckCircle,
      color: 'bg-blue-500'
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: Clock,
      color: 'bg-amber-500'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      title: 'Flagged',
      value: stats.flagged,
      icon: AlertTriangle,
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Reviews</h1>
          <p className="text-gray-600 mt-1">Review and approve participant assessment results.</p>
        </div>

        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as TabType)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${currentTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {Icon && <Icon className="w-4 h-4 mr-2" />}
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold ${
                    currentTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 flex gap-4">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="From date"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="To date"
              />
            </div>

            {selectedResults.size > 0 && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleBulkApprove}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve ({selectedResults.size})
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkFlag}>
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Flag ({selectedResults.size})
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ParticipantReviewTable
              results={results}
              selectedResults={selectedResults}
              onSelectionChange={setSelectedResults}
              onReviewUpdate={loadData}
              currentUserId={currentUserId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
