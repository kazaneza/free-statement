import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Registrant, AccountVerification } from '../types';
import { verifyAccount as apiVerifyAccount } from '../api/client';

// Context types
type AppState = {
  registrants: Registrant[];
  isLoading: boolean;
  error: string | null;
};

type Action =
  | { type: 'ADD_REGISTRANT'; payload: Registrant }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'DELETE_REGISTRANT'; payload: string }
  | { type: 'RESET_ERROR' };

type AppContextType = {
  state: AppState;
  addRegistrant: (registrant: Registrant) => void;
  deleteRegistrant: (id: string) => void;
  verifyAccount: (accountNumber: string) => Promise<AccountVerification>;
};

// Initial state
const initialState: AppState = {
  registrants: [],
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
        payload: 'Failed to verify account. Please try again.' 
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

  return (
    <AppContext.Provider value={{ 
      state, 
      addRegistrant, 
      deleteRegistrant,
      verifyAccount
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