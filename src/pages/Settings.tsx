import React, { useState } from 'react';
import SettingsNav from '../components/settings/SettingsNav';
import BranchManagement from '../components/settings/BranchManagement';
import IssuerManagement from '../components/settings/IssuerManagement';
import BulkRegistration from '../components/settings/BulkRegistration';
import SystemSettings from '../components/settings/SystemSettings';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('branches');

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage system settings and bulk operations</p>
      </div>

      <SettingsNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="transition-all duration-200 transform">
        {activeTab === 'branches' && <BranchManagement />}
        {activeTab === 'issuers' && <IssuerManagement />}
        {activeTab === 'bulk' && <BulkRegistration />}
        {activeTab === 'system' && <SystemSettings />}
      </div>
    </div>
  );
};

export default Settings;