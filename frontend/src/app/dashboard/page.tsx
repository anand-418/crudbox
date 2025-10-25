'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { projectAPI, endpointAPI } from '@/lib/api';
import { FolderOpen, GitBranch } from 'lucide-react';

interface DashboardStats {
  totalProjects: number | string;
  totalEndpoints: number | string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalEndpoints: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const projectsResponse = await projectAPI.list();
        const projects = projectsResponse.data.projects;
        const totalProjects = projects?.length;

        let totalEndpoints = 0;
        for (const project of projects) {
          try {
            const endpointsResponse = await endpointAPI.list(project.uuid);
            totalEndpoints += endpointsResponse.data.endpoints.length;
          } catch (error) {
            console.error(`Failed to fetch endpoints for project ${project.uuid}:`, error);
          }
        }

        setStats({
          totalProjects,
          totalEndpoints,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({
          totalProjects: 0,
          totalEndpoints: 0,
        });
      }
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: 'Create Project',
      description: 'Start a new mock API project',
      icon: FolderOpen,
      color: 'bg-black text-white',
      href: '/projects/create'
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {user?.email}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-black text-white rounded-lg p-3">
                <FolderOpen className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-black text-white rounded-lg p-3">
                <GitBranch className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEndpoints}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="bg-white border border-black/10 rounded-lg p-6 text-left hover:bg-black/5 transition-colors"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-4`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}