import React, { useState } from 'react';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  FileText, 
  MoreHorizontal,
  Edit,
  Archive,
  Trash2
} from 'lucide-react';
import { Button } from '../../common/Button';
import type { Organisation, OrganisationMember, Project } from '../../../types/auth';
import { hasPermission } from '../../../types/auth';

interface ProjectsTabProps {
  organisation: Organisation;
  member: OrganisationMember;
}

export function ProjectsTab({ organisation, member }: ProjectsTabProps) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'proj-1',
      name: 'Brand Identity Workshop',
      description: 'Comprehensive brand archetype assessment for marketing team',
      organisationId: organisation.id,
      createdBy: 'user-1',
      createdAt: new Date('2024-01-15T10:00:00Z'),
      updatedAt: new Date('2024-01-22T14:30:00Z'),
      assessmentCount: 3,
      status: 'active'
    },
    {
      id: 'proj-2',
      name: 'Leadership Development',
      description: 'Executive team archetype analysis and development program',
      organisationId: organisation.id,
      createdBy: 'user-1',
      createdAt: new Date('2024-01-10T09:00:00Z'),
      updatedAt: new Date('2024-01-20T16:15:00Z'),
      assessmentCount: 2,
      status: 'active'
    },
    {
      id: 'proj-3',
      name: 'Sales Team Assessment',
      description: 'Quarterly sales team archetype evaluation',
      organisationId: organisation.id,
      createdBy: 'user-2',
      createdAt: new Date('2024-01-05T11:30:00Z'),
      updatedAt: new Date('2024-01-18T13:45:00Z'),
      assessmentCount: 1,
      status: 'active'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      organisationId: organisation.id,
      createdBy: 'current-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      assessmentCount: 0,
      status: 'active'
    };

    setProjects(prev => [project, ...prev]);
    setNewProject({ name: '', description: '' });
    setShowCreateModal(false);
  };

  const canCreateProject = hasPermission(member.role, 'CREATE_PROJECT');
  const canEditProject = hasPermission(member.role, 'EDIT_PROJECT');
  const canDeleteProject = hasPermission(member.role, 'DELETE_PROJECT');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Organize your assessments into projects for better management
          </p>
        </div>
        
        {canCreateProject && (
          <Button onClick={() => setShowCreateModal(true)} className="mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {(canEditProject || canDeleteProject) && (
                <div className="relative">
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <FileText className="w-4 h-4 mr-1" />
                <span>{project.assessmentCount} assessments</span>
              </div>
              
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first project to organize your assessments
            </p>
            {canCreateProject && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter project name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe your project (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
              >
                Create Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}