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
  MessageSquare,
  Send,
  Trash2,
  Bell,
  CreditCard,
  BarChart3,
  Target,
  Shield,
  ArrowRight,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import PaymentModal from './PaymentModal';

const LenderLoanManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingLoans, setPendingLoans] = useState([]);
  const [fundedLoans, setFundedLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNotes, setInvestmentNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadLoanData();
  }, []);

  const loadLoanData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      // Load pending loans
      const pendingResponse = await fetch('http://localhost:5000/api/lender/loan-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        setPendingLoans(pendingData.data.loanApplications || []);
      }

      // Load funded loans
      const fundedResponse = await fetch('http://localhost:5000/api/lender/funded-loans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (fundedResponse.ok) {
        const fundedData = await fundedResponse.json();
        setFundedLoans(fundedData.data.fundedLoans || []);
      }

    } catch (error) {
      console.error('Error loading loan data:', error);
      setError('Failed to load loan data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (loan) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/lender/loan/${loan.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedLoan(data.data.loan);
        setShowModal(true);
      } else {
        alert('Failed to load loan details');
      }
    } catch (error) {
      console.error('Error loading loan details:', error);
      alert('Failed to load loan details');
    }
  };

  const handleAcceptLoan = async () => {
    if (!selectedLoan) return;

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/loan/${selectedLoan.id}/invest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          investmentAmount: parseFloat(investmentAmount),
          notes: investmentNotes
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        console.log('✅ Investment successful:', result);
        
        alert(`Successfully invested in loan! ₦${investmentAmount} has been transferred to ${selectedLoan.borrower.name}.`);
        
        setShowAcceptModal(false);
        setSelectedLoan(null);
        setInvestmentAmount('');
        setInvestmentNotes('');
        
        // Refresh loan data
        await loadLoanData();
        
        // Refresh dashboard data globally
        if (window.refreshLenderDashboard) {
          console.log('🔄 Refreshing lender dashboard after loan investment');
          window.refreshLenderDashboard();
        }
        
        // Dispatch wallet balance update event with new balance from response
        if (result.data?.lenderWallet?.balance !== undefined) {
          const newBalance = result.data.lenderWallet.balance;
          window.dispatchEvent(new CustomEvent('walletBalanceUpdated', {
            detail: { 
              userId: localStorage.getItem('userId') || 'unknown',
              userType: 'lender',
              newBalance: newBalance,
              transactionType: 'loan_investment'
            }
          }));
          
          // Update local storage wallet
          const localWallets = JSON.parse(localStorage.getItem('localWallets') || '{}');
          localWallets.lender = {
            ...localWallets.lender,
            balance: newBalance,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('localWallets', JSON.stringify(localWallets));
          
          console.log('Updated lender wallet balance from response:', newBalance);
        }
        
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('dashboardRefreshed'));
        
      } else {
        const errorData = await response.json();
        console.error('Investment failed:', errorData);
        alert(`Failed to invest in loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error investing in loan:', error);
      alert('Failed to invest in loan application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectLoan = async () => {
    if (!selectedLoan || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`http://localhost:5000/api/lender/loan/${selectedLoan.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason.trim()
        })
      });

      if (response.ok) {
        alert('Loan application rejected successfully');
        setShowModal(false);
        setShowRejectModal(false);
        setSelectedLoan(null);
        setRejectionReason('');
        
        await loadLoanData();
      } else {
        const errorData = await response.json();
        alert(`Failed to reject loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error rejecting loan:', error);
      alert('Failed to reject loan application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = (paymentData) => {
    loadLoanData();
    
    // Refresh dashboard data globally
    if (window.refreshLenderDashboard) {
      console.log('🔄 Refreshing lender dashboard after payment success');
      window.refreshLenderDashboard();
    }
    
    // Dispatch wallet balance update event
    window.dispatchEvent(new CustomEvent('walletBalanceUpdated', {
      detail: { 
        userId: localStorage.getItem('userId') || 'unknown',
        userType: 'lender',
        amount: paymentData.amount,
        transactionType: 'loan_payment'
      }
    }));
    
    alert(`Payment successful! ${paymentData.amount} has been transferred to the borrower.`);
  };

  const handleActionClick = (loan, action) => {
    setSelectedLoan(loan);
    if (action === 'accept') {
      setShowAcceptModal(true);
    } else if (action === 'reject') {
      setShowRejectModal(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/50';
      case 'approved': return 'text-primary-600 bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400';
      case 'funded': return 'text-success bg-success/20 dark:bg-success/20 dark:text-success/50';
      case 'active': return 'text-success bg-success/20 dark:bg-success/20 dark:text-success/50';
      case 'completed': return 'text-neutral-600 bg-neutral-100 dark:bg-secondary-900/20 dark:text-neutral-400';
      case 'rejected': return 'text-error bg-error/20 dark:bg-error/20 dark:text-error/50';
      case 'defaulted': return 'text-error bg-error/20 dark:bg-error/20 dark:text-error/50';
      default: return 'text-neutral-600 bg-neutral-100 dark:bg-secondary-900/20 dark:text-neutral-400';
    }
  };

  const getKycStatusColor = (kycStatus) => {
    switch (kycStatus) {
      case 'verified': return 'text-success bg-success/20 dark:bg-success/20 dark:text-success/50';
      case 'pending': return 'text-warning bg-warning/20 dark:bg-warning/20 dark:text-warning/50';
      case 'rejected': return 'text-error bg-error/20 dark:bg-error/20 dark:text-error/50';
      default: return 'text-neutral-600 bg-neutral-100 dark:bg-secondary-900/20 dark:text-neutral-400';
    }
  };

  const filteredPendingLoans = pendingLoans.filter(loan => {
    const matchesSearch = loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFundedLoans = fundedLoans.filter(loan => {
    const matchesSearch = loan.borrower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || loan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
        <p className="text-error dark:text-error/50">{error}</p>
        <button
          onClick={loadLoanData}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4 inline mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
            Loan Management
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Review pending loan applications and track your funded loans
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={loadLoanData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200 dark:border-secondary-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            Pending Loans ({pendingLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('funded')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'funded'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
            }`}
          >
            Funded Loans ({fundedLoans.length})
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by borrower name or loan purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-neutral-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="funded">Funded</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {filteredPendingLoans.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No Pending Loan Applications
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                All loan applications have been reviewed by lenders. New applications will appear here when borrowers submit them.
              </p>
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center space-x-2 mb-2">
                  <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-primary-800 dark:text-primary-200">Stay Updated</span>
                </div>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  You'll be notified when new loan applications are submitted by borrowers.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPendingLoans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Loan Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-secondary-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                          {loan.purpose}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Application #{loan.id.slice(-8)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(loan.kycStatus)}`}>
                          KYC: {loan.kycStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="p-6 space-y-4">
                    {/* Borrower Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {loan.borrower.name}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {loan.borrower.email}
                        </p>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-success dark:text-success/50" />
                        <span className="text-neutral-600 dark:text-neutral-400">Amount:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {loan.currency || 'USD'} {loan.loanAmount?.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {loan.duration} months
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Applied:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {new Date(loan.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                        <span className="font-medium text-secondary-900 dark:text-white capitalize">
                          {loan.purpose}
                        </span>
                      </div>
                    </div>

                    {/* Collateral Info */}
                    {loan.collateral && (
                      <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-3">
                        <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">
                          Collateral
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {loan.collateral.description || 'No description provided'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 pt-0 space-y-3">
                    <button
                      onClick={() => handleViewDetails(loan)}
                      className="w-full px-4 py-2 border border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {loan.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleActionClick(loan, 'accept')}
                          className="px-4 py-2 bg-success hover:bg-success text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Accept</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleActionClick(loan, 'reject')}
                          className="px-4 py-2 bg-error hover:bg-error text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'funded' && (
        <div className="space-y-6">
          {filteredFundedLoans.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 dark:text-white mb-2">
                No Funded Loans
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400">
                You haven't funded any loans yet. Start by reviewing pending applications.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredFundedLoans.map((loan, index) => (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Loan Header */}
                  <div className="p-6 border-b border-neutral-200 dark:border-secondary-700">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                          {loan.purpose}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Loan #{loan.id.slice(-8)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                          {loan.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loan Details */}
                  <div className="p-6 space-y-4">
                    {/* Borrower Info */}
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-secondary-900 dark:text-white">
                          {loan.borrower.name}
                        </p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {loan.borrower.email}
                        </p>
                      </div>
                    </div>

                    {/* Loan Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-success dark:text-success/50" />
                        <span className="text-neutral-600 dark:text-neutral-400">Funded:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {loan.currency || 'USD'} {loan.fundedAmount?.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {loan.duration} months
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Funded:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {new Date(loan.fundedAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                        <span className="text-neutral-600 dark:text-neutral-400">Interest:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {loan.interestRate}%
                        </span>
                      </div>
                    </div>

                    {/* Repayment Progress */}
                    <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-3">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600 dark:text-neutral-400">Repayment Progress</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          ${loan.amountPaid?.toLocaleString()} / ${loan.totalRepayment?.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.round(((loan.amountPaid || 0) / (loan.totalRepayment || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-1">
                        {Math.round(((loan.amountPaid || 0) / (loan.totalRepayment || 1)) * 100)}% repaid
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => handleViewDetails(loan)}
                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loan Details Modal */}
      {showModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Loan Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Borrower Information */}
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Borrower Information</h4>
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Name:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.borrower.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Email:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.borrower.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">KYC Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(selectedLoan.borrower.kycStatus)}`}>
                      {selectedLoan.borrower.kycStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loan Information */}
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Loan Information</h4>
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Amount:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      ${selectedLoan.loanAmount?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Duration:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.duration} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Interest Rate:</span>
                    <span className="font-medium text-secondary-900 dark:text-white">
                      {selectedLoan.interestRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Purpose:</span>
                    <span className="font-medium text-secondary-900 dark:text-white capitalize">
                      {selectedLoan.purpose}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLoan.status)}`}>
                      {selectedLoan.status}
                    </span>
                  </div>
                  {selectedLoan.purposeDescription && (
                    <div className="mt-3">
                      <span className="text-neutral-600 dark:text-neutral-400">Description:</span>
                      <p className="text-secondary-900 dark:text-white mt-1">
                        {selectedLoan.purposeDescription}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Repayment Information (for funded loans) */}
              {selectedLoan.status === 'funded' || selectedLoan.status === 'active' || selectedLoan.status === 'completed' ? (
                <div>
                  <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Repayment Information</h4>
                  <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Monthly Payment:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">
                        ${selectedLoan.monthlyPayment?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Total Repayment:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">
                        ${selectedLoan.totalRepayment?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Amount Paid:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">
                        ${selectedLoan.amountPaid?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600 dark:text-neutral-400">Amount Remaining:</span>
                      <span className="font-medium text-secondary-900 dark:text-white">
                        ${selectedLoan.amountRemaining?.toLocaleString()}
                      </span>
                    </div>
                    {selectedLoan.nextPaymentDate && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600 dark:text-neutral-400">Next Payment:</span>
                        <span className="font-medium text-secondary-900 dark:text-white">
                          {new Date(selectedLoan.nextPaymentDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {/* Collateral Information */}
              <div>
                <h4 className="font-medium text-secondary-900 dark:text-white mb-3">Collateral Information</h4>
                <div className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4 space-y-3">
                  {selectedLoan.collateral ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">Type:</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                          {selectedLoan.collateral.type?.replace('_', ' ') || 'Not specified'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">Description:</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {selectedLoan.collateral.description || 'No description provided'}
                        </p>
                      </div>
                      
                      {selectedLoan.collateral.estimatedValue && (
                        <div>
                          <p className="text-sm font-medium text-secondary-900 dark:text-white mb-1">Estimated Value:</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            ${selectedLoan.collateral.estimatedValue.toLocaleString()}
                          </p>
                        </div>
                      )}
                      
                      {selectedLoan.collateral.documents && selectedLoan.collateral.documents.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-secondary-900 dark:text-white mb-2">Documents:</p>
                          <div className="space-y-2">
                            {selectedLoan.collateral.documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between bg-white dark:bg-neutral-600 rounded p-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                  <span className="text-sm text-secondary-900 dark:text-white">{doc.name}</span>
                                </div>
                                {doc.url && (
                                  <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        No collateral information provided by the borrower
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Loan Modal */}
      {showAcceptModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
                <CheckCircle className="h-5 w-5 text-success mr-2" />
                Fund Loan Application
              </h3>
              <button
                onClick={() => setShowAcceptModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-success/10 dark:bg-success/20 rounded-lg p-4">
                <p className="text-sm text-success dark:text-success/30">
                  <strong>Borrower:</strong> {selectedLoan.borrower.name}<br/>
                  <strong>Amount:</strong> ${selectedLoan.loanAmount?.toLocaleString()}<br/>
                  <strong>Purpose:</strong> {selectedLoan.purpose}
                </p>
              </div>
              
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  <span className="font-medium text-primary-800 dark:text-primary-200">Next Step</span>
                </div>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  This will immediately transfer the funds from your wallet to the borrower's wallet. The loan will be marked as funded.
                </p>
              </div>
              
              <div>
                <label htmlFor="acceptAmount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Investment Amount (₦)
                </label>
                <input
                  type="number"
                  id="acceptAmount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder="Enter amount to invest"
                  min="1"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                />
              </div>
              
              <div>
                <label htmlFor="acceptNotes" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="acceptNotes"
                  value={investmentNotes}
                  onChange={(e) => setInvestmentNotes(e.target.value)}
                  placeholder="Add any notes about this investment..."
                  rows="3"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptLoan}
                  disabled={isProcessing || !investmentAmount || parseFloat(investmentAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-success hover:bg-success disabled:bg-success/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>{isProcessing ? 'Funding...' : 'Fund Loan'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Loan Modal */}
      {showRejectModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-secondary-800 rounded-lg p-6 max-w-md w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
                <XCircle className="h-5 w-5 text-error mr-2" />
                Reject Loan Application
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-error/10 dark:bg-error/20 rounded-lg p-4">
                <p className="text-sm text-error dark:text-error/30">
                  <strong>Borrower:</strong> {selectedLoan.borrower.name}<br/>
                  <strong>Amount:</strong> ${selectedLoan.loanAmount?.toLocaleString()}<br/>
                  <strong>Purpose:</strong> {selectedLoan.purpose}
                </p>
              </div>
              
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this loan application..."
                  rows="4"
                  required
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-neutral-100"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  This reason will be sent to the borrower as a notification.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectLoan}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-error hover:bg-error disabled:bg-error/50 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>{isProcessing ? 'Rejecting...' : 'Reject Loan'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedLoanForPayment(null);
        }}
        loanApplication={selectedLoanForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default LenderLoanManagement;
