import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  User,
  TrendingUp,
  Shield,
  Eye
} from 'lucide-react';

const Marketplace = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const loadMarketplaceData = async () => {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('http://localhost:5000/api/pools', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lending pools');
        }

        const result = await response.json();
        // Map pool data to loan display format
        const mappedLoans = (result.data.pools || []).map(pool => ({
          id: pool._id || pool.id,
          purpose: pool.name || pool.purpose || 'Lending Pool',
          borrower: pool.lender?.firstName + ' ' + pool.lender?.lastName || 'Lender',
          amount: pool.size || pool.amount || 0,
          category: pool.category || 'business',
          roi: pool.interestRate || pool.roi || 0,
          duration: pool.duration || 12,
          riskScore: pool.riskLevel === 'low' ? 'A' : pool.riskLevel === 'medium' ? 'B' : 'C',
          collateral: pool.collateral || 'Pool Assets',
          funded: pool.funded || 0,
          image: pool.image || null
        }));
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Loan Marketplace
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Browse and invest in verified loan opportunities
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search loans by purpose or borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLoans.map((loan, index) => (
          <motion.div
            key={loan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="card p-6 hover:shadow-medium transition-all duration-200"
          >
            {/* Loan Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {loan.purpose}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  by {loan.borrower}
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskScoreColor(loan.riskScore)}`}>
                Risk {loan.riskScore}
              </span>
            </div>

            {/* Loan Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  ${loan.amount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
                <span className="text-lg font-bold text-success">
                  {loan.roi}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {loan.duration} months
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Collateral</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {loan.collateral}
                </span>
              </div>
            </div>

            {/* Funding Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Funding Progress</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {loan.funded}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loan.funded}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button className="flex-1 btn-primary text-sm py-2">
                Invest Now
              </button>
              <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLoans.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No loans found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or check back later for new opportunities.
          </p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <DollarSign className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ${loans.reduce((sum, loan) => sum + loan.amount, 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Available
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loans.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Active Loans
          </p>
        </div>
        
        <div className="card p-6 text-center">
          <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-success" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loans.filter(loan => loan.riskScore === 'A').length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Low Risk Loans
          </p>
        </div>
      </div>
    </div>
  );
};

export default Marketplace; 