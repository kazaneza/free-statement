import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { Branch } from '../../types';
import { generateId } from '../../utils/idUtils';
import { formatDate } from '../../utils/dateUtils';

interface BulkBranchData {
  code: string;
  name: string;
}

const BranchManagement: React.FC = () => {
  const { addBranch, deleteBranch, loadBranches, state } = useApp();
  const [newBranch, setNewBranch] = useState({ code: '', name: '' });
  const [error, setError] = useState<string | null>(null);
  const [branchUploadStatus, setBranchUploadStatus] = useState<{
    success?: number;
    failed?: number;
    errors?: string[];
  } | null>(null);

  // Load branches only once on component mount
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchBranches = async () => {
      try {
        await loadBranches();
      } catch (err) {
        if (!controller.signal.aborted) {
          setError('Failed to load branches. Please try again.');
        }
      }
    };

    fetchBranches();

    return () => {
      controller.abort();
    };
  }, []);

  const validateBranchRow = (row: BulkBranchData): string[] => {
    const errors: string[] = [];
    
    if (!row.code) {
      errors.push('Branch code is required');
    }
    if (!row.name) {
      errors.push('Branch name is required');
    }
    
    if (state.branches.some(b => b.code === row.code)) {
      errors.push('Branch code already exists');
    }
    
    return errors;
  };

  const processBranchUpload = async (data: BulkBranchData[]) => {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const row of data) {
      const rowErrors = validateBranchRow(row);
      
      if (rowErrors.length > 0) {
        results.failed++;
        results.errors.push(`Row ${results.success + results.failed}: ${rowErrors.join(', ')}`);
        continue;
      }

      try {
        const newBranch: Branch = {
          id: generateId(),
          code: row.code.toUpperCase(),
          name: row.name,
          createdAt: new Date().toISOString()
        };

        await addBranch(newBranch);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${results.success + results.failed}: Failed to process`);
      }
    }

    setBranchUploadStatus(results);
  };

  const handleBranchFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          processBranchUpload(results.data as BulkBranchData[]);
        },
        error: (error) => {
          setBranchUploadStatus({
            success: 0,
            failed: 1,
            errors: [`Failed to parse CSV: ${error.message}`]
          });
        }
      });
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as BulkBranchData[];
          processBranchUpload(jsonData);
        } catch (error) {
          setBranchUploadStatus({
            success: 0,
            failed: 1,
            errors: ['Failed to parse Excel file']
          });
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const downloadBranchTemplate = () => {
    const template = [
      {
        code: 'KGL',
        name: 'Kigali Main Branch'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'branch_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!newBranch.code || !newBranch.name) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const branch: Branch = {
        id: generateId(),
        code: newBranch.code.toUpperCase(),
        name: newBranch.name,
        createdAt: new Date().toISOString()
      };

      await addBranch(branch);
      setNewBranch({ code: '', name: '' });
    } catch (error) {
      setError('Failed to add branch. Please try again.');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this branch?')) {
      try {
        await deleteBranch(id);
      } catch (error) {
        setError('Failed to delete branch. Please try again.');
      }
    }
  };

  if (state.isLoading && state.branches.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Branch Management</h2>
        <p className="text-gray-600 mt-1">Add and manage bank branches</p>
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

        <form onSubmit={handleAddBranch} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Branch Code</label>
              <input
                type="text"
                className="form-input"
                value={newBranch.code}
                onChange={(e) => setNewBranch(prev => ({ ...prev, code: e.target.value }))}
                placeholder="e.g., KGL"
              />
            </div>
            <div>
              <label className="form-label">Branch Name</label>
              <input
                type="text"
                className="form-input"
                value={newBranch.name}
                onChange={(e) => setNewBranch(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Kigali Main Branch"
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="btn-primary mt-4"
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Adding...' : 'Add Branch'}
          </button>
        </form>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Bulk Branch Upload</h3>
            <button
              onClick={downloadBranchTemplate}
              className="btn-outline flex items-center"
            >
              <Download size={16} className="mr-2" />
              Download Template
            </button>
          </div>

          <div className="mt-4">
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload size={24} className="mx-auto text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="branch-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                  >
                    <span>Upload branches</span>
                    <input
                      id="branch-upload"
                      name="branch-upload"
                      type="file"
                      className="sr-only"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleBranchFileUpload}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  CSV or Excel files only
                </p>
              </div>
            </div>
          </div>

          {branchUploadStatus && (
            <div className="mt-4">
              <div className={`rounded-md p-4 ${
                branchUploadStatus.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'
              }`}>
                <div className="flex">
                  {branchUploadStatus.failed === 0 ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : (
                    <AlertCircle className="text-yellow-400" size={20} />
                  )}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      branchUploadStatus.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      Upload Results
                    </h3>
                    <div className="mt-2 text-sm">
                      <p>Successfully processed: {branchUploadStatus.success}</p>
                      <p>Failed: {branchUploadStatus.failed}</p>
                    </div>
                    {branchUploadStatus.errors && branchUploadStatus.errors.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-red-700">
                          {branchUploadStatus.errors.map((error, index) => (
                            <p key={index}>{error}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      type="button"
                      onClick={() => setBranchUploadStatus(null)}
                      className="inline-flex rounded-md p-1.5 text-gray-500 hover:bg-gray-100 focus:outline-none"
                    >
                      <span className="sr-only">Dismiss</span>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Existing Branches</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
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
                {state.branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {branch.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(branch.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchManagement;