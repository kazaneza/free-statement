import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createBulkRegistrations } from '../../api/client';

interface BulkUploadData {
  accountNumber: string;
  customerName: string;
  phoneNumber: string;
}

const BulkRegistration: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<{
    success?: number;
    failed?: number;
    errors?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateRow = (row: any): string[] => {
    const errors: string[] = [];
    
    // Check if the required fields exist with the correct names
    if (!row.accountNumber && !row['Account Number']) {
      errors.push('Account number is required');
    }
    if (!row.customerName && !row['Customer Name']) {
      errors.push('Customer name is required');
    }
    if (!row.phoneNumber && !row['Phone Number']) {
      errors.push('Phone number is required');
    }
    
    return errors;
  };

  const processUploadedData = async (data: any[]) => {
    setIsLoading(true);
    setError(null);
    setUploadStatus(null);

    try {
      // Transform the data to match the expected format
      const formattedData = data.map(row => ({
        accountNumber: row.accountNumber || row['Account Number'] || '',
        customerName: row.customerName || row['Customer Name'] || '',
        phoneNumber: row.phoneNumber || row['Phone Number'] || ''
      }));

      // Validate all rows first
      const validationErrors: string[] = [];
      formattedData.forEach((row, index) => {
        const rowErrors = validateRow(row);
        if (rowErrors.length > 0) {
          validationErrors.push(`Row ${index + 1}: ${rowErrors.join(', ')}`);
        }
      });

      if (validationErrors.length > 0) {
        setUploadStatus({
          success: 0,
          failed: formattedData.length,
          errors: validationErrors
        });
        return;
      }

      // Send data to API
      const response = await createBulkRegistrations(formattedData, 'default-branch', 'default-issuer');
      
      setUploadStatus({
        success: response.success || 0,
        failed: response.failed || 0,
        errors: response.errors || []
      });
    } catch (error: any) {
      console.error('Failed to process registrations:', error);
      setError(error.message || 'Failed to process registrations');
      setUploadStatus({
        success: 0,
        failed: data.length,
        errors: [error.message || 'Failed to process registrations']
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processUploadedData(results.data);
        },
        error: (error) => {
          setError(`Failed to parse CSV: ${error.message}`);
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
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processUploadedData(jsonData);
        } catch (error) {
          setError('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setError('Invalid file format. Please upload CSV or Excel file.');
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        'Account Number': '4001234567',
        'Customer Name': 'John Doe',
        'Phone Number': '0788123456'
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_registration_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Bulk Account Registration</h2>
        <p className="text-gray-600 mt-1">Upload CSV or Excel file containing account details</p>
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

        <div className="mb-6">
          <button
            onClick={downloadTemplate}
            className="btn-outline flex items-center"
          >
            <Download size={16} className="mr-2" />
            Download Template
          </button>
        </div>

        <div className="mt-4">
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {isLoading ? (
                <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
              ) : (
                <Upload size={24} className="mx-auto text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="bulk-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary"
                >
                  <span>Upload a file</span>
                  <input
                    id="bulk-upload"
                    name="bulk-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isLoading}
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

        {uploadStatus && (
          <div className="mt-6">
            <div className={`rounded-md p-4 ${
              uploadStatus.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'
            }`}>
              <div className="flex">
                {uploadStatus.failed === 0 ? (
                  <CheckCircle className="text-green-400" size={20} />
                ) : (
                  <AlertCircle className="text-yellow-400" size={20} />
                )}
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${
                    uploadStatus.failed === 0 ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    Upload Results
                  </h3>
                  <div className="mt-2 text-sm">
                    <p>Successfully processed: {uploadStatus.success}</p>
                    <p>Failed: {uploadStatus.failed}</p>
                  </div>
                  {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm text-red-700">
                        {uploadStatus.errors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setUploadStatus(null)}
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
    </div>
  );
};

export default BulkRegistration;