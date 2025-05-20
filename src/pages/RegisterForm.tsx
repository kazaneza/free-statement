import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowLeft, Upload } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Registrant } from '../types';
import { generateId } from '../utils/idUtils';

const RegisterForm: React.FC = () => {
  const { addRegistrant, state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [statementFile, setStatementFile] = useState<File | null>(null);
  
  // Get account details from location state
  const accountDetails = location.state?.accountDetails;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;
      
      // Check if file is an image or PDF
      if (fileType.startsWith('image/') || fileType === 'application/pdf') {
        setStatementFile(file);
      } else {
        alert('Please upload only image or PDF files');
      }
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accountDetails) {
      return;
    }

    const newRegistrant: Registrant = {
      id: generateId(),
      accountNumber: location.state?.accountNumber,
      fullName: accountDetails.fullName,
      phoneNumber: accountDetails.phoneNumber,
      email: '',
      idNumber: '',
      branch: accountDetails.branch,
      statementPeriod: '3 months',
      registrationDate: new Date().toISOString(), // Ensure proper date format
      statementUrl: statementFile ? URL.createObjectURL(statementFile) : undefined,
      issuedBy: 'Admin User'
    };
    
    addRegistrant(newRegistrant);
    setSubmitted(true);
    
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };
  
  const handleCancel = () => {
    navigate('/');
  };
  
  if (!accountDetails) {
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
          <p className="text-gray-600 mt-1">Confirm account details and optionally upload statement file</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Account Details</p>
                  <p className="text-sm font-medium text-gray-900">{accountDetails.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="text-sm font-medium text-gray-900">{location.state?.accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Branch</p>
                  <p className="text-sm font-medium text-gray-900">{accountDetails.branch}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{accountDetails.phoneNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Statement File (Optional)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload size={24} className="mx-auto text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="statement-file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                    >
                      <span>Upload a file</span>
                      <input
                        id="statement-file"
                        name="statement-file"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Images (PNG, JPG, GIF) or PDF up to 10MB
                  </p>
                </div>
              </div>
              {statementFile && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    Selected file: {statementFile.name}
                  </p>
                </div>
              )}
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
                disabled={state.isLoading}
              >
                {state.isLoading ? 'Registering...' : 'Register Account'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;