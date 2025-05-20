import React from 'react';
import { Building2, Upload, Settings, Users } from 'lucide-react';

interface SettingsNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const SettingsNav: React.FC<SettingsNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'branches', label: 'Branch Management', icon: Building2 },
    { id: 'issuers', label: 'Issuer Management', icon: Users },
    { id: 'bulk', label: 'Bulk Registration', icon: Upload },
    { id: 'system', label: 'System Settings', icon: Settings }
  ];

  return (
    <div className="mb-6">
      <nav className="flex flex-wrap gap-2" aria-label="Settings navigation">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200 ${
              activeTab === id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default SettingsNav;