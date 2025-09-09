import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  Users, 
  Star, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  Calendar,
  CreditCard,
  Eye,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MatchingDashboard = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
    if (user?.userType === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      setIsLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/matching/my-matches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMatches(data.data.matches);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch matches');
      }
    } catch (error) {
      setError('Failed to fetch matches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/matching/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Matching Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {user?.userType === 'borrower' 
              ? 'Find lenders for your loan applications'
              : user?.userType === 'lender'
              ? 'Discover loan opportunities that match your criteria'
              : 'Monitor platform matching performance'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            AI-Powered Matching
          </span>
        </div>
      </div>

      {/* Admin Stats */}
      {user?.userType === 'admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Loans</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLoans}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Lenders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLenders}</p>
              </div>
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Borrowers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBorrowers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Credit Score</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.averageCreditScore)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 ? (
        <div className="space-y-4">
          {user?.userType === 'borrower' ? (
            // Borrower view - show matches for their loans
            matches.map((loanMatch, index) => (
              <motion.div
                key={loanMatch.loanId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Loan Application Matches
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ₦{loanMatch.loanAmount?.toLocaleString()} • {loanMatch.loanPurpose}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-500">
                    {loanMatch.matches.length} matches found
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loanMatch.matches.map((match, matchIndex) => (
                    <div
                      key={match.lenderId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {match.lender.firstName} {match.lender.lastName}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Lender
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBgColor(match.compatibilityScore)} ${getScoreColor(match.compatibilityScore)}`}>
                          {match.compatibilityScore}%
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Max Amount:</span>
                          <span className="font-medium">₦{match.lender.maxLoanAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                          <span className="font-medium">{match.recommendedInterestRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                          <span className="font-medium">{match.riskScore}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Match Reasons:</p>
                        <div className="flex flex-wrap gap-1">
                          {match.matchReasons.slice(0, 3).map((reason, reasonIndex) => (
                            <span
                              key={reasonIndex}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-xs rounded"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <button className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors">
                          Contact Lender
                        </button>
                        <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          ) : (
            // Lender view - show loan opportunities
            matches.map((match, index) => (
              <motion.div
                key={match.loanId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        ₦{match.loan.amount?.toLocaleString()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {match.loan.purpose} • {match.loan.duration} months
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(match.compatibilityScore)} ${getScoreColor(match.compatibilityScore)}`}>
                    {match.compatibilityScore}% Match
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Borrower Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Borrower Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Name:</span>
                        <span className="font-medium">{match.borrower.firstName} {match.borrower.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Credit Score:</span>
                        <span className="font-medium">{match.borrower.creditScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Income:</span>
                        <span className="font-medium">₦{match.borrower.monthlyIncome?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Employment:</span>
                        <span className="font-medium">{match.borrower.employmentStatus}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">KYC Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          match.borrower.kycStatus === 'verified' 
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {match.borrower.kycStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Loan Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span className="font-medium">₦{match.loan.amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium">{match.loan.duration} months</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Proposed Rate:</span>
                        <span className="font-medium">{match.loan.proposedInterestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Recommended Rate:</span>
                        <span className="font-medium text-primary-600 dark:text-primary-400">{match.recommendedInterestRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                        <span className="font-medium">{match.riskScore}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Why This Match?</h4>
                  <div className="flex flex-wrap gap-2">
                    {match.matchReasons.map((reason, reasonIndex) => (
                      <span
                        key={reasonIndex}
                        className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 text-sm rounded-full"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                    Invest Now
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                  <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No matches found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.userType === 'borrower' 
              ? 'Complete your loan application to find matching lenders'
              : 'No loan opportunities match your criteria at the moment'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchingDashboard;
