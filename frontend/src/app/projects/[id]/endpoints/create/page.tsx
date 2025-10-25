'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { endpointAPI } from '@/lib/api';
import { GitBranch, ArrowLeft, Save } from 'lucide-react';

export default function CreateEndpoint() {
  const [formData, setFormData] = useState({
    method: 'GET',
    path: '',
    response_status: 200,
    response_body: '{\n  "message": "Hello World"\n}',
    response_headers: '{\n  "Content-Type": "application/json"\n}'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await endpointAPI.create(params.id as string, formData);
      router.push(`/projects/${params.id}/endpoints`);
    } catch (err: unknown) {
      setError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateJSON = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  };

  const isValidBody = validateJSON(formData.response_body);
  const isValidHeaders = validateJSON(formData.response_headers);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-black/70 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Endpoints
          </button>
        </div>

        <div className="bg-white border border-black/10 rounded-lg">
          <div className="px-6 py-4 border-b border-black/10">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <GitBranch className="w-6 h-6 mr-2 text-black" />
              Create New Endpoint
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Define a new API endpoint with custom response.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-2">
                  HTTP Method
                </label>
                <select
                  id="method"
                  value={formData.method}
                  onChange={(e) => handleInputChange('method', e.target.value)}
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
                  value={formData.path}
                  onChange={(e) => handleInputChange('path', e.target.value)}
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
                  value={formData.response_status}
                  onChange={(e) => handleInputChange('response_status', parseInt(e.target.value))}
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
                value={formData.response_headers}
                onChange={(e) => handleInputChange('response_headers', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                  isValidHeaders ? 'border-gray-300' : 'border-red-300'
                }`}
                placeholder='{"Content-Type": "application/json"}'
              />
              {!isValidHeaders && (
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
                value={formData.response_body}
                onChange={(e) => handleInputChange('response_body', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm ${
                  isValidBody ? 'border-gray-300' : 'border-red-300'
                }`}
                placeholder='{"message": "Hello World"}'
              />
              {!isValidBody && (
                <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.path.trim() || !isValidBody || !isValidHeaders}
                className="flex items-center px-6 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Creating...' : 'Create Endpoint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}