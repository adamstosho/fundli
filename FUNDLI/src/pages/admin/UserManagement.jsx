import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Filter, Eye, Edit, Shield, CheckCircle, XCircle, MoreVertical, AlertCircle } from 'lucide-react';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [kycStatusFilter, setKycStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [pagination, setPagination] = useState({
    totalPages: 0,
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10,
  });

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setCurrentPage(1);
        loadUsers();
      } else {
        loadUsers();
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      if (!isFiltering) {
        setIsLoading(true);
      }
      setError('');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Build query parameters for filtering
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString()
      });

      // Add search term if provided
      if (searchTerm.trim()) {
        queryParams.append('search', searchTerm.trim());
      }

      // Add status filter if not 'all'
      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          queryParams.append('isActive', 'true');
        } else if (statusFilter === 'suspended') {
          queryParams.append('isActive', 'false');
        } else if (statusFilter === 'pending') {
          queryParams.append('kycStatus', 'pending');
        }
      }

      // Add user type filter if not 'all'
      if (userTypeFilter !== 'all') {
        queryParams.append('userType', userTypeFilter);
      }

      // Add KYC status filter if not 'all'
      if (kycStatusFilter !== 'all') {
        queryParams.append('kycStatus', kycStatusFilter);
      }

      const response = await fetch(`http://localhost:5000/api/admin/users?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Users data received:', result);
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsFiltering(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, usersPerPage, statusFilter, userTypeFilter, kycStatusFilter]);

  const refreshUsers = () => {
    loadUsers();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Search is handled by debounced useEffect
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
    setIsFiltering(true);
    loadUsers();
  };

  const handleUserTypeFilterChange = (e) => {
    setUserTypeFilter(e.target.value);
    setCurrentPage(1);
    setIsFiltering(true);
    loadUsers();
  };

  const handleKycStatusFilterChange = (e) => {
    setKycStatusFilter(e.target.value);
    setCurrentPage(1);
    setIsFiltering(true);
    loadUsers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setUserTypeFilter('all');
    setKycStatusFilter('all');
    setCurrentPage(1);
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

  const toggleUserStatus = async (user) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          isActive: !user.isActive
        })
      });

      if (response.ok) {
        // Refresh users list
        refreshUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.message || 'Failed to update user status');
    }
  };

  const approveKYC = async (user) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5000/api/admin/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          kycStatus: 'approved'
        })
      });

      if (response.ok) {
        // Refresh users list
        refreshUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve KYC');
      }
    } catch (error) {
      console.error('Error approving KYC:', error);
      setError(error.message || 'Failed to approve KYC');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'suspended':
        return 'badge-error';
      default:
        return 'badge-info';
    }
  };

  const getKycStatusColor = (kycStatus) => {
    switch (kycStatus) {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success/Error Messages */}
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              User Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage platform users, view profiles, and control access
            </p>
          </div>
          
          <button
            onClick={refreshUsers}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            <div className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}>
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination.totalItems}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-success">
                {users.filter(u => u.isActive).length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending KYC</p>
              <p className="text-2xl font-bold text-warning">
                {users.filter(u => u.kycStatus === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-warning-600 dark:text-warning-400" />
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Suspended</p>
              <p className="text-2xl font-bold text-error">
                {users.filter(u => !u.isActive).length}
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
        {isFiltering && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Applying filters...
              </span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={handleSearch}
                className="input-field pl-10 w-full"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="input-field w-32 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending KYC</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={userTypeFilter}
                onChange={handleUserTypeFilterChange}
                className="input-field w-32 text-sm"
              >
                <option value="all">All Types</option>
                <option value="borrower">Borrower</option>
                <option value="lender">Lender</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={kycStatusFilter}
                onChange={handleKycStatusFilterChange}
                className="input-field w-32 text-sm"
              >
                <option value="all">All KYC</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Platform Users
            </h3>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all' || kycStatusFilter !== 'all' ? (
                <span>
                  Showing {users.length} of {pagination.totalItems} users
                  {(searchTerm || statusFilter !== 'all' || userTypeFilter !== 'all' || kycStatusFilter !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="ml-2 text-primary-600 hover:text-primary-700 underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </span>
              ) : (
                `Total: ${pagination.totalItems} users`
              )}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  KYC Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length > 0 ? (
                users.map((user) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {user.firstName?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        user.userType === 'admin' 
                          ? 'badge-error' 
                          : user.userType === 'lender'
                          ? 'badge-success'
                          : 'badge-info'
                      }`}>
                        {user.userType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        user.isActive 
                          ? 'badge-success' 
                          : 'badge-error'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        user.kycStatus === 'approved' 
                          ? 'badge-success' 
                          : user.kycStatus === 'rejected'
                          ? 'badge-error'
                          : user.kycStatus === 'pending'
                          ? 'badge-warning'
                          : 'badge-info'
                      }`}>
                        {user.kycStatus || 'Not Submitted'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {user.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => viewUserDetails(user)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {user.userType !== 'admin' && (
                          <>
                            <button 
                              onClick={() => toggleUserStatus(user)}
                              className={`${
                                user.isActive 
                                  ? 'text-warning-600 dark:text-warning-400 hover:text-warning-700 dark:hover:text-warning-300'
                                  : 'text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300'
                              }`}
                              title={user.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {user.isActive ? (
                                <XCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            
                            {user.kycStatus === 'pending' && (
                              <button 
                                onClick={() => approveKYC(user)}
                                className="text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300"
                                title="Approve KYC"
                              >
                                <Shield className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {isLoading ? 'Loading...' : 'No users found'}
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
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} results
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  User Details
                </h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Type</label>
                  <p className="text-gray-900 dark:text-white capitalize">{selectedUser.userType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                  <span className={`badge ${selectedUser.isActive ? 'badge-success' : 'badge-error'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">KYC Status</label>
                  <span className={`badge ${
                    selectedUser.kycStatus === 'approved' ? 'badge-success' : 
                    selectedUser.kycStatus === 'rejected' ? 'badge-error' :
                    selectedUser.kycStatus === 'pending' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {selectedUser.kycStatus || 'Not Submitted'}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Credit Score</label>
                  <p className="text-gray-900 dark:text-white">{selectedUser.creditScore || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Join Date</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              
              {selectedUser.kycDocuments && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">KYC Documents</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.kycDocuments.documents?.idFront && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Front</label>
                        <img 
                          src={selectedUser.kycDocuments.documents.idFront.url} 
                          alt="ID Front" 
                          className="w-full h-32 object-cover rounded-lg mt-1"
                        />
                      </div>
                    )}
                    {selectedUser.kycDocuments.documents?.selfie && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Selfie</label>
                        <img 
                          src={selectedUser.kycDocuments.documents.selfie.url} 
                          alt="Selfie" 
                          className="w-full h-32 object-cover rounded-lg mt-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 