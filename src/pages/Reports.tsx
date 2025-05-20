import React from 'react';
import { Download, FileTextIcon, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { formatDate } from '../utils/dateUtils';

const Reports: React.FC = () => {
  const { state } = useApp();
  const { registrants } = state;
  
  // Filter registrants for current user (using 'Admin User' as example)
  const currentUser = 'Admin User';
  const userRegistrants = registrants.filter(r => r.issuedBy === currentUser);
  
  // Calculate metrics for user's registrations
  const totalRegistrations = userRegistrants.length;
  const todayRegistrations = userRegistrants.filter(r => 
    new Date(r.registrationDate).toDateString() === new Date().toDateString()
  ).length;
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Registration Reports</h1>
        <p className="text-gray-600">View and analyze your registration activities</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard 
          title="Total Registrations" 
          value={totalRegistrations.toString()} 
          icon={<FileTextIcon className="text-primary" />} 
        />
        <StatCard 
          title="Today's Registrations" 
          value={todayRegistrations.toString()} 
          icon={<Clock className="text-success" />}
        />
      </div>
      
      {/* Recent Activity with Previews */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
            <button className="btn-secondary text-sm py-1.5 flex items-center">
              <Download size={16} className="mr-1" />
              Export
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {userRegistrants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userRegistrants.slice(0, 9).map((registrant) => (
                <div key={registrant.id} className="bg-gray-50 rounded-lg overflow-hidden">
                  {registrant.statementUrl ? (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={registrant.statementUrl} 
                        alt="Statement Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">No preview available</p>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-medium text-gray-900">{registrant.fullName}</p>
                    <p className="text-sm text-gray-500">
                      Account: {registrant.accountNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(registrant.registrationDate)}
                    </p>
                    {registrant.statementUrl && (
                      <a 
                        href={registrant.statementUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 btn-primary text-sm py-1 px-3 inline-flex items-center"
                      >
                        <Download size={14} className="mr-1" />
                        Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No registrations found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;