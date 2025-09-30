import { useState, useRef } from 'react';
import { buildApiUrl } from '../../utils/config';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye,
  Trash2,
  Shield,
  DollarSign
} from 'lucide-react';

const CollateralUpload = ({ onCollateralAdded, onCollateralRemoved }) => {
  const [collateralItems, setCollateralItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newCollateral, setNewCollateral] = useState({
    type: '',
    description: '',
    estimatedValue: '',
    documents: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleCollateralChange = (e) => {
    const { name, value } = e.target;
    setNewCollateral(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setNewCollateral(prev => ({
        ...prev,
        documents: [...prev.documents, ...validFiles]
      }));
      setError('');
    }
  };

  const removeFile = (fileIndex) => {
    setNewCollateral(prev => ({
      ...prev,
      documents: prev.documents.filter((_, index) => index !== fileIndex)
    }));
  };

  const addCollateral = () => {
    if (!newCollateral.type || !newCollateral.description || !newCollateral.estimatedValue || newCollateral.documents.length === 0) {
      setError('Please fill in all collateral fields and upload at least one document');
      return;
    }

    const collateralItem = {
      ...newCollateral,
      id: Date.now(),
      estimatedValue: parseFloat(newCollateral.estimatedValue),
      documents: newCollateral.documents.map(doc => ({
        file: doc,
        name: doc.name,
        size: doc.size,
        type: doc.type,
        verificationStatus: 'pending'
      })),
      verificationStatus: 'pending',
      timestamp: new Date().toISOString()
    };

    setCollateralItems(prev => [...prev, collateralItem]);
    
    if (onCollateralAdded) {
      onCollateralAdded(collateralItem);
    }

    setNewCollateral({
      type: '',
      description: '',
      estimatedValue: '',
      documents: []
    });
    setShowForm(false);
    setError('');
  };

  const removeCollateral = (collateralId) => {
    setCollateralItems(prev => prev.filter(item => item.id !== collateralId));
    
    if (onCollateralRemoved) {
      onCollateralRemoved(collateralId);
    }
  };

  const submitForVerification = async (collateralId) => {
    setIsSubmitting(true);
    setError('');

    try {
      const collateral = collateralItems.find(item => item.id === collateralId);
      if (!collateral) throw new Error('Collateral not found');

      const formData = new FormData();
      formData.append('collateralType', collateral.type);
      formData.append('description', collateral.description);
      formData.append('estimatedValue', collateral.estimatedValue);
      
      collateral.documents.forEach((doc, index) => {
        formData.append('documents', doc.file);
      });

      const token = localStorage.getItem('accessToken');
      const response = await fetch(buildApiUrl('/collateral/verify'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit for verification');
      }

      setCollateralItems(prev => prev.map(item => 
        item.id === collateralId 
          ? { ...item, verificationStatus: 'submitted', verificationId: result.verificationId }
          : item
      ));

    } catch (err) {
      setError(err.message || 'Failed to submit for verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCollateralIcon = (type) => {
    switch (type) {
      case 'real_estate': return <Shield className="h-5 w-5" />;
      case 'vehicle': return <DollarSign className="h-5 w-5" />;
      case 'business': return <FileText className="h-5 w-5" />;
      case 'investment': return <DollarSign className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getCollateralTypeLabel = (type) => {
    switch (type) {
      case 'real_estate': return 'Real Estate';
      case 'vehicle': return 'Vehicle';
      case 'business': return 'Business Assets';
      case 'investment': return 'Investment Portfolio';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-error" />;
      case 'submitted':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'submitted':
        return 'Under Review';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-success/20 text-success dark:bg-success dark:text-success/30';
      case 'rejected':
        return 'bg-error/20 text-error dark:bg-error dark:text-error/30';
      case 'submitted':
        return 'bg-warning/20 text-warning dark:bg-warning dark:text-warning/30';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-secondary-900 dark:text-neutral-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
            Collateral Documentation
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Upload documents to secure your loan with verified collateral
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Add Collateral</span>
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-error/10 dark:bg-error/20 border border-error/30 dark:border-error text-error dark:text-error/40 px-4 py-3 rounded-lg text-sm flex items-center"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </motion.div>
      )}

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-neutral-200 dark:border-secondary-700 rounded-lg p-6 bg-neutral-50 dark:bg-secondary-800"
        >
          <h4 className="text-lg font-medium text-secondary-900 dark:text-white mb-4">
            Add New Collateral
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Collateral Type
              </label>
              <select
                name="type"
                value={newCollateral.type}
                onChange={handleCollateralChange}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-white"
                required
              >
                <option value="">Select type</option>
                <option value="real_estate">Real Estate</option>
                <option value="vehicle">Vehicle</option>
                <option value="business">Business Assets</option>
                <option value="investment">Investment Portfolio</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={newCollateral.description}
                onChange={handleCollateralChange}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-white"
                placeholder="e.g., 2020 Toyota Camry"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Estimated Value (USD)
              </label>
              <input
                type="number"
                name="estimatedValue"
                value={newCollateral.estimatedValue}
                onChange={handleCollateralChange}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-700 text-secondary-900 dark:text-white"
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Upload Documents
            </label>
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-neutral-400 mb-2" />
              <label htmlFor="collateral-docs" className="cursor-pointer">
                <span className="text-primary-600 hover:text-primary-500 font-medium">
                  Click to upload
                </span>
                <span className="text-neutral-500"> or drag and drop</span>
              </label>
              <input
                id="collateral-docs"
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
              />
              <p className="text-xs text-neutral-500 mt-2">
                PDF, DOC, DOCX, JPG, PNG up to 10MB each
              </p>
            </div>
          </div>

          {newCollateral.documents.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Uploaded Documents:
              </h5>
              <div className="space-y-2">
                {newCollateral.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between bg-white dark:bg-neutral-700 p-3 rounded border">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {doc.name}
                      </span>
                      <span className="text-xs text-neutral-500">
                        ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 text-neutral-400 hover:text-error transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addCollateral}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Collateral
            </button>
          </div>
        </motion.div>
      )}

      {collateralItems.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-secondary-900 dark:text-white">
            Your Collateral
          </h4>
          {collateralItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-neutral-200 dark:border-secondary-700 rounded-lg p-6 bg-white dark:bg-secondary-800"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                    {getCollateralIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="font-medium text-secondary-900 dark:text-white">
                        {getCollateralTypeLabel(item.type)}
                      </h5>
                      <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                        ${item.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.verificationStatus)}`}>
                    {getStatusIcon(item.verificationStatus)}
                    <span className="ml-1">{getStatusText(item.verificationStatus)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCollateral(item.id)}
                    className="p-2 text-neutral-400 hover:text-error transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Documents:
                </h6>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between bg-neutral-50 dark:bg-neutral-700 p-3 rounded border">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {doc.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          className="p-1 text-neutral-400 hover:text-primary-500 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {item.verificationStatus === 'pending' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => submitForVerification(item.id)}
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 bg-success text-white px-4 py-2 rounded-lg hover:bg-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>Submit for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {item.verificationStatus !== 'pending' && (
                <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong>Status:</strong> {getStatusText(item.verificationStatus)}
                  </p>
                  {item.verificationId && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      <strong>Verification ID:</strong> {item.verificationId}
                    </p>
                  )}
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    <strong>Submitted:</strong> {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {collateralItems.length === 0 && !showForm && (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
          <Shield className="mx-auto h-16 w-16 mb-4 text-neutral-300" />
          <h4 className="text-lg font-medium mb-2">No Collateral Added</h4>
          <p className="text-sm mb-4">
            Adding collateral can improve your loan terms and approval chances
          </p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Your First Collateral
          </button>
        </div>
      )}
    </div>
  );
};

export default CollateralUpload;
