import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Calendar, 
  Eye,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, PDFExport } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';

interface PDFsTabProps {
  organisation: Organisation;
  member: OrganisationMember;
}

export function PDFsTab({ organisation, member }: PDFsTabProps) {
  const [pdfExports, setPdfExports] = useState<PDFExport[]>([
    {
      id: 'pdf-1',
      assessmentId: 'assess-1',
      organisationId: organisation.id,
      type: 'consolidated',
      filename: 'Marketing_Team_Brand_Assessment_Consolidated_Report.pdf',
      url: 'https://example.com/pdfs/marketing-team-consolidated.pdf',
      generatedBy: 'user-1',
      generatedAt: new Date('2024-01-22T14:30:00Z'),
      downloadCount: 3,
      lastDownloadedAt: new Date('2024-01-22T16:45:00Z')
    },
    {
      id: 'pdf-2',
      assessmentId: 'assess-2',
      organisationId: organisation.id,
      type: 'individual',
      filename: 'Leadership_Assessment_Individual_Results.pdf',
      url: 'https://example.com/pdfs/leadership-individual.pdf',
      generatedBy: 'user-1',
      generatedAt: new Date('2024-01-18T16:45:00Z'),
      downloadCount: 8,
      lastDownloadedAt: new Date('2024-01-20T10:15:00Z')
    },
    {
      id: 'pdf-3',
      assessmentId: 'assess-2',
      organisationId: organisation.id,
      type: 'summary',
      filename: 'Leadership_Assessment_Executive_Summary.pdf',
      url: 'https://example.com/pdfs/leadership-summary.pdf',
      generatedBy: 'user-2',
      generatedAt: new Date('2024-01-19T11:20:00Z'),
      downloadCount: 12,
      lastDownloadedAt: new Date('2024-01-21T14:30:00Z')
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'consolidated' | 'summary'>('all');

  const filteredPDFs = pdfExports.filter(pdf => {
    const matchesSearch = pdf.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || pdf.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: PDFExport['type']) => {
    switch (type) {
      case 'individual':
        return 'bg-blue-100 text-blue-800';
      case 'consolidated':
        return 'bg-green-100 text-green-800';
      case 'summary':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: PDFExport['type']) => {
    switch (type) {
      case 'individual':
        return 'Individual';
      case 'consolidated':
        return 'Consolidated';
      case 'summary':
        return 'Summary';
      default:
        return type;
    }
  };

  const handleDownload = (pdf: PDFExport) => {
    // Simulate download
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = pdf.filename;
    link.click();

    // Update download count
    setPdfExports(prev => prev.map(p => 
      p.id === pdf.id 
        ? { ...p, downloadCount: p.downloadCount + 1, lastDownloadedAt: new Date() }
        : p
    ));
  };

  const handleDelete = (pdfId: string) => {
    setPdfExports(prev => prev.filter(pdf => pdf.id !== pdfId));
  };

  const canViewPDFs = hasPermission(member.role, 'VIEW_ORGANISATION');
  const canDeletePDFs = hasPermission(member.role, 'MANAGE_ORGANISATION');

  if (!canViewPDFs) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">
          You don't have permission to view PDF exports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">PDF Reports</h1>
          <p className="text-gray-600 mt-1">
            Download and manage your generated assessment reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search PDF reports..."
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="individual">Individual</option>
            <option value="consolidated">Consolidated</option>
            <option value="summary">Summary</option>
          </select>
        </div>
      </div>

      {/* PDFs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPDFs.map((pdf) => (
                <tr key={pdf.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-red-500 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {pdf.filename}
                        </div>
                        <div className="text-sm text-gray-500">
                          Last downloaded: {pdf.lastDownloadedAt 
                            ? new Date(pdf.lastDownloadedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(pdf.type)}`}>
                      {getTypeLabel(pdf.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(pdf.generatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pdf.downloadCount}</div>
                    <div className="text-sm text-gray-500">times</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(pdf)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {canDeletePDFs && (
                        <button 
                          onClick={() => handleDelete(pdf.id)}
                          className="text-red-600 hover:text-red-900 p-1"
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
      </div>

      {/* Empty state */}
      {filteredPDFs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== 'all' ? 'No matching PDFs found' : 'No PDF reports yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'PDF reports will appear here once you export assessment results'
            }
          </p>
        </div>
      )}
    </div>
  );
}