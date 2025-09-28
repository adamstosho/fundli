import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';

const MobileDashboardCard = ({ title, value, change, icon: Icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-success/10 text-success',
    red: 'bg-error/10 text-error',
    blue: 'bg-info/10 text-info',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <div className={`flex items-center space-x-1 text-sm ${
            change > 0 ? 'text-success' : 'text-error'
          }`}>
            {change > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{title}</p>
        <p className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{value}</p>
      </div>
    </motion.div>
  );
};

const MobileDashboardGrid = ({ data }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <MobileDashboardCard
        title="Total Balance"
        value={`₦${data?.totalBalance?.toLocaleString() || '0'}`}
        change={data?.balanceChange}
        icon={DollarSign}
        color="green"
      />
      <MobileDashboardCard
        title="Active Loans"
        value={data?.activeLoans || '0'}
        change={data?.loansChange}
        icon={CreditCard}
        color="blue"
      />
      <MobileDashboardCard
        title="Credit Score"
        value={data?.creditScore || '650'}
        change={data?.scoreChange}
        icon={TrendingUp}
        color="primary"
      />
      <MobileDashboardCard
        title="Monthly Income"
        value={`₦${data?.monthlyIncome?.toLocaleString() || '0'}`}
        change={data?.incomeChange}
        icon={TrendingUp}
        color="green"
      />
    </div>
  );
};

const MobileQuickActions = ({ onAction }) => {
  const actions = [
    { name: 'Apply for Loan', icon: CreditCard, color: 'primary' },
    { name: 'Make Payment', icon: DollarSign, color: 'green' },
    { name: 'View Marketplace', icon: TrendingUp, color: 'blue' },
    { name: 'Check Score', icon: TrendingUp, color: 'purple' },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onAction(action.name)}
            className={`p-4 rounded-xl border border-neutral-200 dark:border-secondary-700 hover:shadow-md transition-all ${
              action.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30' :
              action.color === 'green' ? 'bg-success/10 hover:bg-success/20' :
              action.color === 'blue' ? 'bg-info/10 hover:bg-info/20' :
              'bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/30'
            }`}
          >
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                action.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' :
                action.color === 'green' ? 'bg-success/20 text-success' :
                action.color === 'blue' ? 'bg-info/20 text-info' :
                'bg-accent-100 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400'
              }`}>
                <action.icon className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{action.name}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const MobileRecentActivity = ({ activities }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-secondary-900 dark:text-secondary-100 mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities?.map((activity, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-secondary-800 rounded-lg"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity.type === 'loan' ? 'bg-info/20 text-info' :
              activity.type === 'payment' ? 'bg-success/20 text-success' :
              'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
            }`}>
              {activity.type === 'loan' ? <CreditCard className="h-4 w-4" /> :
               activity.type === 'payment' ? <DollarSign className="h-4 w-4" /> :
               <TrendingUp className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-secondary-900 dark:text-secondary-100">{activity.title}</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">{activity.date}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                activity.amount > 0 ? 'text-success' : 'text-error'
              }`}>
                {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toLocaleString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MobileDashboardLayout = ({ 
  title, 
  data, 
  activities, 
  onAction,
  children 
}) => {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-secondary-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-secondary-800 border-b border-neutral-200 dark:border-secondary-700 px-4 py-4">
        <h1 className="text-xl font-bold text-secondary-900 dark:text-secondary-100">{title}</h1>
      </div>

      {/* Mobile Content */}
      <div className="p-4">
        {/* Dashboard Cards */}
        <MobileDashboardGrid data={data} />
        
        {/* Quick Actions */}
        <MobileQuickActions onAction={onAction} />
        
        {/* Recent Activity */}
        <MobileRecentActivity activities={activities} />
        
        {/* Additional Content */}
        {children}
      </div>
    </div>
  );
};

export {
  MobileDashboardCard,
  MobileDashboardGrid,
  MobileQuickActions,
  MobileRecentActivity,
  MobileDashboardLayout
};
