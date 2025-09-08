import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  User, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Eye,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

const AdminLoanManagement = () => {
  const [loanApplications, setLoanApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    funded: 0,
    rejected: 0
  });

  useEffect(() => {
    loadLoanApplications();
  }, [statusFilter]);

  const loadLoanApplications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/admin/loan-applications?status=${statusFilter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setLoanApplications(result.data.loanApplications || []);
        setSummary(result.data.summary || {});
      } else {
        setError('Failed to load loan applications');
      }
    } catch (error) {
      console.error('Error loading loan applications:', error);
      setError('Failed to load loan applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (application) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/admin/loan/${application.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedApplication(result.data.loan);
        setShowModal(true);
      } else {
        alert('Failed to load loan details');
      }
    } catch (error) {
      console.error('Error loading loan details:', error);
      alert('Failed to load loan details');
    }
  };

  const handleApproveReject = async (action) => {
    if (!selectedApplication) return;
    
    if (action === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/admin/loan/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
          adminNotes: adminNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowModal(false);
        setSelectedApplication(null);
        setRejectionReason('');
        setAdminNotes('');
        await loadLoanApplications(); // Refresh the list
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing loan:`, error);
      alert(`Failed to ${action} loan application`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'funded': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getKycStatusColor = (kycStatus) => {
    switch (kycStatus) {
      case 'verified': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredApplications = loanApplications.filter(app => 
    app.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Loan Applications Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve loan applications from borrowers
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {loanApplications.length} total applications
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Funded</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.funded}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by borrower name, purpose, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="funded">Funded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Loan Applications
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No applications match your search criteria.' : 'There are currently no loan applications to review.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((application, index) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Application Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {application.purpose}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Application #{application.id.slice(-8)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(application.kycStatus)}`}>
                      KYC: {application.kycStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6 space-y-4">
                {/* Borrower Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {application.borrower.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {application.borrower.email}
                    </p>
                  </div>
                </div>

                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${application.loanAmount?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {application.duration} months
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {application.purpose}
                    </span>
                  </div>
                </div>

                {/* Funding Progress */}
                {application.fundingProgress && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Funding Progress
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {application.fundingProgress.fundingPercentage}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${application.fundingProgress.fundingPercentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>${application.fundingProgress.fundedAmount?.toLocaleString() || 0}</span>
                      <span>${application.fundingProgress.targetAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="p-6 pt-0">
                <button
                  onClick={() => handleViewDetails(application)}
                  className="w-full px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>Review Application</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Application Details Modal */}
      {showModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Loan Application Review
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Borrower Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Borrower Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedApplication.borrower.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedApplication.borrower.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedApplication.borrower.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">KYC Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(selectedApplication.kycStatus)}`}>
                        {selectedApplication.kycStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Loan Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${selectedApplication.loanAmount?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedApplication.duration} months
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedApplication.interestRate}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly Payment:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${selectedApplication.monthlyPayment?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Repayment:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${selectedApplication.totalRepayment?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {selectedApplication.purpose}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Applied:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedApplication.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {selectedApplication.purposeDescription && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Description:</span> {selectedApplication.purposeDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Funding Progress */}
              {selectedApplication.fundingProgress && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Funding Progress</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Funded Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${selectedApplication.fundingProgress.fundedAmount?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Target Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${selectedApplication.fundingProgress.targetAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${((selectedApplication.fundingProgress.targetAmount || selectedApplication.loanAmount) - (selectedApplication.fundingProgress.fundedAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div 
                          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedApplication.fundingProgress.fundingPercentage}%` }}
                        ></div>
                      </div>
                      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        {selectedApplication.fundingProgress.fundingPercentage}% funded
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Collateral Information */}
              {selectedApplication.collateral && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Collateral Information</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedApplication.collateral.description || 'No description provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any administrative notes..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Rejection Reason (if rejecting)
                    </label>
                    <textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApproveReject('approve')}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>{isProcessing ? 'Processing...' : 'Approve'}</span>
                    </button>
                    
                    <button
                      onClick={() => handleApproveReject('reject')}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>{isProcessing ? 'Processing...' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoanManagement;
