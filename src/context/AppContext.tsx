import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Registrant, AccountVerification, Branch } from '../types';
import { verifyAccount as apiVerifyAccount } from '../api/client';

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
  | { type: 'SET_REGISTRANTS'; payload: Registrant[] }
  | { type: 'ADD_BRANCH'; payload: Branch }
  | { type: 'DELETE_BRANCH'; payload: string }
  | { type: 'SET_BRANCHES'; payload: Branch[] }
  | { type: 'RESET_ERROR' };

type AppContextType = {
  state: AppState;
  addRegistrant: (registrant: Registrant) => void;
  deleteRegistrant: (id: string) => void;
  verifyAccount: (accountNumber: string) => Promise<AccountVerification>;
  setRegistrants: (registrants: Registrant[]) => void;
  addBranch: (branch: Branch) => void;
  deleteBranch: (id: string) => void;
  loadBranches: () => Promise<void>;
};

// Initial state
const initialState: AppState = {
  registrants: [],
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
        registrants: [action.payload, ...state.registrants],
      };
    case 'SET_REGISTRANTS':
      return {
        ...state,
        registrants: action.payload || [],
      };
    case 'DELETE_REGISTRANT':
      return {
        ...state,
        registrants: state.registrants.filter((r) => r.id !== action.payload),
      };
    case 'ADD_BRANCH':
      return {
        ...state,
        branches: [action.payload, ...state.branches],
      };
    case 'SET_BRANCHES':
      return {
        ...state,
        branches: action.payload || [],
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

  const verifyAccount = async (accountNumber: string): Promise<AccountVerification> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const result = await apiVerifyAccount(accountNumber);
      dispatch({ type: 'SET_LOADING', payload: false });
      return result;
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to verify account. Please try again.' 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const addRegistrant = (registrant: Registrant) => {
    dispatch({ type: 'ADD_REGISTRANT', payload: registrant });
  };

  const deleteRegistrant = (id: string) => {
    dispatch({ type: 'DELETE_REGISTRANT', payload: id });
  };

  const setRegistrants = (registrants: Registrant[]) => {
    dispatch({ type: 'SET_REGISTRANTS', payload: registrants });
  };
  
  const addBranch = (branch: Branch) => {
    dispatch({ type: 'ADD_BRANCH', payload: branch });
  };

  const deleteBranch = (id: string) => {
    dispatch({ type: 'DELETE_BRANCH', payload: id });
  };

  const loadBranches = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // This is a mock implementation - in a real app, you would fetch branches from API
      // For now, let's set some sample branches
      const mockBranches: Branch[] = [
        { id: "1", code: "KGL", name: "Kigali Main Branch", createdAt: new Date().toISOString() },
        { id: "2", code: "RMR", name: "Remera Branch", createdAt: new Date().toISOString() }
      ];
      
      dispatch({ type: 'SET_BRANCHES', payload: mockBranches });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error.message || 'Failed to load branches. Please try again.' 
      });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      addRegistrant, 
      deleteRegistrant,
      verifyAccount,
      setRegistrants,
      addBranch,
      deleteBranch,
      loadBranches
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