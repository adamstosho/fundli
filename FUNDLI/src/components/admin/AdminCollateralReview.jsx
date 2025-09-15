import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  AlertCircle,
  Download,
  MessageSquare,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import FeedbackManagement from './FeedbackManagement';

const AdminCollateralReview = () => {
  const [verifications, setVerifications] = useState([]);
  const [approvedVerifications, setApprovedVerifications] = useState([]);
  const [deletedVerifications, setDeletedVerifications] = useState([]);
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [reviewForm, setReviewForm] = useState({
    status: '',
    notes: '',
    rejectionReason: '',
    verifiedValue: '',
    verificationNotes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showActions, setShowActions] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedBorrowerForFeedback, setSelectedBorrowerForFeedback] = useState(null);

  useEffect(() => {
    loadAllVerifications();
  }, []);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.actions-menu')) {
        setShowActions({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadAllVerifications = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('accessToken');
      
      // Load pending verifications
      const pendingResponse = await fetch('http://localhost:5000/api/collateral/admin/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Load approved verifications
      const approvedResponse = await fetch('http://localhost:5000/api/collateral/admin/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Load deleted verifications
      const deletedResponse = await fetch('http://localhost:5000/api/collateral/admin/deleted', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        console.log('Pending verifications loaded:', pendingData.data.verifications.length);
        setVerifications(pendingData.data.verifications);
      }
      
      if (approvedResponse.ok) {
        const approvedData = await approvedResponse.json();
        console.log('Approved verifications loaded:', approvedData.data.verifications.length);
        setApprovedVerifications(approvedData.data.verifications);
      }
      
      if (deletedResponse.ok) {
        const deletedData = await deletedResponse.json();
        console.log('Deleted verifications loaded:', deletedData.data.verifications.length);
        setDeletedVerifications(deletedData.data.verifications);
      }
      
    } catch (error) {
      console.error('Error loading verifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/collateral/admin/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Pending verifications loaded:', data);
        setVerifications(data.data.verifications);
      } else {
        console.error('Failed to load pending verifications');
      }
    } catch (error) {
      console.error('Error loading pending verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.status) {
      alert('Please select a review status');
      return;
    }

    if (reviewForm.status === 'rejected' && !reviewForm.rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }

    setReviewing(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/collateral/admin/${selectedVerification.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });

      if (response.ok) {
        alert('Review submitted successfully');
        setSelectedVerification(null);
        setReviewForm({ status: '', notes: '', rejectionReason: '', verifiedValue: '', verificationNotes: '' });
        loadAllVerifications();
      } else {
        const errorData = await response.json();
        alert(`Failed to submit review: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteVerification = async () => {
    if (!selectedVerification) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this collateral verification?\n\n` +
      `Borrower: ${selectedVerification.user.name}\n` +
      `Collateral Type: ${selectedVerification.collateralType.replace('_', ' ')}\n` +
      `Estimated Value: ₦${selectedVerification.estimatedValue.toLocaleString()}\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5000/api/collateral/admin/${selectedVerification.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Delete response:', result);
        alert('Collateral verification deleted successfully');
        setSelectedVerification(null);
        // Force refresh all data
        await loadAllVerifications();
        console.log('Data refreshed after deletion');
        // Switch to deleted tab to show the result
        setActiveTab('deleted');
      } else {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`Failed to delete verification: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deleting verification:', error);
      alert('Failed to delete verification');
    }
  };

  const handleSendFeedback = (verification) => {
    setSelectedBorrowerForFeedback({
      id: verification._id,
      borrower: verification.user,
      purpose: 'Collateral Verification Review',
      loanAmount: verification.estimatedValue,
      recipientType: 'borrower'
    });
    setShowFeedbackModal(true);
  };

  // Export data functionality
  const exportToCSV = (data, filename) => {
    const headers = ['ID', 'Borrower Name', 'Email', 'Collateral Type', 'Estimated Value', 'Status', 'Submitted At', 'Reviewed At'];
    const csvContent = [
      headers.join(','),
      ...data.map(item => [
        item.id,
        `"${item.user.name}"`,
        `"${item.user.email}"`,
        `"${item.collateralType.replace('_', ' ')}"`,
        item.estimatedValue,
        item.verificationStatus,
        new Date(item.submittedAt).toLocaleDateString(),
        item.approvedAt ? new Date(item.approvedAt).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportApprovedData = () => {
    exportToCSV(approvedVerifications, `approved_collateral_verifications_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportDeletedData = () => {
    exportToCSV(deletedVerifications, `deleted_collateral_verifications_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Filter and search functionality
  const getFilteredVerifications = (verificationList) => {
    let filtered = verificationList;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(verification =>
        verification.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        verification.collateralType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(verification => verification.verificationStatus === filterStatus);
    }

    return filtered;
  };

  // Toggle actions menu
  const toggleActions = (verificationId) => {
    setShowActions(prev => ({
      ...prev,
      [verificationId]: !prev[verificationId]
    }));
  };

  // Print verification details
  const printVerification = (verification) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Collateral Verification - ${verification.user.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; }
            .value { margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Collateral Verification Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <h2>Borrower Information</h2>
            <div class="value"><span class="label">Name:</span> ${verification.user.name}</div>
            <div class="value"><span class="label">Email:</span> ${verification.user.email}</div>
            <div class="value"><span class="label">Phone:</span> ${verification.user.phone || 'N/A'}</div>
          </div>
          
          <div class="section">
            <h2>Collateral Details</h2>
            <div class="value"><span class="label">Type:</span> ${verification.collateralType.replace('_', ' ')}</div>
            <div class="value"><span class="label">Estimated Value:</span> ₦${verification.estimatedValue.toLocaleString()}</div>
            <div class="value"><span class="label">Description:</span> ${verification.description}</div>
            <div class="value"><span class="label">Status:</span> ${verification.verificationStatus}</div>
            <div class="value"><span class="label">Submitted:</span> ${new Date(verification.submittedAt).toLocaleDateString()}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'deleted': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'deleted': return <XCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Collateral Verification Review
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Review and approve/reject collateral verification submissions
            </p>
          </div>
          <div className="flex space-x-3">
            {/* Export buttons for approved and deleted tabs */}
            {activeTab === 'approved' && approvedVerifications.length > 0 && (
              <button
                onClick={exportApprovedData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                title="Export approved verifications to CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            )}
            {activeTab === 'deleted' && deletedVerifications.length > 0 && (
              <button
                onClick={exportDeletedData}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                title="Export deleted verifications to CSV"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by borrower name, email, or collateral type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Pending Reviews ({verifications.length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Approved ({approvedVerifications.length})
            </button>
            <button
              onClick={() => setActiveTab('deleted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deleted'
                  ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Deleted ({deletedVerifications.length})
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verifications List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeTab === 'pending' && `Pending Reviews (${verifications.length})`}
                {activeTab === 'approved' && `Approved Verifications (${approvedVerifications.length})`}
                {activeTab === 'deleted' && `Deleted Verifications (${deletedVerifications.length})`}
              </h2>
              <button
                onClick={loadAllVerifications}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                const currentVerifications = activeTab === 'pending' ? verifications : 
                                           activeTab === 'approved' ? approvedVerifications :
                                           deletedVerifications;
                
                const filteredVerifications = getFilteredVerifications(currentVerifications);
                
                if (filteredVerifications.length === 0) {
                  return (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        {currentVerifications.length === 0 
                          ? `No ${activeTab} verifications` 
                          : 'No verifications match your search criteria'
                        }
                      </p>
                    </div>
                  );
                }
                
                return (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredVerifications.map((verification) => (
                    <motion.div
                      key={verification.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className={`p-4 transition-colors ${
                        selectedVerification?.id === verification.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            console.log('Selected verification:', verification);
                            setSelectedVerification(verification);
                          }}
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {verification.user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {verification.collateralType.replace('_', ' ').toUpperCase()}
                          </p>
                          <p className="text-sm font-medium text-green-600 dark:text-green-400">
                            ₦{verification.estimatedValue.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Submitted: {formatDate(verification.submittedAt)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(verification.verificationStatus)}`}>
                            {getStatusIcon(verification.verificationStatus)}
                            <span>{verification.verificationStatus.replace('_', ' ')}</span>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => toggleActions(verification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {showActions[verification.id] && (
                              <div className="actions-menu absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px]">
                                <button
                                  onClick={() => {
                                    setSelectedVerification(verification);
                                    setShowActions({});
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    handleSendFeedback(verification);
                                    setShowActions({});
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>Send Feedback</span>
                                </button>
                                <button
                                  onClick={() => {
                                    printVerification(verification);
                                    setShowActions({});
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  <span>Print Report</span>
                                </button>
                                {activeTab === 'approved' && (
                                  <button
                                    onClick={() => {
                                      exportToCSV([verification], `collateral_verification_${verification.id}.csv`);
                                      setShowActions({});
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                                  >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    <span>Export Single</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Verification Details */}
        <div className="lg:col-span-2">
          {selectedVerification ? (
            <div className="space-y-6">
              {/* User Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Borrower Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <p className="text-gray-900 dark:text-white">{selectedVerification.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="text-gray-900 dark:text-white">{selectedVerification.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                    <p className="text-gray-900 dark:text-white">{selectedVerification.user.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">BVN</label>
                    <p className="text-gray-900 dark:text-white font-mono">{selectedVerification.bvn}</p>
                  </div>
                </div>
              </div>

              {/* Collateral Information */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Collateral Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <p className="text-gray-900 dark:text-white capitalize">
                      {selectedVerification.collateralType.replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Value</label>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      ₦{selectedVerification.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <p className="text-gray-900 dark:text-white">{selectedVerification.description}</p>
                  </div>
                </div>
              </div>

              {/* Collateral Documents */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-600" />
                  Collateral Documents
                </h3>
                <div className="space-y-3">
                  {(() => {
                    console.log('Collateral documents:', selectedVerification.collateralDocuments);
                    return selectedVerification.collateralDocuments && selectedVerification.collateralDocuments.length > 0 ? (
                      selectedVerification.collateralDocuments.map((doc, index) => {
                        console.log('Document data:', doc);
                        return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {doc.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.documentType.replace('_', ' ').toUpperCase()} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                        <a
                          href={doc.fileUrl}
                          download={doc.originalName}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No collateral documents uploaded</p>
                    </div>
                  );
                  })()}
                </div>
              </div>

              {/* Bank Statement */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Bank Statement
                </h3>
                {(() => {
                  console.log('Bank statement data:', selectedVerification.bankStatement);
                  if (selectedVerification.bankStatement && selectedVerification.bankStatement.fileUrl) {
                    return (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {selectedVerification.bankStatement.originalName || 'Bank Statement'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedVerification.bankStatement.fileSize ? formatFileSize(selectedVerification.bankStatement.fileSize) : 'File uploaded'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <a
                            href={selectedVerification.bankStatement.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={selectedVerification.bankStatement.fileUrl}
                            download={selectedVerification.bankStatement.originalName || 'bank-statement'}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No bank statement uploaded</p>
                      </div>
                    );
                  }
                })()}
              </div>

              {/* Deletion Details - Only show for deleted verifications */}
              {activeTab === 'deleted' && selectedVerification && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <XCircle className="h-5 w-5 mr-2 text-gray-600" />
                    Deletion Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deleted At</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedVerification.deletedAt)}</p>
                    </div>
                    {selectedVerification.deletedBy && (
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deleted By</label>
                        <p className="text-gray-900 dark:text-white">{selectedVerification.deletedBy.name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review Form - Only show for pending verifications */}
              {activeTab === 'pending' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-red-600" />
                  Review Decision
                </h3>
                
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Decision *
                    </label>
                    <select
                      value={reviewForm.status}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select decision</option>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="needs_more_info">Request More Information</option>
                    </select>
                  </div>

                  {reviewForm.status === 'approved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Verified Collateral Value (₦) *
                      </label>
                      <input
                        type="number"
                        value={reviewForm.verifiedValue}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, verifiedValue: e.target.value }))}
                        placeholder="Enter verified collateral value"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This will be displayed to lenders and borrowers
                      </p>
                    </div>
                  )}

                  {reviewForm.status === 'rejected' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rejection Reason *
                      </label>
                      <textarea
                        value={reviewForm.rejectionReason}
                        onChange={(e) => setReviewForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                        rows={3}
                        placeholder="Explain why this verification is being rejected..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={reviewForm.notes}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      placeholder="Additional notes for the borrower..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handleDeleteVerification}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Delete Verification</span>
                    </button>
                    
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setSelectedVerification(null)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reviewing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {reviewing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Submit Review</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a verification to review
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a collateral verification from the list to view details and make a decision
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Management Modal */}
      {showFeedbackModal && selectedBorrowerForFeedback && (
        <FeedbackManagement
          loanId={selectedBorrowerForFeedback.id}
          loanData={selectedBorrowerForFeedback}
          onClose={() => {
            setShowFeedbackModal(false);
            setSelectedBorrowerForFeedback(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminCollateralReview;
