import axios from 'axios';
import { formatDateForSQL, isValidDate } from '../utils/dateUtils';
import { ADUser, Registrant, AccountVerification } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Process date fields in responses
    try {
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map(item => {
          if (item && typeof item === 'object') {
            // Process created_at and other date fields if they exist
            const processedItem = { ...item };
            if (item.created_at && isValidDate(item.created_at)) {
              processedItem.created_at = new Date(item.created_at).toISOString();
            }
            if (item.registration_date && isValidDate(item.registration_date)) {
              processedItem.registration_date = new Date(item.registration_date).toISOString();
            }
            return processedItem;
          }
          return item;
        });
      } else if (response.data && typeof response.data === 'object') {
        // Process single object date fields
        if (response.data.created_at && isValidDate(response.data.created_at)) {
          response.data.created_at = new Date(response.data.created_at).toISOString();
        }
        if (response.data.registration_date && isValidDate(response.data.registration_date)) {
          response.data.registration_date = new Date(response.data.registration_date).toISOString();
        }
      }
    } catch (err) {
      console.error('Error processing date fields:', err);
    }
    
    return response;
  },
  (error) => {
    // Handle auth errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication failed'));
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error - Please check your connection'));
    }

    // Handle server errors
    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error - Please try again later'));
    }

    // Get detailed error message
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
  
  // Format dates for SQL if present in request body
  if (config.data && typeof config.data === 'object') {
    // Create a shallow copy of the data to avoid modifying the original
    const processedData = { ...config.data };
    
    // Process each field that might be a date
    if (processedData.created_at && isValidDate(processedData.created_at)) {
      processedData.created_at = formatDateForSQL(new Date(processedData.created_at));
    }
    if (processedData.registration_date && isValidDate(processedData.registration_date)) {
      processedData.registration_date = formatDateForSQL(new Date(processedData.registration_date));
    }
    
    config.data = processedData;
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
      hasStatement: 0
    };
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
export const getRegistrations = async (issuedOnly: boolean = false): Promise<Registrant[]> => {
  try {
    const response = await api.get('/api/registrations/', {
      params: issuedOnly ? { issued_only: true } : undefined
    });
    
    // Check if response.data is an array
    if (!Array.isArray(response.data)) {
      console.error('Expected an array of registrations, got:', response.data);
      return [];
    }
    
    return response.data.map((reg: any) => ({
      id: reg.id || '',
      accountNumber: reg.account_number || '',
      fullName: reg.full_name || '',
      phoneNumber: reg.phone_number || '',
      email: reg.email || null,
      idNumber: reg.id_number || null,
      registrationDate: reg.registration_date || new Date().toISOString(),
      issuedBy: reg.issued_by || '',
      branch: 'Head Office',
      hasStatement: 0,
      isIssued: reg.is_issued === true || reg.is_issued === 1
    }));
  } catch (error: any) {
    console.error('Error fetching registrations:', error);
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

// For implementing bulk registration 
export const createBulkRegistrations = async (
  data: Array<{
    accountNumber: string;
    customerName: string;
    phoneNumber: string;
  }>,
  branchId: string,
  issuerId: string
) => {
  try {
    // This endpoint is not implemented in the backend yet
    // This is a placeholder implementation
    console.log("Would send bulk registration data:", { data, branchId, issuerId });
    
    // Mock successful response
    return {
      success: data.length,
      failed: 0,
      errors: []
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.detail || 'Failed to process bulk registrations');
  }
};

export const getPendingRegistrations = async (): Promise<Registrant[]> => {
  const response = await api.get('/api/registrations/', {
    params: { issued_only: false, pending_only: true }
  });
  return response.data;
};

export const issueRegistration = async (registrationId: string) => {
  await api.patch(`/api/registrations/${registrationId}/issue`);
};

const handleRegister = async (registrationData) => {
  await registerAccount(registrationData);
  await issueRegistration(registrationData.id); // Mark as issued after registration
  // Refresh or redirect as needed
};

export default api;