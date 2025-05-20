import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DashboardTable from '../components/dashboard/DashboardTable';

const IssuedHistory: React.FC = () => {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Issued Statements History</h1>
      <DashboardTable
        registrations={state.registrants || []}
        currentPage={currentPage}
        recordsPerPage={10}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default IssuedHistory;