import React from 'react';
import { Users, FileText, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    total_registrations: number;
    todays_registrations: number;
    branch_stats: Array<{ branch: string; count: number }>;
  } | null;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
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
  );
};

export default DashboardStats;