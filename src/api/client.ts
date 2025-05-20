import axios from 'axios';
import { formatDateForSQL, isValidDate } from '../utils/dateUtils';
import { Branch, Issuer, ADUser, Registrant } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(item => ({
        ...item,
        created_at: item.created_at && isValidDate(item.created_at) 
          ? new Date(item.created_at).toISOString() 
          : null
      }));
    } else if (response.data && response.data.created_at && isValidDate(response.data.created_at)) {
      response.data.created_at = new Date(response.data.created_at).toISOString();
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication failed'));
    }

    if (!error.response) {
      return Promise.reject(new Error('Network error - Please check your connection'));
    }

    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error - Please try again later'));
    }

    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Add request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (config.data && config.data.created_at && isValidDate(config.data.created_at)) {
    config.data.created_at = formatDateForSQL(new Date(config.data.created_at));
  }
  
  return config;
});

export const login = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  try {
    const response = await axios.post(`${API_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Verify account and check if already registered
export const verifyAccount = async (accountNumber: string) => {
  try {
    const response = await api.get(`/api/registrations/verify/${accountNumber}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to verify account');
  }
};

// Register new account
export const registerAccount = async (registrationData: {
  accountNumber: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  idNumber?: string;
}) => {
  try {
    const response = await api.post('/api/registrations/', registrationData);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to register account');
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/registrations/stats');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
  }
};

// Get all registrations
export const getRegistrations = async () => {
  try {
    const response = await api.get('/api/registrations/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch registrations');
  }
};

// Get all branches
export const getBranches = async () => {
  try {
    const response = await api.get('/api/branches/');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch branches');
  }
};

// Create a new branch
export const createBranch = async (branch: Branch) => {
  try {
    const response = await api.post('/api/branches/', branch);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to create branch');
  }
};

// Delete a branch
export const deleteBranch = async (id: string) => {
  try {
    await api.delete(`/api/branches/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to delete branch');
  }
};

export default api;