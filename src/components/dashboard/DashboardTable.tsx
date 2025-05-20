import React from 'react';
import { Download, Upload, Trash, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { Registrant } from '../../types';

interface DashboardTableProps {
  registrations: Registrant[];
  currentPage: number;
  recordsPerPage: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onUpload: (id: string) => void;
}

const DashboardTable: React.FC<DashboardTableProps> = ({
  registrations,
  currentPage,
  recordsPerPage,
  searchTerm,
  onSearchChange,
  onPageChange,
  onDelete,
  onUpload
}) => {
  const filteredRegistrations = registrations.filter(r => 
    (r.accountNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (r.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredRegistrations.length / recordsPerPage);
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRegistrations.slice(indexOfFirstRecord, indexOfLastRecord);

  return (
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
                onChange={(e) => onSearchChange(e.target.value)}
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
                          onClick={() => onUpload(registrant.id)}
                          className="text-warning hover:text-warning/80 flex items-center"
                        >
                          <Upload size={16} className="mr-1" />
                          Upload
                        </button>
                      )}
                      <button 
                        onClick={() => onDelete(registrant.id)}
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

      {filteredRegistrations.length > 0 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-secondary rounded-lg"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
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
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => onPageChange(index + 1)}
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
                  onClick={() => onPageChange(currentPage + 1)}
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
  );
};

export default DashboardTable;