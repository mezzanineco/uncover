import React, { useState } from 'react';
import {
  Upload,
  Download,
  Eye,
  Edit,
  Archive,
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '../common/Button';
import { QuestionEditorModal } from './QuestionEditorModal';
import type { QuestionBank } from '../../types/admin';
import type { ParsedQuestion } from '../../types';

interface QuestionBankManagerProps {
  questionBanks: QuestionBank[];
  questions: ParsedQuestion[];
  onUpload: (file: File) => void;
  onPublish: (bankId: string) => void;
  onArchive: (bankId: string) => void;
  onPreview: (bankId: string) => void;
  onEdit: (bankId: string) => void;
  onDelete: (bankId: string) => void;
  onDuplicate: (bankId: string) => void;
  onToggleStatus: (bankId: string) => void;
  onAddQuestion: (question: ParsedQuestion) => void;
  onUpdateQuestion: (question: ParsedQuestion) => void;
  onArchiveQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

export function QuestionBankManager({
  questionBanks,
  questions,
  onUpload,
  onPublish,
  onArchive,
  onPreview,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onAddQuestion,
  onUpdateQuestion,
  onArchiveQuestion,
  onDeleteQuestion
}: QuestionBankManagerProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ParsedQuestion | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'banks' | 'questions'>('banks');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
        setUploadFile(null);
      }
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionEditor(true);
  };

  const handleEditQuestion = (question: ParsedQuestion) => {
    setEditingQuestion(question);
    setShowQuestionEditor(true);
  };

  const handleSaveQuestion = (question: ParsedQuestion) => {
    if (editingQuestion) {
      onUpdateQuestion(question);
    } else {
      onAddQuestion(question);
    }
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleCancelEdit = () => {
    setShowQuestionEditor(false);
    setEditingQuestion(null);
  };

  const handleViewQuestions = (bankId: string) => {
    setSelectedBankId(bankId);
    setViewMode('questions');
  };

  const handleEditBank = (bankId: string) => {
    setSelectedBankId(bankId);
    setViewMode('questions');
    onEdit(bankId);
  };

  const getStatusIcon = (status: QuestionBank['status']) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'draft':
        return <Clock className="w-5 h-5 text-amber-500" />;
      case 'archived':
        return <Archive className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: QuestionBank['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-amber-100 text-amber-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const getQuestionStatusColor = (status: 'active' | 'archived') => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeQuestions = questions.filter(q => q.status === 'active');
  const archivedQuestions = questions.filter(q => q.status === 'archived');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'banks' ? 'Question Bank Management' : 'Question Management'}
          </h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'banks' 
              ? 'Manage question banks, versions, and validation.' 
              : 'Add, edit, and manage individual questions.'
            }
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 sm:mt-0">
          {viewMode === 'questions' && (
            <>
              <Button onClick={handleAddQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setViewMode('banks')}
              >
                Back to Banks
              </Button>
            </>
          )}
          {viewMode === 'banks' && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <Button as="span" disabled={isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload CSV'}
              </Button>
            </label>
          )}
        </div>
      </div>

      {viewMode === 'banks' && (
        <>
          {/* Upload Progress */}
          {uploadFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Uploading: {uploadFile.name}
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Question Banks List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Question Banks</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questionBanks.map((bank) => (
                    <tr key={bank.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => handleEditBank(bank.id)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {bank.name}
                          </button>
                          <div className="text-sm text-gray-500">Version {bank.version}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(bank.status)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bank.status)}`}>
                            {bank.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {bank.questionCount} questions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bank.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(bank.lastModified).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onToggleStatus(bank.id)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Toggle Status"
                          >
                            {bank.status === 'published' ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditBank(bank.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDuplicate(bank.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(bank.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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
        </>
      )}

      {viewMode === 'questions' && (
        <>
          {/* Question Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{activeQuestions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Archive className="w-6 h-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Archived Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{archivedQuestions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Questions</p>
                  <p className="text-2xl font-bold text-gray-900">{questions.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID & Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Format
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr key={question.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{question.id}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {question.question}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {question.format}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.category === 'Broad' ? 'bg-blue-100 text-blue-800' :
                          question.category === 'Clarifier' ? 'bg-amber-100 text-amber-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {question.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionStatusColor(question.status || 'active')}`}>
                          {question.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditQuestion(question)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {question.status === 'active' && (
                            <button
                              onClick={() => onArchiveQuestion(question.id)}
                              className="text-amber-600 hover:text-amber-900"
                              title="Archive Question"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                          
                          {question.status === 'archived' && (
                            <button
                              onClick={() => onUpdateQuestion({...question, status: 'active'})}
                              className="text-green-600 hover:text-green-900"
                              title="Unarchive Question"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {!question.usedInSessions && (
                            <button
                              onClick={() => onDeleteQuestion(question.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Question"
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
        </>
      )}

      {/* Validation Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Validation Results</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-green-800">All question mappings are valid</span>
            </div>
            <div className="flex items-center p-3 bg-amber-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-3" />
              <span className="text-sm text-amber-800">2 questions missing asset keys for Image Choice format</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Editor Modal */}
      <QuestionEditorModal
        isOpen={showQuestionEditor}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onCancel={handleCancelEdit}
      />
    </div>
  );
}