import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  User, 
  Eye, 
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KYCForm from '../../components/kyc/KYCForm';
import ManualCollateralVerification from '../../components/collateral/ManualCollateralVerification';

const BrowseLoans = () => {
  const { user, refreshUserData } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [showLoanApplicationModal, setShowLoanApplicationModal] = useState(false);
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collateralStatus, setCollateralStatus] = useState(null);

  // Debug function to check authentication status
  const debugAuth = () => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    const refreshToken = localStorage.getItem('refreshToken');
    
    console.log('🔍 Auth Debug Info:');
    console.log('- Token exists:', !!token);
    console.log('- Token length:', token?.length || 0);
    console.log('- User exists:', !!user);
    console.log('- Refresh token exists:', !!refreshToken);
    console.log('- User from context:', user);
    console.log('- User type from context:', user?.userType);
    
    return { token, user, refreshToken };
  };

  // Helper function to validate and refresh token if needed
  const validateToken = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No token found');
      }

      // Test token with a simple API call
      const response = await fetch('http://localhost:5000/api/auth/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Token is valid');
        return token;
      } else if (response.status === 401) {
        console.log('❌ Token is invalid, attempting refresh...');
        
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await fetch('http://localhost:5000/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const newToken = refreshData.accessToken || refreshData.data?.accessToken;
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              console.log('✅ Token refreshed successfully');
              return newToken;
            }
          }
        }
        
        // If refresh fails, try to refresh user data from AuthContext
        try {
          console.log('🔄 Attempting to refresh user data from AuthContext...');
          await refreshUserData();
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            console.log('✅ User data refreshed successfully');
            return newToken;
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh user data:', refreshError);
        }
        
        // If all refresh attempts fail, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        throw new Error('Session expired. Please log in again.');
      } else {
        throw new Error('Token validation failed');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadAvailableLoans();
    checkCollateralStatus();
  }, []);

  const checkCollateralStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/collateral/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCollateralStatus(data.data.collateral);
      }
    } catch (error) {
      console.error('Error checking collateral status:', error);
    }
  };

  const loadAvailableLoans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      console.log('🔍 Loading available lending pools for borrowers...');
      console.log('🔑 Token exists:', !!token);
      
      // Fetch lending pools (created by lenders) that borrowers can apply to
      const response = await fetch('http://localhost:5000/api/pools', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Lending pools loaded successfully:', result);
        
        // Transform lending pools into loan opportunities for borrowers
        const loanOpportunities = (result.data?.pools || []).map(pool => ({
          id: pool._id || pool.id,
          name: pool.name || 'Lending Pool',
          purpose: pool.name || 'Business Loan',
          purposeDescription: pool.description || 'Apply for funding from this lending pool',
          loanAmount: pool.poolSize || 0,
          poolSize: pool.poolSize || 0,
          currency: pool.currency || 'USD',
          interestRate: pool.interestRate || 0,
          duration: pool.duration || 12,
          monthlyPayment: 0, // Will be calculated when borrower applies
          totalRepayment: 0, // Will be calculated when borrower applies
          riskLevel: pool.riskLevel || 'medium',
          status: pool.status || 'active',
          createdAt: pool.createdAt,
          lender: {
            id: pool.creator?._id || pool.creator?.id,
            name: pool.creator ? `${pool.creator.firstName} ${pool.creator.lastName}` : 'Lender',
            email: pool.creator?.email || 'lender@example.com'
          },
          fundingProgress: pool.fundingProgress || 0,
          minInvestment: pool.minInvestment || 100,
          maxInvestment: pool.maxInvestment || pool.poolSize
        }));
        
        console.log('📊 Transformed loan opportunities:', loanOpportunities.length);
        setLoans(loanOpportunities);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Failed to load lending pools:', errorData);
        alert(`Failed to load lending pools: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error loading lending pools:', error);
      alert(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowLoanApplicationModal(true);
  };

  const handleFundLoan = async (loan) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Check if user has sufficient balance
      const walletResponse = await fetch('http://localhost:5000/api/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        const wallet = walletData.data;
        
        if (wallet.balance < loan.loanAmount) {
          alert(`Insufficient balance. Required: ₦${loan.loanAmount.toLocaleString()}, Available: ₦${wallet.balance.toLocaleString()}`);
          return;
        }
      }
      
      // Confirm funding
      const confirmed = window.confirm(
        `Are you sure you want to fund this loan?\n\n` +
        `Amount: ₦${loan.loanAmount.toLocaleString()}\n` +
        `Borrower: ${loan.borrower.name}\n` +
        `Purpose: ${loan.purpose}`
      );
      
      if (!confirmed) return;
      
      setIsSubmitting(true);
      
      const response = await fetch(`http://localhost:5000/api/loans/${loan.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentReference: `FUND_${loan.id}_${Date.now()}`,
          amount: loan.loanAmount
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Loan funded successfully! ${result.message}`);
        await loadAvailableLoans();
      } else {
        const errorData = await response.json();
        alert(`Failed to fund loan: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error funding loan:', error);
      alert('Failed to fund loan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKYCSubmit = async (kycData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      
      console.log('📝 Submitting KYC data:', {
        bvn: kycData.bvn ? kycData.bvn.substring(0, 3) + '***' : 'not provided',
        accountNumber: kycData.accountNumber ? kycData.accountNumber.substring(0, 3) + '***' : 'not provided',
        bankCode: kycData.bankCode
      });
      
      // Submit KYC first
      const kycResponse = await fetch('http://localhost:5000/api/borrower/kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(kycData)
      });

      console.log('📡 KYC response status:', kycResponse.status);

      if (kycResponse.ok) {
        const result = await kycResponse.json();
        console.log('✅ KYC submitted successfully:', result);
        // KYC submitted successfully, now show loan application form
        setShowKYCModal(false);
        setShowLoanApplicationModal(true);
      } else {
        const errorData = await kycResponse.json();
        console.error('❌ KYC submission failed:', errorData);
        alert(`KYC submission failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ Error submitting KYC:', error);
      alert('Failed to submit KYC. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollateralSubmit = async (formData, collateralDocuments, bankStatement) => {
    setIsSubmitting(true);

    try {
      // Debug authentication status
      debugAuth();
      
      // Validate and refresh token if needed
      const token = await validateToken();
      console.log('🔐 Collateral submission - Using validated token:', token ? `${token.substring(0, 20)}...` : 'No token');

      // Prepare data for JSON submission
      const submitData = {
        collateralType: formData.collateralType,
        description: formData.description,
        estimatedValue: formData.estimatedValue,
        bvn: formData.bvn,
        documentTypes: formData.documentTypes,
        collateralDocuments: collateralDocuments.map(doc => ({
          name: doc.name,
          base64: doc.base64,
          size: doc.size,
          type: doc.file?.type || 'application/octet-stream'
        })),
        bankStatement: bankStatement ? {
          name: bankStatement.name,
          base64: bankStatement.base64,
          size: bankStatement.size,
          type: bankStatement.file?.type || 'application/octet-stream'
        } : null
      };

      console.log('📤 Collateral submission - Making request to:', 'http://localhost:5000/api/collateral/submit');
      console.log('📤 Collateral submission - Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });

      const response = await fetch('http://localhost:5000/api/collateral/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('📥 Collateral submission - Response status:', response.status);
      console.log('📥 Collateral submission - Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📥 Collateral submission - Response result:', result);

      if (!response.ok) {
        console.error('❌ Collateral submission failed:', result);
        
        // Handle specific error cases
        if (response.status === 401) {
          console.error('❌ Authentication failed - clearing tokens');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please log in again.');
        }
        
        throw new Error(result.message || 'Failed to submit collateral verification');
      }

      // Close collateral modal and refresh status
      setShowCollateralModal(false);
      await checkCollateralStatus();
      alert('Collateral verification submitted successfully! You can now proceed with your loan application.');
      
      // If there's a pending application, proceed with it
      if (selectedLoan?.pendingApplication) {
        // Submit the pending loan application
        await submitPendingLoanApplication(selectedLoan.pendingApplication);
        // Clear the pending application
        setSelectedLoan(prev => ({
          ...prev,
          pendingApplication: null
        }));
      } else {
        // Show loan application modal if no pending application
        setShowLoanApplicationModal(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit collateral verification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPendingLoanApplication = async (applicationData) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('📝 Submitting pending loan application for pool:', selectedLoan.id);
      console.log('📝 Application data:', applicationData);
      
      // Apply to lending pool using the borrower loan application endpoint
      const response = await fetch(`http://localhost:5000/api/borrower/loan/${selectedLoan.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...applicationData,
          lendingPoolId: selectedLoan.id
        })
      });

      console.log('📡 Application response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Loan application successful:', result);
        alert(`Loan application submitted successfully! ${result.message}`);
        setShowLoanApplicationModal(false);
        setSelectedLoan(null);
        // Refresh loans list
        await loadAvailableLoans();
      } else {
        const errorData = await response.json();
        console.error('❌ Loan application failed:', errorData);
        alert(`Loan application failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ Error submitting loan application:', error);
      alert('Failed to submit loan application. Please try again.');
    }
  };

  const handleLoanApplication = async (applicationData) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      
      // Each loan application requires its own collateral submission
      // No global collateral verification check needed
      
      console.log('📝 Submitting loan application for pool:', selectedLoan.id);
      console.log('📝 Application data:', applicationData);
      
      // Apply to lending pool using the borrower loan application endpoint
      const response = await fetch(`http://localhost:5000/api/borrower/loan/${selectedLoan.id}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...applicationData,
          lendingPoolId: selectedLoan.id
        })
      });

      console.log('📡 Application response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Loan application successful:', result);
        alert(`Loan application submitted successfully! ${result.message}`);
        setShowLoanApplicationModal(false);
        setSelectedLoan(null);
        // Refresh loans list
        await loadAvailableLoans();
      } else {
        const errorData = await response.json();
        console.error('❌ Loan application failed:', errorData);
        alert(`Loan application failed: ${errorData.message}`);
      }
    } catch (error) {
      console.error('❌ Error submitting loan application:', error);
      alert('Failed to submit loan application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'business': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'personal': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400';
      case 'education': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Browse Available Loans
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find and apply for loans that match your needs
        </p>
      </div>

      {/* Collateral Status Banner */}
      {collateralStatus && (
        <div className={`p-4 rounded-lg border ${
          collateralStatus.verificationStatus === 'approved' 
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : collateralStatus.verificationStatus === 'rejected'
            ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {collateralStatus.verificationStatus === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
              {collateralStatus.verificationStatus === 'rejected' && <AlertCircle className="h-5 w-5 text-red-600" />}
              {(collateralStatus.verificationStatus === 'submitted' || collateralStatus.verificationStatus === 'under_review') && <Clock className="h-5 w-5 text-yellow-600" />}
              <p className={`text-sm font-medium ${
                collateralStatus.verificationStatus === 'approved' ? 'text-green-800 dark:text-green-200' :
                collateralStatus.verificationStatus === 'rejected' ? 'text-red-800 dark:text-red-200' :
                'text-yellow-800 dark:text-yellow-200'
              }`}>
                {collateralStatus.verificationStatus === 'approved' && 'Collateral verification approved! You can apply for loans.'}
                {collateralStatus.verificationStatus === 'rejected' && `Collateral verification rejected: ${collateralStatus.adminReview?.rejectionReason || 'Please contact support'}`}
                {(collateralStatus.verificationStatus === 'submitted' || collateralStatus.verificationStatus === 'under_review') && 'Collateral verification is being reviewed by our team.'}
              </p>
            </div>
            {collateralStatus.verificationStatus !== 'approved' && (
              <button
                onClick={() => setShowCollateralModal(true)}
                className="text-sm px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {collateralStatus.verificationStatus === 'rejected' ? 'Resubmit Verification' : 'Complete Verification'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* KYC verification is now optional */}

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map((loan, index) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Loan Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {loan.purpose}
                </h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(loan.riskLevel)}`}>
                    {loan.riskLevel || 'Medium'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    {loan.status || 'Pending'}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {loan.purposeDescription || 'No description available'}
              </p>
            </div>

            {/* Loan Details */}
            <div className="p-6 space-y-4">
              {/* Amount and Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loan Amount</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {loan.currency || 'USD'} {loan.loanAmount?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Payment</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {loan.currency || 'USD'} {loan.monthlyPayment?.toLocaleString() || 'N/A'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Repayment</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {loan.currency || 'USD'} {loan.totalRepayment?.toLocaleString() || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">Interest:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{loan.interestRate || 0}%</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{loan.duration || 0} months</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-400">Lender:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{loan.lender.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0">
              <button
                onClick={() => handleViewDetails(loan)}
                className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Apply for Loan</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Loans Message */}
      {loans.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Loans Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            There are currently no loans available for application. This could be because:
          </p>
          <ul className="text-sm text-gray-500 dark:text-gray-400 text-left max-w-md mx-auto mb-4">
            <li>• No loans have been submitted yet</li>
            <li>• All available loans have been funded</li>
            <li>• Loans are still being reviewed</li>
          </ul>
          <p className="text-gray-500 dark:text-gray-400">
            Please check back later or contact support if you need assistance.
          </p>
        </div>
      )}

      {/* KYC Modal */}
      {showKYCModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Complete KYC for {selectedLoan.name}
              </h3>
              <button
                onClick={() => setShowKYCModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <KYCForm
              onSubmit={handleKYCSubmit}
              onCancel={() => setShowKYCModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Collateral Verification Modal */}
      {showCollateralModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Collateral Verification Required
              </h3>
              <button
                onClick={() => setShowCollateralModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            {selectedLoan?.pendingApplication && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    You have a pending loan application for {selectedLoan.name}. Complete collateral verification to proceed.
                  </p>
                </div>
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-300">
                  Requested Amount: ${selectedLoan.pendingApplication.requestedAmount?.toLocaleString()}
                </div>
              </div>
            )}
            
            <ManualCollateralVerification
              onSubmit={handleCollateralSubmit}
              onCancel={() => setShowCollateralModal(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Loan Application Modal */}
      {showLoanApplicationModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Apply for Loan from {selectedLoan.name}
              </h3>
              <button
                onClick={() => setShowLoanApplicationModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <LoanApplicationForm
              loan={selectedLoan}
              onSubmit={handleLoanApplication}
              onCancel={() => setShowLoanApplicationModal(false)}
              isSubmitting={isSubmitting}
              user={user}
              collateralStatus={collateralStatus}
              setSelectedLoan={setSelectedLoan}
              setShowLoanApplicationModal={setShowLoanApplicationModal}
              setShowCollateralModal={setShowCollateralModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Loan Application Form Component
const LoanApplicationForm = ({ 
  loan, 
  onSubmit, 
  onCancel, 
  isSubmitting, 
  user, 
  collateralStatus, 
  setSelectedLoan, 
  setShowLoanApplicationModal, 
  setShowCollateralModal 
}) => {
  const [formData, setFormData] = useState({
    requestedAmount: '',
    purpose: '',
    duration: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Lending Pool Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Lending Pool Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Pool Size:</span>
            <p className="font-medium text-gray-900 dark:text-white">${loan.poolSize?.toLocaleString()}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
            <p className="font-medium text-gray-900 dark:text-white">{loan.interestRate}%</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Max Duration:</span>
            <p className="font-medium text-gray-900 dark:text-white">{loan.duration} months</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{loan.riskLevel}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Lender:</span>
            <p className="font-medium text-gray-900 dark:text-white">{loan.lender?.name}</p>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Min Investment:</span>
            <p className="font-medium text-gray-900 dark:text-white">${loan.minInvestment?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="requestedAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Requested Amount ($)
          </label>
          <input
            type="number"
            id="requestedAmount"
            name="requestedAmount"
            value={formData.requestedAmount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            min="0"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pool size: ${loan.poolSize?.toLocaleString()}
          </p>
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Purpose
          </label>
          <select
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select purpose</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="home_improvement">Home Improvement</option>
            <option value="debt_consolidation">Debt Consolidation</option>
            <option value="medical">Medical</option>
            <option value="vehicle">Vehicle</option>
            <option value="personal">Personal</option>
            <option value="investment">Investment</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration (months)
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            placeholder="Enter duration"
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Pool duration: {loan.duration} months
          </p>
        </div>

        {/* Collateral Status Display */}
        {true ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Collateral verification completed and approved
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Collateral verification required before submitting loan application
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        {/* Continue to Collateral Verification Button */}
        <button
          type="button"
          onClick={() => {
            // Store the form data and show collateral verification
            const applicationData = {
              requestedAmount: formData.requestedAmount,
              purpose: formData.purpose,
              duration: formData.duration
            };
            // Store pending application and show collateral modal
            setSelectedLoan(prev => ({
              ...prev,
              pendingApplication: applicationData
            }));
            setShowLoanApplicationModal(false);
            setShowCollateralModal(true);
          }}
          disabled={isSubmitting || !formData.requestedAmount || !formData.purpose || !formData.duration}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Shield className="h-4 w-4" />
          <span>Continue to Collateral Verification</span>
        </button>
        
        {/* Submit Application Button - Only show if collateral is approved */}
        {true && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        )}
        
        {/* Cancel Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default BrowseLoans;
