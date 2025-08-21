import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Home, DollarSign, Users, FileText, BarChart3, Settings, UserCheck, Shield, TrendingUp, CreditCard, Calendar, Award } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ open, onClose }) => {
  const { userType } = useAuth();
  const location = useLocation();

  const navigation = {
    borrower: [
      { name: 'Dashboard', href: '/dashboard/borrower', icon: Home },
      { name: 'Apply for Loan', href: '/loans/apply', icon: DollarSign },
      { name: 'Loan Status', href: '/loans/status', icon: FileText },
      { name: 'Repayment Schedule', href: '/loans/repayment', icon: Calendar },
      { name: 'Profile', href: '/settings/profile', icon: UserCheck },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
    lender: [
      { name: 'Dashboard', href: '/dashboard/lender', icon: Home },
      { name: 'Create Pool', href: '/marketplace/create-pool', icon: DollarSign },
      { name: 'Browse Loans', href: '/marketplace/browse', icon: CreditCard },
      { name: 'My Investments', href: '/dashboard/lender', icon: TrendingUp },
      { name: 'Analytics', href: '/dashboard/lender', icon: BarChart3 },
      { name: 'Profile', href: '/settings/profile', icon: UserCheck },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
    admin: [
      { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
      { name: 'User Management', href: '/admin/users', icon: Users },
      { name: 'KYC Management', href: '/admin/kyc', icon: Shield },
      { name: 'Loan Management', href: '/admin/loans', icon: FileText },
      { name: 'Analytics', href: '/dashboard/admin', icon: BarChart3 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  };

  const currentNav = navigation[userType] || navigation.borrower;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">F</span>
          </div>
          <span className="text-lg font-bold text-gradient">Fundli</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {currentNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Referral Program</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Invite friends and earn rewards
          </p>
          <Link
            to="/referral"
            onClick={onClose}
            className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            Learn More →
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-gray-800">
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar; 