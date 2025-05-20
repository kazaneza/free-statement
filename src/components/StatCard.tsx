import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendUp 
}) => {
  return (
    <div className="card p-6 animate-slide-in-up">
      <div className="flex items-start">
        <div className="rounded-full bg-gray-100 p-3 mr-4">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          
          {trend && (
            <div className="mt-1 flex items-center text-xs font-medium">
              {trendUp ? (
                <>
                  <TrendingUp size={14} className="text-success mr-1" />
                  <span className="text-success">{trend}</span>
                </>
              ) : (
                <>
                  <TrendingDown size={14} className="text-red-500 mr-1" />
                  <span className="text-red-500">{trend}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;