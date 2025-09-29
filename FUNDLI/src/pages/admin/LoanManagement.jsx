import { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock, DollarSign, User, AlertCircle } from 'lucide-react';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loansPerPage, setLoansPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10,
  });
  const [isProcessing, setIsProcessing] = useState(null);
  const [success, setSuccess] = useState('');

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(buildApiUrl(`/admin/loans?page=${currentPage}&limit=${loansPerPage}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          setLoans(result.data.loans);
          setPagination(result.data.pagination);
        } else {
          throw new Error('Failed to fetch loans');
        }
      } catch (error) {
        console.error('Error loading loans:', error);
        setError('Failed to load loans');
      } finally {
        setIsLoading(false);
      }
    };

    loadLoans();
  }, [currentPage, loansPerPage]);

  const filteredLoans = loans.filter(loan => {
    // Handle borrower as an object with firstName, lastName, email
    const borrowerName = loan.borrower ? 
      `${loan.borrower.firstName || ''} ${loan.borrower.lastName || ''}`.toLowerCase() : '';
    const borrowerEmail = loan.borrower?.email?.toLowerCase() || '';
    
    const matchesSearch = borrowerName.includes(searchTerm.toLowerCase()) ||
                         borrowerEmail.includes(searchTerm.toLowerCase()) ||
                         loan.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purposeDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  const getRiskScoreColor = (riskScore) => {
    switch (riskScore) {
      case 'low':
        return 'badge-success';
      case 'medium':
        return 'badge-warning';
      case 'high':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  const handleLoanApproval = async (loanId, action, reason = '') => {
    try {
      setIsProcessing(loanId);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const endpoint = action === 'approve' 
        ? buildApiUrl(`/admin/loans/${loanId}/approve`)
        : buildApiUrl(`/admin/loans/${loanId}/reject`);

      const body = action === 'approve' 
        ? JSON.stringify({ notes: reason || 'Approved by Admin' })
        : JSON.stringify({ reason: reason || 'Rejected by Admin' });

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(`Loan ${action}d successfully`);
        // Update the loan status in the local state
        setLoans(prev => prev.map(loan => 
          loan._id === loanId 
            ? { ...loan, status: action === 'approve' ? 'approved' : 'rejected' }
            : loan
        ));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(result.message || `Failed to ${action} loan`);
      }
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      setError(`Failed to ${action} loan: ${error.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsProcessing(null);
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Loan Management
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Review and manage loan applications from borrowers
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg flex items-center"
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Loans</p>
              <p className="text-2xl font-bold text-secondary-900 dark:text-white">
                {pagination.totalItems || loans.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Pending Review</p>
              <p className="text-2xl font-bold text-warning">
                {loans.filter(l => l.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning-600 dark:text-warning-400" />
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Amount</p>
              <p className="text-2xl font-bold text-success">
                ${loans.reduce((sum, loan) => sum + (loan.loanAmount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-success-600 dark:text-success-400" />
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
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Approved</p>
              <p className="text-2xl font-bold text-success">
                {loans.filter(l => l.status === 'approved').length}
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
          transition={{ duration: 0.6, delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Rejected</p>
              <p className="text-2xl font-bold text-error">
                {loans.filter(l => l.status === 'rejected').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-lg flex items-center justify-center">
              <XCircle className="h-6 w-6 text-error-600 dark:text-error-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="card p-6 mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search loans by borrower, email, or purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field w-32 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loans Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Loan Applications
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-secondary-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Interest Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loans.length > 0 ? (
                loans.map((loan) => (
                  <motion.tr
                    key={loan._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-neutral-50 dark:hover:bg-secondary-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-white">
                          ${loan.loanAmount?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {loan.purpose}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-secondary-900 dark:text-white">
                          {loan.borrower?.firstName} {loan.borrower?.lastName}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {loan.borrower?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {loan.duration} months
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {loan.interestRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        loan.status === 'approved' 
                          ? 'badge-success' 
                          : loan.status === 'rejected'
                          ? 'badge-error'
                          : loan.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400">
                      {formatDate(loan.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleLoanApproval(loan._id, 'approve')}
                          className="text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300"
                          disabled={isProcessing === loan._id}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleLoanApproval(loan._id, 'reject')}
                          className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300"
                          disabled={isProcessing === loan._id}
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-neutral-500 dark:text-neutral-400">
                    {isLoading ? 'Loading...' : 'No loans found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="card p-6 mt-6"
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700 dark:text-neutral-300">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-neutral-500 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-neutral-500 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LoanManagement; 