import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  Download
} from 'lucide-react';

const ManualCollateralVerification = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    collateralType: '',
    description: '',
    estimatedValue: '',
    bvn: ''
  });

  const [collateralDocuments, setCollateralDocuments] = useState([]);
  const [bankStatement, setBankStatement] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [errors, setErrors] = useState({});

  const collateralTypes = [
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'vehicle', label: 'Vehicle' },
    { value: 'business', label: 'Business Assets' },
    { value: 'investment', label: 'Investment Portfolio' },
    { value: 'other', label: 'Other' }
  ];

  const documentTypeOptions = [
    { value: 'title_deed', label: 'Title Deed' },
    { value: 'registration_paper', label: 'Registration Paper' },
    { value: 'purchase_receipt', label: 'Purchase Receipt' },
    { value: 'ownership_certificate', label: 'Ownership Certificate' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCollateralDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = [...collateralDocuments];
    const newTypes = [...documentTypes];

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileIndex = newDocuments.length + index;
        newDocuments.push({
          file,
          preview: reader.result,
          name: file.name,
          size: file.size,
          base64: reader.result
        });
        newTypes.push('other'); // Default document type
      };
      reader.readAsDataURL(file);
    });

    setCollateralDocuments(newDocuments);
    setDocumentTypes(newTypes);
  };

  const handleBankStatementUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setBankStatement({
          file,
          preview: reader.result,
          name: file.name,
          size: file.size,
          base64: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCollateralDocument = (index) => {
    const newDocuments = collateralDocuments.filter((_, i) => i !== index);
    const newTypes = documentTypes.filter((_, i) => i !== index);
    setCollateralDocuments(newDocuments);
    setDocumentTypes(newTypes);
  };

  const removeBankStatement = () => {
    setBankStatement(null);
  };

  const updateDocumentType = (index, type) => {
    const newTypes = [...documentTypes];
    newTypes[index] = type;
    setDocumentTypes(newTypes);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.collateralType) {
      newErrors.collateralType = 'Please select a collateral type';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description';
    }

    if (!formData.estimatedValue || parseFloat(formData.estimatedValue) <= 0) {
      newErrors.estimatedValue = 'Please enter a valid estimated value';
    }

    if (!formData.bvn || !/^\d{11}$/.test(formData.bvn)) {
      newErrors.bvn = 'BVN must be exactly 11 digits';
    }

    if (collateralDocuments.length === 0) {
      newErrors.collateralDocuments = 'Please upload at least one collateral document';
    }

    if (!bankStatement) {
      newErrors.bankStatement = 'Please upload your bank statement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      estimatedValue: parseFloat(formData.estimatedValue),
      documentTypes
    };

    onSubmit(submitData, collateralDocuments, bankStatement);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
          Collateral Verification
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Upload documents to verify your collateral ownership and provide financial information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Collateral Information */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary-600" />
            Collateral Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Collateral Type *
              </label>
              <select
                name="collateralType"
                value={formData.collateralType}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white ${
                  errors.collateralType ? 'border-error' : 'border-neutral-300'
                }`}
              >
                <option value="">Select collateral type</option>
                {collateralTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.collateralType && (
                <p className="mt-1 text-sm text-error">{errors.collateralType}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Estimated Value (₦) *
              </label>
              <input
                type="number"
                name="estimatedValue"
                value={formData.estimatedValue}
                onChange={handleInputChange}
                placeholder="Enter estimated value"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white ${
                  errors.estimatedValue ? 'border-error' : 'border-neutral-300'
                }`}
              />
              {errors.estimatedValue && (
                <p className="mt-1 text-sm text-error">{errors.estimatedValue}</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Describe your collateral in detail..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white ${
                errors.description ? 'border-error' : 'border-neutral-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-error">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Collateral Documents Upload */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2 text-success" />
            Collateral Ownership Proof
          </h3>
          
          <div className="mb-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Upload documents that prove ownership of your collateral (title deeds, registration papers, purchase receipts, etc.)
            </p>
            
            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleCollateralDocumentUpload}
                className="hidden"
                id="collateral-documents"
              />
              <label
                htmlFor="collateral-documents"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-neutral-400 mb-2" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Click to upload collateral documents
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  PDF, JPG, PNG up to 10MB each
                </span>
              </label>
            </div>
            
            {errors.collateralDocuments && (
              <p className="mt-2 text-sm text-error">{errors.collateralDocuments}</p>
            )}
          </div>

          {/* Uploaded Documents */}
          {collateralDocuments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-secondary-900 dark:text-white">Uploaded Documents:</h4>
              {collateralDocuments.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-sm font-medium text-secondary-900 dark:text-white">
                        {doc.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={documentTypes[index] || 'other'}
                      onChange={(e) => updateDocumentType(index, e.target.value)}
                      className="text-xs px-2 py-1 border border-neutral-300 dark:border-neutral-600 rounded dark:bg-neutral-600 dark:text-white"
                    >
                      {documentTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      type="button"
                      onClick={() => removeCollateralDocument(index)}
                      className="text-error hover:text-error"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank Statement and BVN */}
        <div className="bg-white dark:bg-secondary-800 rounded-lg p-6 shadow-sm border border-neutral-200 dark:border-secondary-700">
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-accent-600" />
            Financial Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                BVN (Bank Verification Number) *
              </label>
              <input
                type="text"
                name="bvn"
                value={formData.bvn}
                onChange={handleInputChange}
                placeholder="Enter your 11-digit BVN"
                maxLength={11}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-primary-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white ${
                  errors.bvn ? 'border-error' : 'border-neutral-300'
                }`}
              />
              {errors.bvn && (
                <p className="mt-1 text-sm text-error">{errors.bvn}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Your BVN is required for identity verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Bank Statement *
              </label>
              <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleBankStatementUpload}
                  className="hidden"
                  id="bank-statement"
                />
                <label
                  htmlFor="bank-statement"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-6 w-6 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Upload bank statement
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    Last 3-6 months
                  </span>
                </label>
              </div>
              {errors.bankStatement && (
                <p className="mt-2 text-sm text-error">{errors.bankStatement}</p>
              )}
            </div>
          </div>

          {/* Uploaded Bank Statement */}
          {bankStatement && (
            <div className="mt-4">
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-accent-600" />
                  <div>
                    <p className="text-sm font-medium text-secondary-900 dark:text-white">
                      {bankStatement.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatFileSize(bankStatement.size)}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={removeBankStatement}
                  className="text-error hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Important Notice */}
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary-800 dark:text-primary-200">
                Important Notice
              </h4>
              <ul className="mt-2 text-sm text-primary-700 dark:text-primary-300 space-y-1">
                <li>• All documents will be reviewed by our admin team</li>
                <li>• Processing may take 1-3 business days</li>
                <li>• You will be notified via email once reviewed</li>
                <li>• Ensure all documents are clear and legible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Submit for Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualCollateralVerification;
