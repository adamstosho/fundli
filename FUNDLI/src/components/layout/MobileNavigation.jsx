import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, CreditCard, TrendingUp, User, Settings, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', icon: Home, path: `/dashboard/${userType}` },
    ];

    if (userType === 'borrower') {
      return [
        ...baseItems,
        { name: 'Loan Status', icon: CreditCard, path: '/loans/status' },
        { name: 'KYC Verification', icon: User, path: '/kyc-upload' },
        { name: 'Profile', icon: User, path: '/settings/profile' },
        { name: 'Settings', icon: Settings, path: '/settings' },
      ];
    } else if (userType === 'lender') {
      return [
        ...baseItems,
        { name: 'Create Pool', icon: TrendingUp, path: '/marketplace/create-pool' },
        { name: 'Browse Loans', icon: CreditCard, path: '/marketplace/browse' },
        { name: 'KYC Verification', icon: User, path: '/kyc-upload' },
        { name: 'Profile', icon: User, path: '/settings/profile' },
        { name: 'Settings', icon: Settings, path: '/settings' },
      ];
    } else if (userType === 'admin') {
      return [
        ...baseItems,
        { name: 'User Management', icon: User, path: '/admin/users' },
        { name: 'KYC Management', icon: User, path: '/admin/kyc' },
        { name: 'Loan Management', icon: CreditCard, path: '/admin/loans' },
        { name: 'Settings', icon: Settings, path: '/settings' },
      ];
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 lg:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">F</span>
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-gray-900 dark:text-white">Fundli</h1>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Mobile</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                        user?.userType === 'borrower' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : user?.userType === 'lender'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                      }`}>
                        {user?.userType?.charAt(0).toUpperCase() + user?.userType?.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 overflow-y-auto">
                  <ul className="space-y-2">
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.name}>
                          <button
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                              isActive(item.path)
                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="font-medium">{item.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button 
                    onClick={() => handleNavigation('/notifications')}
                    className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notifications</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNavigation;
