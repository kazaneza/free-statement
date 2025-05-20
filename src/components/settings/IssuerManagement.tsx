import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, X, Search, Loader } from 'lucide-react';
import { ADUser } from '../../types';
import { getADUsers } from '../../api/client';
import debounce from 'lodash/debounce';

const IssuerManagement: React.FC = () => {
  const { user } = useAuth();
  const [adUsers, setADUsers] = useState<ADUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Statement Issuers</h2>
        <p className="text-gray-600 mt-1">View and search Active Directory users who can issue statements</p>
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

        <div>
          <label className="form-label">Search Active Directory Users</label>
          <div className="relative">
            <input
              type="text"
              className="form-input pl-8"
              placeholder="Search users..."
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

          <div className="mt-4">
            {isSearching ? (
              <div className="text-center py-4 text-gray-500">
                Searching...
              </div>
            ) : adUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adUsers.map(user => (
                  <div 
                    key={user.username}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-sm text-gray-500">{user.username}</div>
                    {user.department && (
                      <div className="text-xs text-gray-400 mt-1">{user.department}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-4 text-gray-500">
                No users found matching your search
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Enter a search term to find users
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssuerManagement;