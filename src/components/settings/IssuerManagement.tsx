import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, AlertCircle, X, CheckCircle, XCircle, Search, Loader } from 'lucide-react';
import { generateId } from '../../utils/idUtils';
import { formatDate } from '../../utils/dateUtils';
import { Issuer, ADUser } from '../../types';
import { createIssuer, deleteIssuer, getIssuers, toggleIssuerActive, getADUsers } from '../../api/client';
import debounce from 'lodash/debounce';

const IssuerManagement: React.FC = () => {
  const { state } = useApp();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [adUsers, setADUsers] = useState<ADUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ADUser | null>(null);
  const [newIssuer, setNewIssuer] = useState({ branchId: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (!term) {
        setADUsers([]);
        setIsSearching(false);
        return;
      }

      try {
        const users = await getADUsers(term);
        setADUsers(users);
      } catch (error) {
        setError('Failed to search AD users');
        setADUsers([]);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      debouncedSearch(searchTerm);
    } else {
      setADUsers([]);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const issuersData = await getIssuers();
      setIssuers(issuersData);
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredADUsers = adUsers.filter(user => 
    !issuers.some(issuer => issuer.name === user.username)
  );

  const handleAddIssuer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedUser || !newIssuer.branchId) {
      setError('Please select both a user and a branch');
      return;
    }

    try {
      setIsLoading(true);
      const issuer = await createIssuer({
        name: selectedUser.username,
        branch_id: newIssuer.branchId
      });
      
      setIssuers(prev => [...prev, issuer]);
      setSelectedUser(null);
      setNewIssuer({ branchId: '' });
      setSearchTerm('');
    } catch (error) {
      setError('Failed to add issuer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIssuer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this issuer?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteIssuer(id);
      setIssuers(prev => prev.filter(issuer => issuer.id !== id));
    } catch (error) {
      setError('Failed to delete issuer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      setIsLoading(true);
      const result = await toggleIssuerActive(id);
      setIssuers(prev => prev.map(issuer => 
        issuer.id === id ? { ...issuer, active: result.active } : issuer
      ));
    } catch (error) {
      setError('Failed to update issuer status');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && issuers.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Issuer Management</h2>
        <p className="text-gray-600 mt-1">Add and manage statement issuers from Active Directory</p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAddIssuer} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Select User from Active Directory</label>
              <div className="relative">
                <input
                  type="text"
                  className="form-input pl-8"
                  placeholder="Search AD users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-2 top-2.5">
                  {isSearching ? (
                    <Loader className="h-5 w-5 text-gray-400 animate-spin" />
                  ) : (
                    <Search className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              {searchTerm && (
                <div className="mt-1 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                  {isSearching ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Searching...
                    </div>
                  ) : filteredADUsers.length > 0 ? (
                    filteredADUsers.map(user => (
                      <button
                        key={user.username}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedUser(user);
                          setSearchTerm('');
                        }}
                      >
                        <div className="font-medium">{user.displayName}</div>
                        <div className="text-sm text-gray-500">{user.username}</div>
                        {user.department && (
                          <div className="text-xs text-gray-400">{user.department}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No matching users found
                    </div>
                  )}
                </div>
              )}
              {selectedUser && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedUser.displayName}</div>
                    <div className="text-sm text-gray-500">{selectedUser.username}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Branch</label>
              <select
                className="form-input"
                value={newIssuer.branchId}
                onChange={(e) => setNewIssuer(prev => ({ ...prev, branchId: e.target.value }))}
              >
                <option value="">Select Branch</option>
                {state.branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary mt-4"
            disabled={isLoading || !selectedUser || !newIssuer.branchId}
          >
            {isLoading ? 'Adding...' : 'Add Issuer'}
          </button>
        </form>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Existing Issuers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branch
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issuers.map((issuer) => (
                  <tr key={issuer.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {issuer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {state.branches.find(b => b.id === issuer.branchId)?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(issuer.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issuer.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {issuer.active ? (
                          <CheckCircle size={12} className="mr-1" />
                        ) : (
                          <XCircle size={12} className="mr-1" />
                        )}
                        {issuer.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(issuer.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteIssuer(issuer.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {issuers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      No issuers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerManagement;