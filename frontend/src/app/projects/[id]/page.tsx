'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { projectAPI, endpointAPI } from '@/lib/api';
import { Plus, Edit, Trash2, ArrowLeft, FolderOpen, Save } from 'lucide-react';

interface Endpoint {
  uuid: string;
  method: string;
  path: string;
  response_status: number;
  response_body: string;
  response_headers: string;
  created_at: string;
  updated_at: string;
}

export default function ProjectDetail() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    method: 'GET',
    path: '',
    response_status: 200,
    response_body: '{\n  "message": "Hello World"\n}',
    response_headers: '{\n  "Content-Type": "application/json"\n}'
  });
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [editFormData, setEditFormData] = useState({
    method: 'GET',
    path: '',
    response_status: 200,
    response_body: '{\n  "message": "Hello World"\n}',
    response_headers: '{\n  "Content-Type": "application/json"\n}'
  });
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const params = useParams();

  const projectUuid = params.id as string;

  const fetchEndpoints = useCallback(async () => {
    if (!projectUuid) {
      setEndpoints([]);
      setIsLoading(false);
      return;
    }

    try {
      const endpointsResponse = await projectAPI.listProjectEndpoints(projectUuid);
      const data = endpointsResponse.data;
      const fetchedEndpoints = Array.isArray(data?.endpoints)
        ? data.endpoints
        : Array.isArray(data)
          ? data
          : [];
      setEndpoints(fetchedEndpoints);
      setEditingEndpoint(prev => {
        if (!prev) return prev;
        const refreshed = fetchedEndpoints.find(endpoint => endpoint.uuid === prev.uuid);
        return refreshed || null;
      });
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      setEndpoints([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectUuid]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (projectUuid) {
        fetchEndpoints();
      } else {
        setIsLoading(false);
      }
    }
  }, [fetchEndpoints, isMounted, projectUuid]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUuid) {
      setCreateError('Project not specified');
      return;
    }

    setCreateError('');
    setIsCreating(true);

    try {
      const response = await endpointAPI.create(projectUuid, createFormData);
      const newEndpoint = response.data?.endpoint ?? response.data;
      if (newEndpoint) {
        setEndpoints(prev => [...prev, newEndpoint]);
      } else {
        await fetchEndpoints();
      }
      setShowCreateForm(false);
      setEditingEndpoint(null);
      setCreateFormData({
        method: 'GET',
        path: '',
        response_status: 200,
        response_body: '{\n  "message": "Hello World"\n}',
        response_headers: '{\n  "Content-Type": "application/json"\n}'
      });
    } catch (err: unknown) {
      setCreateError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create endpoint');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateInputChange = (field: string, value: string | number) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startEditing = (endpoint: Endpoint) => {
    setShowCreateForm(false);
    setEditError('');
    setEditingEndpoint(endpoint);
    setEditFormData({
      method: endpoint.method,
      path: endpoint.path,
      response_status: endpoint.response_status,
      response_body: endpoint.response_body,
      response_headers: endpoint.response_headers,
    });
  };

  const handleEditInputChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEndpoint) return;
    if (!projectUuid) {
      setEditError('Project not specified');
      return;
    }

    setEditError('');
    setIsUpdating(true);

    try {
      const response = await endpointAPI.update(projectUuid, editingEndpoint.uuid, editFormData);
      const updatedEndpoint = response.data?.endpoint ?? response.data;
      if (updatedEndpoint) {
        setEndpoints(prev => prev.map(endpoint => (endpoint.uuid === updatedEndpoint.uuid ? updatedEndpoint : endpoint)));
      } else {
        await fetchEndpoints();
      }
      setEditingEndpoint(null);
    } catch (err: unknown) {
      setEditError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update endpoint');
    } finally {
      setIsUpdating(false);
    }
  };

  const validateJSON = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const deleteEndpoint = async (uuid: string) => {
    if (confirm('Are you sure you want to delete this endpoint?')) {
      try {
        await endpointAPI.delete(uuid);
        setEndpoints(prev => prev.filter(e => e.uuid !== uuid));
        if (editingEndpoint?.uuid === uuid) {
          setEditingEndpoint(null);
        }
      } catch (error) {
        console.error('Failed to delete endpoint:', error);
      }
    }
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      GET: 'bg-black text-white',
      POST: 'bg-neutral-800 text-white',
      PUT: 'bg-neutral-700 text-white',
      DELETE: 'bg-neutral-600 text-white',
      PATCH: 'bg-neutral-500 text-white',
    };
    return colors[method] || 'bg-neutral-200 text-black';
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

  if (!projectUuid) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto text-center py-20">
          <h2 className="text-2xl font-semibold text-gray-900">Project not found</h2>
          <p className="mt-2 text-gray-600">Please return to the projects page and select a project.</p>
          <button
            onClick={() => router.push('/projects')}
            className="mt-6 inline-flex items-center px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900"
          >
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-black/70 hover:text-black mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Project Endpoints</h1>
            <button
              onClick={() => {
                setEditingEndpoint(null);
                setShowCreateForm(!showCreateForm);
              }}
              className="flex items-center px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900"
            >
              <Plus className="w-5 h-5 mr-2" />
              {showCreateForm ? 'Cancel' : 'New Endpoint'}
            </button>
          </div>
        </div>

        {showCreateForm && (
          <div className="bg-white border border-black/10 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-black/10">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Plus className="w-6 h-6 mr-2 text-black" />
                Create New Endpoint
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Define a new API endpoint with custom response.
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6">
              {createError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                    HTTP Method
                  </label>
                  <select
                    id="method"
                    value={createFormData.method}
                    onChange={(e) => handleCreateInputChange('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="path" className="block text-sm font-medium text-gray-700 mb-2">
                    Path
                  </label>
                  <input
                    id="path"
                    type="text"
                    required
                    value={createFormData.path}
                    onChange={(e) => handleCreateInputChange('path', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="/api/users"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Response Status
                  </label>
                  <input
                    id="status"
                    type="number"
                    min="100"
                    max="599"
                    required
                    value={createFormData.response_status}
                    onChange={(e) => handleCreateInputChange('response_status', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="headers" className="block text-sm font-medium text-gray-700 mb-2">
                  Response Headers (JSON)
                </label>
                <textarea
                  id="headers"
                  rows={4}
                  value={createFormData.response_headers}
                  onChange={(e) => handleCreateInputChange('response_headers', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                    validateJSON(createFormData.response_headers) ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder='{"Content-Type": "application/json"}'
                />
                {!validateJSON(createFormData.response_headers) && (
                  <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                  Response Body (JSON)
                </label>
                <textarea
                  id="body"
                  rows={8}
                  value={createFormData.response_body}
                  onChange={(e) => handleCreateInputChange('response_body', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                    validateJSON(createFormData.response_body) ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder='{"message": "Hello World"}'
                />
                {!validateJSON(createFormData.response_body) && (
                  <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createFormData.path.trim() || !validateJSON(createFormData.response_body) || !validateJSON(createFormData.response_headers)}
                  className="flex items-center px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isCreating ? 'Creating...' : 'Create Endpoint'}
                </button>
              </div>
            </form>
          </div>
        )}

        {editingEndpoint && (
          <div className="bg-white border border-black/10 rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-black/10">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Edit className="w-6 h-6 mr-2 text-black" />
                Edit Endpoint
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Update the selected endpoint configuration.
              </p>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6">
              {editError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="edit-method" className="block text-sm font-medium text-gray-700 mb-2">
                    HTTP Method
                  </label>
                  <select
                    id="edit-method"
                    value={editFormData.method}
                    onChange={(e) => handleEditInputChange('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-path" className="block text-sm font-medium text-gray-700 mb-2">
                    Path
                  </label>
                  <input
                    id="edit-path"
                    type="text"
                    required
                    value={editFormData.path}
                    onChange={(e) => handleEditInputChange('path', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="/api/users"
                  />
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 mb-2">
                    Response Status
                  </label>
                  <input
                    id="edit-status"
                    type="number"
                    min="100"
                    max="599"
                    required
                    value={editFormData.response_status}
                    onChange={(e) => handleEditInputChange('response_status', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    placeholder="200"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="edit-headers" className="block text-sm font-medium text-gray-700 mb-2">
                  Response Headers (JSON)
                </label>
                <textarea
                  id="edit-headers"
                  rows={4}
                  value={editFormData.response_headers}
                  onChange={(e) => handleEditInputChange('response_headers', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                    validateJSON(editFormData.response_headers) ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder='{"Content-Type": "application/json"}'
                />
                {!validateJSON(editFormData.response_headers) && (
                  <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                )}
              </div>

              <div className="mb-6">
                <label htmlFor="edit-body" className="block text-sm font-medium text-gray-700 mb-2">
                  Response Body (JSON)
                </label>
                <textarea
                  id="edit-body"
                  rows={8}
                  value={editFormData.response_body}
                  onChange={(e) => handleEditInputChange('response_body', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                    validateJSON(editFormData.response_body) ? 'border-gray-300' : 'border-red-300'
                  }`}
                  placeholder='{"message": "Hello World"}'
                />
                {!validateJSON(editFormData.response_body) && (
                  <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingEndpoint(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isUpdating ||
                    !editFormData.path.trim() ||
                    !validateJSON(editFormData.response_body) ||
                    !validateJSON(editFormData.response_headers)
                  }
                  className="flex items-center px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-black/10 rounded-lg">
          <div className="px-6 py-4 border-b border-black/10">
            <h2 className="text-lg font-medium text-gray-900">API Endpoints</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage the endpoints for this project
            </p>
          </div>

          {endpoints.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new endpoint.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-black hover:bg-neutral-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Endpoint
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {endpoints?.map((endpoint) => (
                    <tr key={endpoint.uuid} className="hover:bg-black/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-mono">
                          {endpoint.path}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                          {endpoint.response_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {isMounted ? new Date(endpoint.created_at).toLocaleDateString() : ''}
                      </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex items-center justify-end space-x-2">
                           <button
                             onClick={() => startEditing(endpoint)}
                             className="text-black hover:text-black/70"
                             title="Edit"
                           >
                             <Edit className="h-4 w-4" />
                           </button>
                           <button
                             onClick={() => deleteEndpoint(endpoint.uuid)}
                             className="text-black hover:text-black/70"
                             title="Delete"
                           >
                             <Trash2 className="h-4 w-4" />
                           </button>
                         </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
