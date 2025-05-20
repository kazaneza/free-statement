import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getDashboardStats, getRegistrations } from '../api/client';
import DashboardStats from '../components/dashboard/DashboardStats';
import DashboardTable from '../components/dashboard/DashboardTable';

const Dashboard: React.FC = () => {
  const { state, verifyAccount } = useApp();
  const navigate = useNavigate();
  
  // Dashboard states
  const [stats, setStats] = useState<{
    total_registrations: number;
    todays_registrations: number;
    branch_stats: Array<{ branch: string; count: number }>;
  } | null>(null);
  const [registrations, setRegistrations] = useState<typeof state.registrants>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  
  // Account verification states
  const [accountNumber, setAccountNumber] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isEligible?: boolean;
    message?: string;
    registrant?: typeof state.registrants[0];
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [statsData, registrationsData] = await Promise.all([
          getDashboardStats(),
          getRegistrations()
        ]);
        setStats(statsData);
        setRegistrations(registrationsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const handleAccountVerification = async () => {
    if (!accountNumber.trim()) {
      setVerificationResult({
        isEligible: false,
        message: 'Please enter an account number'
      });
      return;
    }

    try {
      const result = await verifyAccount(accountNumber);
      
      const existingRegistrant = registrations.find(r => r.accountNumber === accountNumber);
      
      if (existingRegistrant) {
        setVerificationResult({
          isEligible: false,
          message: 'Account has already received a free statement',
          registrant: existingRegistrant
        });
        setShowModal(true);
      } else {
        setVerificationResult({
          isEligible: true,
          message: 'Account is eligible for free statement'
        });
        
        setTimeout(() => {
          navigate('/register', { 
            state: { 
              accountNumber,
              accountDetails: result.accountDetails
            }
          });
        }, 1500);
      }
    } catch (error) {
      setVerificationResult({
        isEligible: false,
        message: 'Failed to verify account. Please try again.'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-fade-in space-y-6">
      {/* Account Verification Modal */}
      {showModal && verificationResult?.registrant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Statement History</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Account Details</p>
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.registrant.fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.registrant.accountNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Branch</p>
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.registrant.branch}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.registrant.registrationDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Issued By</p>
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.registrant.issuedBy}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Verification Section */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 md:px-8">
          <h2 className="text-2xl font-bold text-white mb-2">Account Verification</h2>
          <p className="text-primary-light/90 mb-6">Check account eligibility for free bank statement</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter account number"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAccountVerification()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-white/60" />
                </div>
              </div>
            </div>
            <button 
              className="px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-white/90 transition-colors duration-200 shadow-sm"
              onClick={handleAccountVerification}
            >
              Verify Account
            </button>
          </div>
          
          {verificationResult && !showModal && (
            <div className={`mt-4 p-4 rounded-xl ${
              verificationResult.isEligible 
                ? 'bg-white/10 text-white' 
                : 'bg-red-500/10 text-red-100'
            }`}>
              <div className="flex items-center">
                {verificationResult.isEligible ? (
                  <CheckCircle className="mr-2" size={20} />
                ) : (
                  <XCircle className="mr-2" size={20} />
                )}
                {verificationResult.message}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Statement Records */}
      <DashboardTable
        registrations={registrations}
        currentPage={currentPage}
        recordsPerPage={recordsPerPage}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default Dashboard;