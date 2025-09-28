import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Home, DollarSign, Users, FileText, BarChart3, Settings, UserCheck, Shield, TrendingUp, CreditCard, Calendar, Award, Search, Bell, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ open, onClose }) => {
  const { userType } = useAuth();
  const location = useLocation();

  const navigation = {
    borrower: [
      { name: 'Dashboard', href: '/dashboard/borrower', icon: Home },
      ...(userType !== 'admin' ? [{ name: 'KYC Verification', href: '/kyc-upload', icon: Shield }] : []),
      { name: 'Loan Status', href: '/loans/status', icon: FileText },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Profile', href: '/settings/profile', icon: UserCheck },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
    lender: [
      { name: 'Dashboard', href: '/dashboard/lender', icon: Home },
      ...(userType !== 'admin' ? [{ name: 'KYC Verification', href: '/kyc-upload', icon: Shield }] : []),
      { name: 'Create Pool', href: '/marketplace/create-pool', icon: DollarSign },
      { name: 'Browse Loans', href: '/marketplace/browse', icon: CreditCard },
      { name: 'My Investments', href: '/lender/investments', icon: TrendingUp },
      { name: 'Analytics', href: '/dashboard/lender', icon: BarChart3 },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Profile', href: '/settings/profile', icon: UserCheck },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
    admin: [
      { name: 'Dashboard', href: '/dashboard/admin', icon: Home },
      { name: 'User Management', href: '/admin/users', icon: Users },
      { name: 'KYC Management', href: '/admin/kyc', icon: Shield },
      { name: 'Loan Management', href: '/admin/loans', icon: FileText },
      { name: 'Analytics', href: '/dashboard/admin', icon: BarChart3 },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  };

  const currentNav = navigation[userType] || navigation.borrower;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-secondary-900">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 dark:border-secondary-700">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">F</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-secondary-900 dark:text-white">Fundli</span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Peer-to-Peer Lending</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-secondary-800 transition-all duration-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">
              {userType === 'borrower' ? 'Borrower' : userType === 'lender' ? 'Lender' : 'Admin'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              {userType === 'borrower' ? 'Access your loans' : userType === 'lender' ? 'Manage investments' : 'Platform management'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {currentNav.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={clsx(
                'flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-secondary-800 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              <item.icon className={clsx(
                'h-5 w-5 mr-3 transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
              )} />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <div className="w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>
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
            <div className="fixed inset-0 bg-secondary-900/75" />
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
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white dark:bg-secondary-900">
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-secondary-900 border-r border-neutral-200 dark:border-secondary-700 shadow-lg">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar; 