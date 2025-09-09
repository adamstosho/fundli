import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp,
  Shield,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Marketplace = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, loanId: null, loanName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // KYC verification is now optional - all users can access the marketplace

  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        console.log('Making API call to /api/pools...');
        const response = await fetch('http://localhost:5000/api/pools', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`Failed to fetch lending pools: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Raw API response:', result);
        console.log('Pools data:', result.data?.pools);
                const mappedLoans = (result.data.pools || []).map(pool => ({
          id: pool.id || pool._id || Math.random().toString(),
          purpose: pool.name || 'Lending Pool',
          borrower: pool.creator?.firstName + ' ' + pool.creator?.lastName || 'Lender',
          amount: pool.poolSize || 0,
          category: 'business', // Default category since pools don't have categories yet
          roi: pool.interestRate || 0,
          duration: pool.duration || 12,
          riskScore: pool.riskLevel === 'low' ? 'A' : pool.riskLevel === 'medium' ? 'B' : 'C',
          collateral: 'Pool Assets',
          funded: pool.fundingProgress || 0,
          image: null,
          creatorId: pool.creator?.id || pool.creator?._id || pool.creator
        }));
        console.log('Mapped loans:', mappedLoans);
        setLoans(mappedLoans);
      } catch (error) {
        console.error('Error loading marketplace data:', error);
        setLoans([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMarketplaceData();
  }, []);

  const handleDeleteClick = (loanId, loanName) => {
    // Check if the pool has any funding
    const loan = loans.find(l => l.id === loanId);
    if (loan && loan.funded > 0) {
      showNotification('Cannot delete pool with active investments', 'error');
      return;
    }
    setDeleteModal({ isOpen: true, loanId, loanName });
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/pools/${deleteModal.loanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete pool: ${response.status} ${response.statusText}`);
      }

      // Remove the deleted loan from the state
      setLoans(prevLoans => prevLoans.filter(loan => loan.id !== deleteModal.loanId));
      
      // Close the modal
      setDeleteModal({ isOpen: false, loanId: null, loanName: '' });
      
      // Show success notification
      showNotification('Pool deleted successfully!', 'success');
      console.log('Pool deleted successfully');
    } catch (error) {
      console.error('Error deleting pool:', error);
      showNotification('Failed to delete pool. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, loanId: null, loanName: '' });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'business', label: 'Business' },
    { value: 'personal', label: 'Personal' },
    { value: 'education', label: 'Education' },
    { value: 'medical', label: 'Medical' }
  ];

  const getRiskScoreColor = (score) => {
    const colors = {
      'A': 'bg-success text-white',
      'B': 'bg-warning text-white',
      'C': 'bg-error text-white'
    };
    return colors[score] || 'bg-gray-500 text-white';
  };

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = (loan.purpose?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (loan.borrower?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || loan.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-h1 text-neutral-900 dark:text-white">
          Loan Marketplace
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Browse and invest in verified loan opportunities
        </p>
      </div>

      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search loans by purpose or borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-neutral-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLoans.map((loan, index) => {
          console.log('Rendering loan:', loan);
          return (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="card p-6 hover:shadow-medium transition-all duration-200"
            >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-h3 text-neutral-900 dark:text-white mb-1">
                  {loan.purpose || 'Lending Pool'}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  by {loan.borrower || 'Lender'}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(loan.riskScore || 'B')}`}>
                Risk {loan.riskScore || 'B'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Amount</span>
                <span className="text-lg font-bold text-neutral-900 dark:text-white">
                  ${(loan.amount || 0).toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">ROI</span>
                <span className="text-lg font-bold text-success">
                  {loan.roi || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Duration</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {loan.duration || 12} months
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Collateral</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {loan.collateral || 'Pool Assets'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Funding Progress</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {loan.funded || 0}%
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loan.funded || 0}%` }}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <Link
                to={`/marketplace/pool/${loan.id}`}
                className="flex-1 btn-primary text-sm py-2 flex items-center justify-center"
              >
                View Details
              </Link>
              {user?.userType === 'lender' && user?.id === loan.creatorId && (
                <button
                  onClick={() => handleDeleteClick(loan.id, loan.purpose)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center justify-center"
                  title="Delete Pool"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        );
        })}
      </div>

      {filteredLoans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <DollarSign className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-h3 text-neutral-900 dark:text-white mb-2">
            No loans found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Try adjusting your search criteria or check back later for new opportunities.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            ${loans.reduce((sum, loan) => sum + (loan.amount || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Total Available
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {loans.length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Active Loans
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-success" />
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-white">
            {loans.filter(loan => loan.riskScore === 'A').length}
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Low Risk Loans
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}
        >
          {notification.message}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleDeleteCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Delete Pool
              </h3>
            </div>
            
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-neutral-900 dark:text-white">"{deleteModal.loanName}"</span>? 
              This action cannot be undone and will permanently remove the pool.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Pool'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Marketplace; 