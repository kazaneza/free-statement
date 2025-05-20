import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Calendar, FileText, 
  Filter, ChevronDown, Download, Trash, Upload,
  CheckCircle, XCircle, Search, AlertCircle,
  CreditCard, Receipt, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/dateUtils';
import { getDashboardStats, getRegistrations } from '../api/client';

const Dashboard: React.FC = () => {
  const { state, deleteRegistrant, verifyAccount } = useApp();
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
  
  // Filter and paginate registrations
  const filteredRegistrations = registrations.filter(r => 
    (r.accountNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);
  
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
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
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteRegistrant(id);
        setRegistrations(prev => prev.filter(r => r.id !== id));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleUploadStatement = (id: string) => {
    console.log('Upload statement for:', id);
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
                        {formatDate(verificationResult.registrant.registrationDate)}
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
                
                {verificationResult.registrant.statementUrl && (
                  <div className="mt-4">
                    <img 
                      src={verificationResult.registrant.statementUrl} 
                      alt="Statement Preview" 
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Accounts</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_registrations.toLocaleString() || '0'}
              </h3>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="text-primary" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Registrations</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.todays_registrations.toLocaleString() || '0'}
              </h3>
            </div>
            <div className="p-3 bg-success/10 rounded-xl">
              <FileText className="text-success" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Branch Stats</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.branch_stats.length || '0'}
              </h3>
            </div>
            <div className="p-3 bg-warning/10 rounded-xl">
              <Calendar className="text-warning" size={24} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Statement Records */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-900">Issued Statements</h2>
            <div className="mt-3 sm:mt-0 flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              <div className="relative">
                <input
                  type="text"
                  className="form-input pl-8 py-2 text-sm rounded-lg"
                  placeholder="Search by account number..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
              </div>
              <button className="mt-2 sm:mt-0 btn-secondary text-sm py-2 flex items-center rounded-lg">
                <Download size={16} className="mr-1" />
                Export Records
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issued By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRecords.length > 0 ? (
                currentRecords.map((registrant) => (
                  <tr 
                    key={registrant.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registrant.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {registrant.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registrant.accountNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(registrant.registrationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {registrant.branch}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registrant.issuedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {registrant.statementUrl ? (
                        <img 
                          src={registrant.statementUrl} 
                          alt="Statement Preview" 
                          className="h-12 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">No preview</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        {registrant.statementUrl ? (
                          <a 
                            href={registrant.statementUrl}
                            className="text-primary hover:text-primary-dark flex items-center"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download size={16} className="mr-1" />
                            Download
                          </a>
                        ) : (
                          <button
                            onClick={() => handleUploadStatement(registrant.id)}
                            className="text-warning hover:text-warning/80 flex items-center"
                          >
                            <Upload size={16} className="mr-1" />
                            Upload
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(registrant.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash size={16} className="mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    No records found. {searchTerm && 'Try a different search term.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredRegistrations.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="btn-secondary rounded-lg"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="btn-secondary rounded-lg"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastRecord, filteredRegistrations.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredRegistrations.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px overflow-hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => handlePageChange(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-primary border-primary text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;