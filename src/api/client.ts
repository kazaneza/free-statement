import axios from 'axios';
import { formatDateForSQL, isValidDate } from '../utils/dateUtils';
import { ADUser, Registrant, AccountVerification } from '../types';

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
export const verifyAccount = async (accountNumber: string): Promise<AccountVerification> => {
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
}): Promise<Registrant> => {
  try {
    const response = await api.post('/api/registrations/', {
      account_number: registrationData.accountNumber,
      full_name: registrationData.fullName,
      phone_number: registrationData.phoneNumber,
      email: registrationData.email,
      id_number: registrationData.idNumber
    });

    return {
      id: response.data.id,
      accountNumber: response.data.account_number,
      fullName: response.data.full_name,
      phoneNumber: response.data.phone_number,
      email: response.data.email,
      idNumber: response.data.id_number,
      registrationDate: response.data.registration_date,
      issuedBy: response.data.issued_by,
      branch: 'Head Office',
      isIssued: response.data.is_issued || false
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to register account');
  }
};

// Mark a registration as issued
export const markRegistrationAsIssued = async (registrationId: string): Promise<void> => {
  try {
    await api.put(`/api/registrations/${registrationId}/issue`);
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to mark registration as issued');
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
export const getRegistrations = async (issuedOnly: boolean = true): Promise<Registrant[]> => {
  try {
    const response = await api.get('/api/registrations/', {
      params: { issued_only: issuedOnly }
    });
    return response.data.map((reg: any) => ({
      id: reg.id,
      accountNumber: reg.account_number,
      fullName: reg.full_name,
      phoneNumber: reg.phone_number,
      email: reg.email,
      idNumber: reg.id_number,
      registrationDate: reg.registration_date,
      issuedBy: reg.issued_by,
      branch: 'Head Office',
      isIssued: reg.is_issued || false
    }));
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch registrations');
  }
};

// Get AD users
export const getADUsers = async (searchTerm?: string): Promise<ADUser[]> => {
  try {
    const response = await api.get('/api/issuers/ad-users', {
      params: searchTerm ? { search: searchTerm } : undefined
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch AD users');
  }
};

// Create bulk registrations (stub function)
export const createBulkRegistrations = async (
  data: any[], 
  branch: string, 
  issuer: string
): Promise<{success: number; failed: number; errors: string[]}> => {
  // This is a stub function that would normally make an API call
  // In a real app, this would call an endpoint like '/api/registrations/bulk'
  return {
    success: 2,
    failed: 0,
    errors: []
  };
};

export default api;