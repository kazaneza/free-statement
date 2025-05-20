import axios from 'axios';
import { formatDateForSQL, isValidDate } from '../utils/dateUtils';
import { Branch, Issuer, ADUser, Registrant } from '../types';

// Update API URL to match your backend
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
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    
    // Transform SQL Server datetime to ISO string
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
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication failed'));
    }

    // Network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error - Please check your connection'));
    }

    // Server errors
    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error - Please try again later'));
    }

    // Client errors
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

// Add request interceptor to add token
api.interceptors.request.use((config) => {
  console.log('API Request:', {
    url: config.url,
    method: config.method,
    headers: config.headers,
    data: config.data
  });

  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Transform dates to SQL Server format before sending
  if (config.data && config.data.created_at && isValidDate(config.data.created_at)) {
    config.data.created_at = formatDateForSQL(new Date(config.data.created_at));
  }
  
  return config;
});

export const login = async (username: string, password: string) => {
  console.log('Attempting login for user:', username);
  
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  try {
    const response = await axios.post(`${API_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log('Login successful');
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Dashboard endpoints
export const getDashboardStats = async () => {
  try {
    console.log('Fetching dashboard stats...');
    const response = await api.get('/api/registrations/stats');
    console.log('Dashboard stats fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch dashboard stats:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard stats');
  }
};

// Branch endpoints
export const getBranches = async (): Promise<Branch[]> => {
  try {
    console.log('Fetching branches...');
    const response = await api.get('/api/branches/');
    console.log('Branches fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch branches:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch branches');
  }
};

export const createBranch = async (branch: { code: string; name: string }): Promise<Branch> => {
  try {
    console.log('Creating branch:', branch);
    const response = await api.post('/api/branches/', branch);
    console.log('Branch created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create branch:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create branch');
  }
};

export const deleteBranch = async (id: string): Promise<void> => {
  try {
    console.log('Deleting branch:', id);
    await api.delete(`/api/branches/${id}/`);
    console.log('Branch deleted successfully');
  } catch (error: any) {
    console.error('Failed to delete branch:', error);
    throw new Error(error.response?.data?.detail || 'Failed to delete branch');
  }
};

// Issuer endpoints
export const getIssuers = async (): Promise<Issuer[]> => {
  try {
    console.log('Fetching issuers...');
    const response = await api.get('/api/issuers/');
    console.log('Issuers fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch issuers:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch issuers');
  }
};

export const createIssuer = async (issuer: { name: string; branch_id: string }): Promise<Issuer> => {
  try {
    console.log('Creating issuer:', issuer);
    const response = await api.post('/api/issuers/', issuer);
    console.log('Issuer created:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to create issuer:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create issuer');
  }
};

export const deleteIssuer = async (id: string): Promise<void> => {
  try {
    console.log('Deleting issuer:', id);
    await api.delete(`/api/issuers/${id}/`);
    console.log('Issuer deleted successfully');
  } catch (error: any) {
    console.error('Failed to delete issuer:', error);
    throw new Error(error.response?.data?.detail || 'Failed to delete issuer');
  }
};

export const toggleIssuerActive = async (id: string): Promise<{ active: boolean }> => {
  try {
    console.log('Toggling issuer status:', id);
    const response = await api.put(`/api/issuers/${id}/toggle-active`);
    console.log('Issuer status toggled:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to toggle issuer status:', error);
    throw new Error(error.response?.data?.detail || 'Failed to toggle issuer status');
  }
};

// AD User endpoints
export const getADUsers = async (searchTerm?: string): Promise<ADUser[]> => {
  try {
    console.log('Fetching AD users with search term:', searchTerm);
    const response = await api.get('/api/issuers/ad-users', {
      params: searchTerm ? { search: searchTerm } : undefined
    });
    console.log('AD users fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch AD users:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch AD users');
  }
};

// Registration endpoints
export const createBulkRegistrations = async (
  registrations: Array<{ accountNumber: string; customerName: string; phoneNumber: string }>
): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    console.log('Creating bulk registrations:', { registrations });
    
    // Transform the data to match the API's expected format
    const transformedData = registrations.map(reg => ({
      account_number: reg.accountNumber,
      customer_name: reg.customerName,
      phone_number: reg.phoneNumber
    }));

    const response = await api.post('/api/registrations/bulk', transformedData);
    
    console.log('Bulk registrations created:', response.data);
    return {
      success: response.data.success || 0,
      failed: response.data.failed || 0,
      errors: response.data.errors || []
    };
  } catch (error: any) {
    console.error('Failed to create bulk registrations:', error);
    throw error;
  }
};

export const getRegistrations = async (): Promise<Registrant[]> => {
  try {
    console.log('Fetching registrations...');
    const response = await api.get('/api/registrations/');
    console.log('Registrations fetched:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch registrations:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch registrations');
  }
};

export default api;