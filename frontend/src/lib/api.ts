import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (email: string, password: string) =>
    api.post('/signup', { email, password }),

  login: (email: string, password: string) =>
    api.post('/login', { email, password }),
};

// User APIs
export const userAPI = {
  getCurrentUser: () =>
    api.get('/user'),
};

// Organisation APIs
export const organisationAPI = {
  create: (name: string) =>
    api.post('/organisation', { name }),

  list: () =>
    api.get('/organisations'),
};

// Project APIs
export const projectAPI = {
  create: (name: string, organisationUuid: string) =>
    api.post('/project', { name, organisation_uuid: organisationUuid }),

  list: () =>
    api.get('/projects'),

  get: (uuid: string) =>
    api.get(`/project/${uuid}`),

  delete: (uuid: string) =>
    api.delete(`/project/${uuid}`),

  listProjectEndpoints: (uuid: string) =>
    api.get(`/project/${uuid}/endpoints`),

  uploadOpenAPI: (uuid: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(`/project/${uuid}/upload/openapiyml`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Endpoint APIs
export const endpointAPI = {
  create: (projectUuid: string, data: {
    method: string;
    path: string;
    response_body: string;
    response_status: number;
    response_headers: string;
  }) =>
    api.post(`/project/${projectUuid}/endpoint`, data),

  list: (projectUuid: string) =>
    api.get(`/project/${projectUuid}/endpoints`),

  get: (endpointUuid: string) =>
    api.get(`/endpoint/${endpointUuid}`),

  delete: (endpointUuid: string) =>
    api.delete(`/endpoint/${endpointUuid}`),

  update: (endpointUuid: string, data: {
    method: string;
    path: string;
    response_body: string;
    response_status: number;
    response_headers: string;
  }) =>
    api.put(`/endpoint/${endpointUuid}`, data),

  bulkCreate: (projectUuid: string, endpoints: {
    method: string;
    path: string;
    response_body: string;
    response_status: number;
    response_headers: string;
  }[]) =>
    api.post(`/project/${projectUuid}/endpoints/bulk`, { endpoints }),
};

export default api;