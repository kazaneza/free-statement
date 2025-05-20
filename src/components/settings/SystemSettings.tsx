import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface SystemSettingsForm {
  statementValidityDays: number;
  maxFileSize: number;
  allowedFileTypes: string[];
  emailNotifications: boolean;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettingsForm>({
    statementValidityDays: 30,
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'png'],
    emailNotifications: true
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFileTypeToggle = (type: string) => {
    setSettings(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(type)
        ? prev.allowedFileTypes.filter(t => t !== type)
        : [...prev.allowedFileTypes, type]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
        <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-6">
          <div className="form-group">
            <label className="form-label">Statement Validity Period (days)</label>
            <input
              type="number"
              className="form-input"
              value={settings.statementValidityDays}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                statementValidityDays: parseInt(e.target.value)
              }))}
              min="1"
              max="365"
            />
            <p className="mt-1 text-sm text-gray-500">
              Number of days before a statement needs to be renewed
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Maximum File Size (MB)</label>
            <input
              type="number"
              className="form-input"
              value={settings.maxFileSize}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                maxFileSize: parseInt(e.target.value)
              }))}
              min="1"
              max="50"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum allowed file size for statement uploads
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Allowed File Types</label>
            <div className="mt-2 space-x-2">
              {['pdf', 'jpg', 'png', 'gif'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFileTypeToggle(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    settings.allowedFileTypes.includes(type)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  .{type}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  emailNotifications: e.target.checked
                }))}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable Email Notifications
              </label>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Send email notifications for new registrations and statement uploads
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button type="submit" className="btn-primary flex items-center">
            <Save size={18} className="mr-2" />
            Save Settings
          </button>

          {saved && (
            <div className="flex items-center text-success">
              <AlertCircle size={18} className="mr-2" />
              <span>Settings saved successfully</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default SystemSettings;