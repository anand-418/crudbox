'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
// import { endpointAPI } from '@/lib/api';
import { Plus, GitBranch, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';

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

interface Project {
  uuid: string;
  name: string;
  code: string;
}

export default function ProjectEndpoints() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    fetchEndpoints();
    // TODO: Fetch project details
    setProject({ uuid: params.id as string, name: 'Mobile App API', code: 'ABC12' });
  }, [params.id]);

  const fetchEndpoints = async () => {
    try {
      // TODO: Implement endpoints list API in backend
      // const response = await endpointAPI.list(params.id);
      // setEndpoints(response.data);
      
      // Mock data for now
      setEndpoints([
        {
          uuid: '1',
          method: 'GET',
          path: '/api/users',
          response_status: 200,
          response_body: '{"users": [{"id": 1, "name": "John"}]}',
          response_headers: '{"Content-Type": "application/json"}',
          created_at: '2024-01-15',
          updated_at: '2024-01-20'
        },
        {
          uuid: '2',
          method: 'POST',
          path: '/api/users',
          response_status: 201,
          response_body: '{"id": 2, "name": "Jane", "created": true}',
          response_headers: '{"Content-Type": "application/json"}',
          created_at: '2024-01-16',
          updated_at: '2024-01-18'
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEndpoint = async (uuid: string) => {
    if (confirm('Are you sure you want to delete this endpoint?')) {
      try {
        // TODO: Implement delete API
        // await endpointAPI.delete(id);
        setEndpoints(endpoints.filter(e => e.uuid !== uuid));
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {project?.name} - Endpoints
              </h1>
              <p className="mt-2 text-gray-600">
                Manage API endpoints for project code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{project?.code}</span>
              </p>
            </div>
            <button
              onClick={() => router.push(`/projects/${params.id}/endpoints/create`)}
              className="flex items-center px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Endpoint
            </button>
          </div>
        </div>

        {endpoints.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No endpoints</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new endpoint.</p>
            <div className="mt-6">
              <button
                onClick={() => router.push(`/projects/${params.id}/endpoints/create`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-black hover:bg-neutral-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Endpoint
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
                  {endpoints.map((endpoint) => (
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
                        {new Date(endpoint.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${project?.code}${endpoint.path}`, '_blank')}
                            className="text-black hover:text-black/70"
                            title="Test Endpoint"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/projects/${params.id}/endpoints/${endpoint.uuid}/edit`)}
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
          </div>
        )}
      </div>
    </Layout>
  );
}