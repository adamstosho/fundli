import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Calendar, FileText, Eye, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoanStatus = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // KYC verification is now optional - all users can view loan status

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Fetch user's loans from the backend
        const response = await fetch('http://localhost:5000/api/loans/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setLoans(result.data.loans || []);
        } else {
          console.error('Failed to load loans:', response.statusText);
          setLoans([]);
        }
      } catch (error) {
        console.error('Error loading loans:', error);
        setLoans([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'approved':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'funded':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-error" />;
      case 'active':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <AlertCircle className="h-5 w-5 text-info" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'approved':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'funded':
        return 'bg-success/10 text-success border-success/20';
      case 'rejected':
        return 'bg-error/10 text-error border-error/20';
      case 'active':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-info/10 text-info border-info/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'approved':
        return 'Approved - Awaiting Funding';
      case 'funded':
        return 'Funded & Disbursed';
      case 'rejected':
        return 'Rejected';
      case 'active':
        return 'Active';
      default:
        return 'Unknown';
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
          Loan Status
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Track the status of your loan applications
        </p>
      </div>

      {loans.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 text-center"
        >
          <FileText className="mx-auto h-16 w-16 text-neutral-400 mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
            No Loan Applications
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            You haven't submitted any loan applications yet.
          </p>
          <a
            href="/loans/apply"
            className="btn-primary inline-flex items-center"
          >
            Apply for a Loan
          </a>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {loans.map((loan, index) => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(loan.status)}
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                      ${loan.loanAmount.toLocaleString()} - {loan.purpose}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      Applied on {new Date(loan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(loan.status)}`}>
                  {getStatusText(loan.status)}
                </span>
              </div>

              <p className="text-neutral-700 dark:text-neutral-300 mb-4">
                {loan.purposeDescription}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <DollarSign className="h-4 w-4" />
                  <span>Amount: ${loan.loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
                  <Calendar className="h-4 w-4" />
                  <span>Applied: {new Date(loan.createdAt).toLocaleDateString()}</span>
                </div>
                {loan.status === 'pending' && (
                  <div className="flex items-center space-x-2 text-sm text-warning">
                    <Clock className="h-4 w-4" />
                    <span>Expected: {new Date(loan.expectedResponse).toLocaleDateString()}</span>
                  </div>
                )}
                {loan.status === 'approved' && loan.approvedDate && (
                  <div className="flex items-center space-x-2 text-sm text-success">
                    <CheckCircle className="h-4 w-4" />
                    <span>Approved: {new Date(loan.approvedDate).toLocaleDateString()}</span>
                  </div>
                )}
                {loan.status === 'rejected' && loan.rejectedDate && (
                  <div className="flex items-center space-x-2 text-sm text-error">
                    <XCircle className="h-4 w-4" />
                    <span>Rejected: {new Date(loan.rejectedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {loan.status === 'rejected' && loan.reason && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <XCircle className="h-5 w-5 text-error mt-0.5" />
                    <div>
                      <h4 className="font-medium text-error mb-1">Rejection Reason</h4>
                      <p className="text-sm text-error/80">{loan.reason}</p>
                    </div>
                  </div>
                </div>
              )}

              {loan.status === 'approved' && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning mb-1">Loan Approved - Awaiting Funding</h4>
                      <p className="text-sm text-warning/80">
                        Your loan has been approved by admin but is waiting for lenders to fund it. You will be notified once the loan is fully funded and disbursed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(loan.status === 'funded' || loan.status === 'active') && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <h4 className="font-medium text-success mb-1">Congratulations!</h4>
                      <p className="text-sm text-success/80">
                        Your loan has been funded and disbursed. Check your account for the funds.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-secondary-700">
                <div className="flex space-x-3">
                  <button className="btn-outline text-sm py-2 px-4">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                  {loan.status === 'pending' && (
                    <button className="btn-outline text-sm py-2 px-4 text-warning border-warning hover:bg-warning hover:text-white">
                      <Clock className="h-4 w-4 mr-2" />
                      Check Status
                    </button>
                  )}
                </div>
                
                {loan.status === 'pending' && (
                  <div className="text-sm text-neutral-500">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Review in progress
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6 mt-8 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
              Need Another Loan?
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Apply for additional funding or check your eligibility
            </p>
          </div>
          <a href="/loans/apply" className="btn-primary">
            Apply Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoanStatus; 