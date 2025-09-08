import { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CollateralManagement = () => {
  const [collateral, setCollateral] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCollateral();
  }, []);

  const fetchCollateral = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5000/api/collateral/admin/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setCollateral(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch collateral:', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Collateral Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and verify borrower collateral documents
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading collateral...</p>
        </div>
      ) : collateral.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Shield className="mx-auto h-16 w-16 mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Collateral Found</h3>
          <p>There are no pending collateral verifications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {collateral.map((item) => (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {item.collateralType}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Pending
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Value:</span>
                  <span className="font-medium">${item.estimatedValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Documents:</span>
                  <span className="text-sm">{item.documents.length} file(s)</span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Approve
                </button>
                <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollateralManagement;
