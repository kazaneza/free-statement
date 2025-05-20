import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerAccount } from '../api/client';

const RegisterForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get account details from location state
  const accountDetails = location.state?.accountDetails;
  const accountNumber = location.state?.accountNumber;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountDetails || !accountNumber || !user) {
      setError('Invalid registration data');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await registerAccount({
        accountNumber,
        fullName: accountDetails.fullName,
        phoneNumber: accountDetails.phoneNumber
      });
      
      setSubmitted(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  if (!accountDetails || !accountNumber) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">No account details found. Please verify the account first.</p>
        <button onClick={handleCancel} className="btn-primary mt-4">
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto animate-fade-in">
        <div className="bg-white p-8 rounded-lg shadow-md w-full text-center">
          <div className="rounded-full bg-green-100 p-3 mx-auto mb-4 inline-flex">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful</h2>
          <p className="text-gray-600 mb-6">
            The account has been successfully registered for free bank statements.
          </p>
          <div className="mt-4">
            <div className="animate-pulse bg-green-500 h-1 rounded-full" />
            <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in">
      <div className="flex items-center mb-6">
        <button 
          onClick={handleCancel}
          className="text-gray-600 hover:text-primary flex items-center focus:outline-none"
        >
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Dashboard</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Register for Free Bank Statement</h2>
          <p className="text-gray-600 mt-1">Confirm account details to complete registration</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Details</p>
                  <p className="text-sm font-medium text-gray-900">{accountDetails.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="text-sm font-medium text-gray-900">{accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{user?.branch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{accountDetails.phoneNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-outline mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Confirm Registration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;