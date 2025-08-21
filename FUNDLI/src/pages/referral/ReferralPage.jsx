import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Award, Users, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';

const ReferralPage = () => {
  const [referralData, setReferralData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadReferralData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        // For now, we'll use the user data from localStorage since referral API might not be implemented yet
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        
        const referralData = {
          referralCode: userData.referralCode || 'FUNDLI2024',
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: userData.referralEarnings || 0,
          pendingEarnings: 0,
          referralHistory: []
        };
        
        setReferralData(referralData);
      } catch (error) {
        console.error('Error loading referral data:', error);
        // Fallback to basic data
        setReferralData({
          referralCode: 'FUNDLI2024',
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: 0,
          pendingEarnings: 0,
          referralHistory: []
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Referral Program
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your Referral Code
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Share this code with friends and earn $30 for each successful referral
          </p>
        </div>

        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg border-2 border-primary-200 dark:border-primary-700">
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Referrals</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {referralData.totalReferrals}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Successful</p>
              <p className="text-2xl font-bold text-success">
                {referralData.successfulReferrals}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-accent">
                ${referralData.totalEarnings}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-warning">
                ${referralData.pendingEarnings}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-8 mb-8"
      >
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
          How the Referral Program Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Share Your Code</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Share your unique referral code with friends and family
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">2</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">They Sign Up</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Your friends use your code when creating their account
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">3</span>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Earn Rewards</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Get $30 for each successful referral after they complete KYC
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
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Referral History
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Referred User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Earnings
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {referralData.referralHistory.map((referral, index) => (
                <motion.tr
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {referral.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {referral.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(referral.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      referral.status === 'completed' 
                        ? 'badge-success' 
                        : 'badge-warning'
                    }`}>
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${referral.earnings}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Terms and Conditions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="card p-6 mt-8 bg-gray-50 dark:bg-gray-800"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Referral Program Terms
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <li>• Referral rewards are paid after the referred user completes KYC verification</li>
          <li>• Each successful referral earns $30 in platform credits</li>
          <li>• Referred users must be new to the platform</li>
          <li>• Rewards are subject to platform terms and conditions</li>
          <li>• Fundli reserves the right to modify or terminate the referral program</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ReferralPage; 