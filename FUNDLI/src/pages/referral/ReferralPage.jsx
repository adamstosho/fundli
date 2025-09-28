import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Award, Users, DollarSign, TrendingUp, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReferralPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // KYC verification is now optional - all users can access the referral program

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Try to fetch real referral data from the API
        try {
          const response = await fetch('http://localhost:5000/api/referrals/stats', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const result = await response.json();
            setReferralData(result.data);
          } else {
            throw new Error('Failed to fetch referral data');
          }
        } catch (apiError) {
          console.warn('Using fallback referral data:', apiError);
          // Fallback to user data from localStorage
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          
          const referralData = {
            referralCode: userData.referralCode || 'FUNDLI2024',
            totalReferred: 0,
            completedActions: 0,
            isEligibleForRewards: false,
            referralEarnings: userData.referralEarnings || 0,
            walletBalance: userData.walletBalance || 0,
            requirements: {
              totalNeeded: 5,
              actionsNeeded: 3,
              currentTotal: 0,
              currentActions: 0
            }
          };
          
          setReferralData(referralData);
        }
      } catch (error) {
        console.error('Error loading referral data:', error);
        // Fallback to basic data
        setReferralData({
          referralCode: 'FUNDLI2024',
          totalReferred: 0,
          completedActions: 0,
          isEligibleForRewards: false,
          referralEarnings: 0,
          walletBalance: 0,
          requirements: {
            totalNeeded: 5,
            actionsNeeded: 3,
            currentTotal: 0,
            currentActions: 0
          }
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReferralData();
  }, []);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = () => {
    const shareData = {
      title: 'Join Fundli - Interpersonal Lending Platform',
      text: `Use my referral code ${referralData.referralCode} to get started on Fundli!`,
      url: `https://fundli.com/ref/${referralData.referralCode}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      copyReferralCode();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Referral Program
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Invite friends and earn rewards for every successful referral
        </p>
      </div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="card p-8 mb-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Your Referral Code
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Share this code with friends and earn 2% of their transactions after meeting requirements
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-white dark:bg-secondary-800 px-6 py-4 rounded-lg border-2 border-primary-200 dark:border-primary-700">
            <span className="text-3xl font-bold text-primary-600 dark:text-primary-400 tracking-wider">
              {referralData.referralCode}
            </span>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={copyReferralCode}
            className="btn-primary inline-flex items-center"
          >
            {copied ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copy Code
              </>
            )}
          </button>
          <button
            onClick={shareReferral}
            className="btn-outline inline-flex items-center"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Share
          </button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Referrals</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {referralData.totalReferred}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Successful</p>
              <p className="text-2xl font-bold text-success">
                {referralData.completedActions}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Earnings</p>
              <p className="text-2xl font-bold text-accent">
                ${referralData.referralEarnings}
              </p>
            </div>
            <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-accent-600 dark:text-accent-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending</p>
              <p className="text-2xl font-bold text-warning">
                ${referralData.walletBalance}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Requirements Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="card p-6 mb-8"
      >
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 text-center">
          Your Progress Towards Rewards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Referrals (Need 5)</h4>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {referralData.requirements?.currentTotal || 0} / {referralData.requirements?.totalNeeded || 5}
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((referralData.requirements?.currentTotal || 0) / (referralData.requirements?.totalNeeded || 5)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Actions (Need 3)</h4>
            <p className="text-2xl font-bold text-success-600 dark:text-success-400 mb-2">
              {referralData.requirements?.currentActions || 0} / {referralData.requirements?.actionsNeeded || 3}
            </p>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div
                className="bg-success-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(100, ((referralData.requirements?.currentActions || 0) / (referralData.requirements?.actionsNeeded || 3)) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {referralData.isEligibleForRewards && (
          <div className="mt-6 p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg text-center">
            <CheckCircle className="h-6 w-6 text-success-600 mx-auto mb-2" />
            <p className="text-success-800 dark:text-success-200 font-medium">
              🎉 Congratulations! You're eligible for rewards!
            </p>
            <p className="text-success-700 dark:text-success-300 text-sm mt-1">
              You'll earn 2% of every transaction made by your referred users.
            </p>
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-8 mb-8"
      >
        <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-6 text-center">
          How the Referral Program Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
            </div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Share Your Code</h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Share your unique referral code with friends and family
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">2</span>
            </div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">They Sign Up</h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Your friends use your code when creating their account
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">3</span>
            </div>
            <h4 className="font-semibold text-secondary-900 dark:text-white mb-2">Earn Rewards</h4>
            <p className="text-neutral-600 dark:text-neutral-400">
              Get ₦30 for each successful referral after they complete KYC
            </p>
          </div>
        </div>
      </motion.div>

      {/* Referral History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Referral History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-secondary-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Referred User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Referral history data is not available in the current API response,
                  so we'll display a placeholder or remove this section if not needed.
                  For now, we'll keep it as is, but it will show an empty table. */}
              <tr>
                <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center text-neutral-500 dark:text-neutral-400">
                  Referral history data not available in this version.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Terms and Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="card p-6 mt-8 bg-neutral-50 dark:bg-secondary-800"
      >
        <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">
          Referral Program Terms
        </h3>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
          <li>• You must refer at least 5 new users to be eligible for rewards</li>
          <li>• At least 3 of your referred users must complete platform actions (KYC, loans, investments, etc.)</li>
          <li>• Once eligible, you earn 2% of every transaction made by your referred users</li>
          <li>• Referred users must be new to the platform</li>
          <li>• Rewards are paid directly to your wallet balance</li>
          <li>• Fundli reserves the right to modify or terminate the referral program</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ReferralPage; 