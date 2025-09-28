import axios from 'axios';
import { useAuthStore } from './auth-store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API types
export interface UserCreate {
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string; // API expects username field for email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
  };
}

export interface Credential {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface CredentialCreate {
  name: string;
  type: string;
  value: string;
}

export interface Workflow {
  id: string;
  name: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface WorkflowCreate {
  name: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  finished_at?: string;
}

// API functions
export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  register: (data: UserCreate) => api.post('/auth/register', data),
};

export const credentialsApi = {
  list: () => api.get<Credential[]>('/credentials/'),
  create: (data: CredentialCreate) => api.post<Credential>('/credentials/', data),
  delete: (id: string) => api.delete(`/credentials/${id}`),
};

export const workflowsApi = {
  list: () => api.get<Workflow[]>('/workflows/'),
  get: (id: string) => api.get<Workflow>(`/workflows/${id}`),
  create: (data: WorkflowCreate) => api.post<Workflow>('/workflows/', data),
  update: (id: string, data: any) => api.patch<Workflow>(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  execute: (id: string) => api.post(`/workflows/${id}/execute`),
  getRuns: (id: string) => api.get<WorkflowRun[]>(`/workflows/${id}/runs`),
};

export const workflowRunsApi = {
  get: (id: string) => api.get(`/workflow-runs/${id}`),
};