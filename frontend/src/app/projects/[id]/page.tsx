'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { projectAPI, endpointAPI } from '@/lib/api';
import { Plus, Trash2, ArrowLeft, FolderOpen, Save, UploadCloud, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

interface OpenAPIOperationPreview {
  method: string;
  path: string;
  response_status: number;
  response_body: string;
  response_headers: string;
  status: 'new' | 'existing' | 'duplicate';
  reason?: string;
}

interface OpenAPIImportPreview {
  total_operations: number;
  new_count: number;
  existing_count: number;
  skipped_count: number;
  operations: OpenAPIOperationPreview[];
}

interface BulkCreateSkippedEndpoint {
  method: string;
  path: string;
  reason: string;
}

interface BulkCreateResult {
  created?: Endpoint[];
  skipped?: BulkCreateSkippedEndpoint[];
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState<OpenAPIImportPreview | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkCreateResult | null>(null);
  const [isUploadingOpenAPI, setIsUploadingOpenAPI] = useState(false);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      const fetchedEndpoints: Endpoint[] = Array.isArray(data?.endpoints)
        ? (data.endpoints as Endpoint[])
        : Array.isArray(data)
          ? (data as Endpoint[])
          : [];
      setEndpoints(fetchedEndpoints);
      setEndpoints(fetchedEndpoints);
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
      setShowCreateForm(false);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError('');
    setPreview(null);
    setBulkResult(null);
  };

  const handleUploadSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!projectUuid) {
      setUploadError('Project not specified');
      return;
    }

    if (!selectedFile) {
      setUploadError('Please select an OpenAPI YAML file');
      return;
    }

    setIsUploadingOpenAPI(true);
    setUploadError('');
    setBulkResult(null);

    try {
      const response = await projectAPI.uploadOpenAPI(projectUuid, selectedFile);
      const previewData = (response.data?.preview ?? response.data) as OpenAPIImportPreview | undefined;
      setPreview(previewData ?? null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (error as Error).message ||
        'Failed to upload OpenAPI file';
      setUploadError(message);
      setPreview(null);
    } finally {
      setIsUploadingOpenAPI(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!projectUuid) {
      setUploadError('Project not specified');
      return;
    }

    if (!preview) {
      setUploadError('No preview available to import');
      return;
    }

    const newOperations = preview.operations?.filter((operation) => operation.status === 'new') ?? [];

    if (newOperations.length === 0) {
      setUploadError('No new endpoints to import');
      return;
    }

    setIsBulkCreating(true);
    setUploadError('');

    try {
      const payload = newOperations.map((operation) => ({
        method: operation.method,
        path: operation.path,
        response_body: operation.response_body,
        response_status: operation.response_status,
        response_headers: operation.response_headers,
      }));

      const response = await endpointAPI.bulkCreate(projectUuid, payload);
      const resultData = (response.data?.result ?? response.data) as BulkCreateResult | undefined;
      setBulkResult(resultData ?? null);
      setPreview(null);
      await fetchEndpoints();
    } catch (error) {
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data?.error ||
        (error as Error).message ||
        'Failed to create endpoints';
      setUploadError(message);
    } finally {
      setIsBulkCreating(false);
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

  const getPreviewStatusStyles = (status: OpenAPIOperationPreview['status']) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'existing':
        return 'bg-blue-100 text-blue-800';
      case 'duplicate':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPreviewStatusLabel = (status: OpenAPIOperationPreview['status']) => {
    switch (status) {
      case 'new':
        return 'Ready';
      case 'existing':
        return 'Already exists';
      case 'duplicate':
        return 'Duplicate in file';
      default:
        return status;
    }
  };

  const newOperationsCount = preview?.operations?.filter((operation) => operation.status === 'new').length ?? 0;

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
                setShowCreateForm(!showCreateForm);
              }}
              className="flex items-center px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900"
            >
              <Plus className="w-5 h-5 mr-2" />
              {showCreateForm ? 'Cancel' : 'New Endpoint'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-black/10 rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-black/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <UploadCloud className="w-6 h-6 mr-2 text-black" />
              Import OpenAPI Specification
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Upload an OpenAPI YAML file to generate endpoints automatically.
            </p>
          </div>
          <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
            {uploadError && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-900"
              />
              <button
                type="submit"
                disabled={isUploadingOpenAPI || !selectedFile}
                className="inline-flex items-center justify-center rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {isUploadingOpenAPI ? 'Uploading...' : 'Upload & Preview'}
              </button>
            </div>

            {selectedFile && (
              <p className="text-sm text-gray-600">
                Selected file: <span className="font-medium text-gray-800">{selectedFile.name}</span>
              </p>
            )}

            {preview && (
              <div className="space-y-4 rounded-md border border-black/10 bg-gray-50 p-4">
                <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-3">
                  <div className="rounded-md border border-black/10 bg-white p-3">
                    <p className="text-xs uppercase text-gray-500">Total operations</p>
                    <p className="mt-1 text-xl font-semibold text-gray-900">{preview.total_operations}</p>
                  </div>
                  <div className="rounded-md border border-black/10 bg-white p-3">
                    <p className="text-xs uppercase text-gray-500">New endpoints</p>
                    <p className="mt-1 text-xl font-semibold text-green-700">{preview.new_count}</p>
                  </div>
                  <div className="rounded-md border border-black/10 bg-white p-3">
                    <p className="text-xs uppercase text-gray-500">Already existing</p>
                    <p className="mt-1 text-xl font-semibold text-blue-700">{preview.existing_count}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-md border border-black/5 bg-white">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Method</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Path</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.operations.map((operation, index) => (
                        <tr key={`${operation.method}-${operation.path}-${index}`}>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMethodColor(operation.method)}`}>
                              {operation.method}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-sm text-gray-900">{operation.path}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPreviewStatusStyles(operation.status)}`}>
                              {getPreviewStatusLabel(operation.status)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {operation.reason || 'Will be created'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-black/10 pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-gray-600">
                    {newOperationsCount > 0
                      ? `${newOperationsCount} new endpoints ready to be created.`
                      : 'No new endpoints detected in this upload.'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                        setBulkResult(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-black/5"
                    >
                      Clear Preview
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={isBulkCreating || newOperationsCount === 0}
                      className="inline-flex items-center rounded-md bg-black px-5 py-2 text-sm font-medium text-white hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isBulkCreating ? 'Creating...' : `Confirm & Create (${newOperationsCount})`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {bulkResult && (
              <div className="space-y-3 rounded-md border border-black/10 bg-white p-4">
                <div className="flex items-start gap-2 text-sm text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {bulkResult.created?.length ?? 0} endpoints created successfully.
                    </p>
                    <p className="text-gray-600">Your project endpoints have been updated.</p>
                  </div>
                </div>

                {bulkResult.skipped && bulkResult.skipped.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <div className="flex items-center gap-2 font-medium">
                      <AlertTriangle className="h-4 w-4" />
                      {bulkResult.skipped.length} endpoints skipped
                    </div>
                    <ul className="mt-2 space-y-1 text-gray-700">
                      {bulkResult.skipped.slice(0, 5).map((item, index) => (
                        <li key={`${item.method}-${item.path}-${index}`} className="font-mono">
                          {item.method} {item.path} – {item.reason}
                        </li>
                      ))}
                      {bulkResult.skipped.length > 5 && (
                        <li className="text-xs text-gray-500">+{bulkResult.skipped.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${validateJSON(createFormData.response_headers) ? 'border-gray-300' : 'border-red-300'
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${validateJSON(createFormData.response_body) ? 'border-gray-300' : 'border-red-300'
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
                    <tr
                      key={endpoint.uuid}
                      className="hover:bg-black/5 cursor-pointer transition-colors"
                      onClick={() => router.push(`/projects/${projectUuid}/endpoints/${endpoint.uuid}`)}
                    >
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEndpoint(endpoint.uuid);
                            }}
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
