import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Registrant, AccountVerification, Branch } from '../types';
import { mockRegistrants } from '../data/mockData';
import { getBranches as fetchBranches, createBranch as apiCreateBranch, deleteBranch as apiDeleteBranch } from '../api/client';

// Context types
type AppState = {
  registrants: Registrant[];
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'ADD_REGISTRANT'; payload: Registrant }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'DELETE_REGISTRANT'; payload: string }
  | { type: 'UPLOAD_STATEMENT'; payload: { id: string; url: string } }
  | { type: 'SET_BRANCHES'; payload: Branch[] }
  | { type: 'ADD_BRANCH'; payload: Branch }
  | { type: 'DELETE_BRANCH'; payload: string }
  | { type: 'RESET_ERROR' };

type AppContextType = {
  state: AppState;
  addRegistrant: (registrant: Registrant) => void;
  deleteRegistrant: (id: string) => void;
  verifyAccount: (accountNumber: string) => Promise<AccountVerification>;
  uploadStatement: (id: string, url: string) => void;
  loadBranches: () => Promise<void>;
  addBranch: (branch: Branch) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
};

// Initial state
const initialState: AppState = {
  registrants: mockRegistrants,
  branches: [],
  isLoading: false,
  error: null,
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Reducer function
const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'ADD_REGISTRANT':
      return {
        ...state,
        registrants: [...state.registrants, action.payload],
      };
    case 'DELETE_REGISTRANT':
      return {
        ...state,
        registrants: state.registrants.filter((r) => r.id !== action.payload),
      };
    case 'UPLOAD_STATEMENT':
      return {
        ...state,
        registrants: state.registrants.map((r) =>
          r.id === action.payload.id
            ? { ...r, statementUrl: action.payload.url }
            : r
        ),
      };
    case 'SET_BRANCHES':
      return {
        ...state,
        branches: action.payload,
      };
    case 'ADD_BRANCH':
      return {
        ...state,
        branches: [...state.branches, action.payload],
      };
    case 'DELETE_BRANCH':
      return {
        ...state,
        branches: state.branches.filter((b) => b.id !== action.payload),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Provider component
export const Provider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadBranches = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const branches = await fetchBranches();
      dispatch({ type: 'SET_BRANCHES', payload: branches });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load branches' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const verifyAccount = async (accountNumber: string): Promise<AccountVerification> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call to check if account has received free statement
      const existingRegistrant = state.registrants.find(r => r.accountNumber === accountNumber);
      
      // Simulate API call to get account details (in real app, this would come from your backend)
      const mockAccountDetails = {
        fullName: 'John Doe',
        branch: 'Main Branch',
        phoneNumber: '0788123456'
      };

      dispatch({ type: 'SET_LOADING', payload: false });
      
      if (existingRegistrant) {
        return {
          accountNumber,
          hasReceivedFreeStatement: true,
          lastStatementDate: existingRegistrant.registrationDate,
          accountDetails: {
            fullName: existingRegistrant.fullName,
            branch: existingRegistrant.branch,
            phoneNumber: existingRegistrant.phoneNumber
          }
        };
      }

      return {
        accountNumber,
        hasReceivedFreeStatement: false,
        accountDetails: mockAccountDetails
      };
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to verify account. Please try again.' 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const addRegistrant = (registrant: Registrant) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate API call
    setTimeout(() => {
      try {
        dispatch({ type: 'ADD_REGISTRANT', payload: registrant });
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: 'Failed to add registrant. Please try again.' 
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }, 500);
  };

  const deleteRegistrant = (id: string) => {
    dispatch({ type: 'DELETE_REGISTRANT', payload: id });
  };

  const uploadStatement = (id: string, url: string) => {
    dispatch({ type: 'UPLOAD_STATEMENT', payload: { id, url } });
  };

  const addBranch = async (branch: Branch) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const newBranch = await apiCreateBranch(branch);
      dispatch({ type: 'ADD_BRANCH', payload: newBranch });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to add branch' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteBranch = async (id: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiDeleteBranch(id);
      dispatch({ type: 'DELETE_BRANCH', payload: id });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to delete branch' 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      addRegistrant, 
      deleteRegistrant,
      verifyAccount,
      uploadStatement,
      loadBranches,
      addBranch,
      deleteBranch
    }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};