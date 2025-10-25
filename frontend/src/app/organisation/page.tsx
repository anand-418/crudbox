'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { organisationAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus } from 'lucide-react';

interface Organisation {
  uuid: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export default function Organisations() {
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { refreshUser } = useAuth();

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const fetchOrganisations = async () => {
    try {
      const response = await organisationAPI.list();
      setOrganisations(response.data.organisations);
    } catch (error) {
      console.error('Failed to fetch organisations:', error);
      setOrganisations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      await organisationAPI.create(name);
      await refreshUser();
      setName('');
      setShowCreateForm(false);
      fetchOrganisations();
    } catch (err: unknown) {
      setError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create organisation');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organisations</h1>
            <p className="mt-2 text-gray-600">Manage your organisations and settings</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Organisation
          </button>
        </div>

        {organisations?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organisations</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first organisation.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center text-sm font-medium btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Organisation
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-black/10 rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organisation Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organisations?.map((org) => (
                    <tr key={org.uuid} className="hover:bg-black/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(org.updated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showCreateForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-black/10 w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create Organisation</h3>
                <form onSubmit={handleCreateSubmit}>
                  {error && (
                    <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                      {error}
                    </div>
                  )}
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Organisation Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="Enter organisation name"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-black/10 rounded-md hover:bg-black/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating || !name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}