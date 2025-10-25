'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { projectAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { FolderOpen, ArrowLeft } from 'lucide-react';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!user?.organisations || user.organisations?.length === 0) {
        setError('No organization found. Please create an organization first.');
        return;
      }

      const organisationUuid = user.organisations[0].uuid;
      const response = await projectAPI.create(name, organisationUuid);
      router.push(`/projects/${response.data.project.uuid}`);
    } catch (err: unknown) {
      setError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </button>
        </div>

        <div className="bg-white border border-black/10 rounded-lg">
          <div className="px-6 py-4 border-b border-black/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FolderOpen className="w-6 h-6 mr-2 text-black" />
              Create New Project
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a new project to organize your API endpoints.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                placeholder="e.g., Mobile App API, E-commerce Backend"
              />
              <p className="mt-1 text-sm text-gray-500">
                A unique 5-character code will be automatically generated for your project.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-black/20 text-gray-700 font-medium rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}