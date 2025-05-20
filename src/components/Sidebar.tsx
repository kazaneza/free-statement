import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UserPlus, FileBarChart, Settings, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  
  const linkClass = "flex items-center px-4 py-3 text-gray-600 hover:bg-primary/5 hover:text-primary rounded-lg transition-all duration-200";
  const activeLinkClass = "bg-primary/10 text-primary font-medium shadow-sm";
  
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed md:sticky top-0 bottom-0 left-0 w-72 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out md:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">BK</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bank of Kigali</h1>
                <p className="text-xs text-gray-500">Statement Registration</p>
              </div>
            </div>
            <button 
              className="md:hidden text-gray-500 hover:text-gray-700 transition-colors"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* User info */}
          <div className="px-6 py-4 border-y border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light/20 to-primary/20 flex items-center justify-center">
                <span className="text-primary font-medium text-lg">
                  {user?.fullName.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.branch || 'Head Office'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main Menu
              </h2>
            </div>
            
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `${linkClass} ${isActive ? activeLinkClass : ''}`
              }
              end
            >
              <LayoutDashboard size={20} className="mr-3" />
              <span>Dashboard</span>
            </NavLink>
            
            <NavLink 
              to="/register" 
              className={({ isActive }) => 
                `${linkClass} ${isActive ? activeLinkClass : ''}`
              }
            >
              <UserPlus size={20} className="mr-3" />
              <span>Register New</span>
            </NavLink>
            
            <NavLink 
              to="/reports" 
              className={({ isActive }) => 
                `${linkClass} ${isActive ? activeLinkClass : ''}`
              }
            >
              <FileBarChart size={20} className="mr-3" />
              <span>Reports</span>
            </NavLink>
            
            <div className="px-3 my-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Administration
              </h2>
            </div>
            
            <NavLink 
              to="/settings" 
              className={({ isActive }) => 
                `${linkClass} ${isActive ? activeLinkClass : ''}`
              }
            >
              <Settings size={20} className="mr-3" />
              <span>Settings</span>
            </NavLink>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  <p>Version</p>
                  <p className="font-medium text-gray-900">1.0.0</p>
                </div>
                <div className="text-xs text-right text-gray-500">
                  <p>Last Update</p>
                  <p className="font-medium text-gray-900">Mar 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;