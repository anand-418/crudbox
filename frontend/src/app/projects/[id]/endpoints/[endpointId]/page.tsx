'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { endpointAPI } from '@/lib/api';
import { ArrowLeft, Save, Trash2, Edit } from 'lucide-react';

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

export default function EditEndpointPage() {
    const router = useRouter();
    const params = useParams();
    const projectUuid = params.id as string;
    const endpointUuid = params.endpointId as string;

    const [isLoading, setIsLoading] = useState(true);
    const [endpoint, setEndpoint] = useState<Endpoint | null>(null);
    const [formData, setFormData] = useState({
        method: 'GET',
        path: '',
        response_status: 200,
        response_body: '',
        response_headers: ''
    });
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchEndpoint = async () => {
            if (!endpointUuid) return;

            try {
                const response = await endpointAPI.get(endpointUuid);
                const data = response.data?.endpoint ?? response.data;
                setEndpoint(data);
                setFormData({
                    method: data.method,
                    path: data.path,
                    response_status: data.response_status,
                    response_body: data.response_body,
                    response_headers: data.response_headers
                });
            } catch (err) {
                console.error('Failed to fetch endpoint:', err);
                setError('Failed to load endpoint details');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEndpoint();
    }, [projectUuid, endpointUuid]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!endpointUuid) return;

        setError('');
        setIsSaving(true);

        try {
            await endpointAPI.update(endpointUuid, formData);
            router.push(`/projects/${projectUuid}`);
        } catch (err: unknown) {
            setError((err as Error & { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update endpoint');
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this endpoint?')) {
            try {
                await endpointAPI.delete(endpointUuid);
                router.push(`/projects/${projectUuid}`);
            } catch (error) {
                console.error('Failed to delete endpoint:', error);
                setError('Failed to delete endpoint');
            }
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

    if (!endpoint) {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto text-center py-20">
                    <h2 className="text-2xl font-semibold text-gray-900">Endpoint not found</h2>
                    <button
                        onClick={() => router.push(`/projects/${projectUuid}`)}
                        className="mt-6 inline-flex items-center px-4 py-2 bg-black text-white font-medium rounded-md hover:bg-neutral-900"
                    >
                        Back to Project
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => router.push(`/projects/${projectUuid}`)}
                        className="flex items-center text-black/70 hover:text-black mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Project
                    </button>

                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <Edit className="w-8 h-8 mr-3" />
                            Edit Endpoint
                        </h1>
                        <button
                            onClick={handleDelete}
                            className="flex items-center px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-md transition-colors"
                        >
                            <Trash2 className="w-5 h-5 mr-2" />
                            Delete Endpoint
                        </button>
                    </div>
                </div>

                <div className="bg-white border border-black/10 rounded-lg shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded flex items-center">
                                <span className="mr-2">⚠️</span>
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-shadow"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-shadow"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-shadow"
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
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm transition-shadow ${validateJSON(formData.response_headers) ? 'border-gray-300' : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                    }`}
                                placeholder='{"Content-Type": "application/json"}'
                            />
                            {!validateJSON(formData.response_headers) && (
                                <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                            )}
                        </div>

                        <div className="mb-8">
                            <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                                Response Body (JSON)
                            </label>
                            <textarea
                                id="body"
                                rows={12}
                                value={formData.response_body}
                                onChange={(e) => handleInputChange('response_body', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-sm transition-shadow ${validateJSON(formData.response_body) ? 'border-gray-300' : 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                    }`}
                                placeholder='{"message": "Hello World"}'
                            />
                            {!validateJSON(formData.response_body) && (
                                <p className="mt-1 text-sm text-red-600">Invalid JSON format</p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => router.push(`/projects/${projectUuid}`)}
                                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    isSaving ||
                                    !formData.path.trim() ||
                                    !validateJSON(formData.response_body) ||
                                    !validateJSON(formData.response_headers)
                                }
                                className="flex items-center px-8 py-2.5 bg-black text-white font-medium rounded-md hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
