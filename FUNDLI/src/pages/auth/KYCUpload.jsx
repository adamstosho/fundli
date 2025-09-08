import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const KYCUpload = () => {
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    country: '',
    postalCode: ''
  });
  const [documents, setDocuments] = useState({
    idFront: null,
    idBack: null,
    selfie: null,
    proofOfAddress: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  
  const fileInputRefs = useRef({});
  const { submitKYC, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get userType from authenticated user, with fallback to location.state
  const userType = user?.userType || location.state?.userType;

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      navigate('/login', { 
        state: { 
          from: '/kyc-upload',
          message: 'Please log in to complete your KYC verification'
        } 
      });
    } else {
      // User is authenticated, proceed with KYC upload
    }
  }, [isAuthenticated, navigate, user, userType]);

  // Wait for user data to be properly loaded
  useEffect(() => {
    if (isAuthenticated && user && user.userType) {
      setIsUserDataLoaded(true);
    } else {
      setIsUserDataLoaded(false);
    }
  }, [isAuthenticated, user]);

  // If not authenticated, don't render the form
  if (!isAuthenticated) {
    return null;
  }


  const idTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'voters_card', label: 'Voter\'s Card' }
  ];

  const countries = [
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'KE', label: 'Kenya' },
    { value: 'ZA', label: 'South Africa' },
    { value: 'GH', label: 'Ghana' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleFileUpload = (field, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload only JPG, PNG, or PDF files');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setDocuments(prev => ({
      ...prev,
      [field]: file
    }));

    // Simulate upload progress
    setUploadProgress(prev => ({
      ...prev,
      [field]: 0
    }));

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev[field] >= 100) {
          clearInterval(interval);
          return prev;
        }
        return {
          ...prev,
          [field]: prev[field] + 10
        };
      });
    }, 100);

    if (error) setError('');
  };

  const removeDocument = (field) => {
    setDocuments(prev => ({
      ...prev,
      [field]: null
    }));
    setUploadProgress(prev => ({
      ...prev,
      [field]: 0
    }));
  };

  const validateForm = () => {
    if (!formData.idNumber || !formData.dateOfBirth || !formData.address || 
        !formData.city || !formData.country || !formData.postalCode) {
      setError('Please fill in all required fields');
      return false;
    }

    const requiredDocs = ['idFront', 'selfie'];
    if (userType === 'lender') {
      requiredDocs.push('proofOfAddress');
    }

    for (const doc of requiredDocs) {
      if (!documents[doc]) {
        setError(`Please upload ${doc.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess(''); // Clear previous success messages

    try {
      // Convert files to base64
      const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            // Remove the data:image/jpeg;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = error => reject(error);
        });
      };

      // Convert all documents to base64
      const base64Documents = {};
      if (documents.idFront) {
        base64Documents.idFront = await convertFileToBase64(documents.idFront);
      }
      if (documents.selfie) {
        base64Documents.selfie = await convertFileToBase64(documents.selfie);
      }
      if (documents.idBack) {
        base64Documents.idBack = await convertFileToBase64(documents.idBack);
      }
      if (documents.proofOfAddress) {
        base64Documents.proofOfAddress = await convertFileToBase64(documents.proofOfAddress);
      }

      // Prepare KYC data
      const kycData = {
        idType: formData.idType,
        idNumber: formData.idNumber,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postalCode: formData.postalCode,
        ...base64Documents
      };

      // Submit KYC using the context function
      const result = await submitKYC(kycData);

      if (result.success) {
        setSuccess(result.message);
        
        // Navigate to the appropriate dashboard based on userType
        if (userType) {
          const dashboardPath = `/dashboard/${userType}`;
          
          // Add a delay to show success message and ensure user data is updated
          setTimeout(() => {
            navigate(dashboardPath, { replace: true });
          }, 3000); // Increased delay to 3 seconds
        } else {
          setError('User type not found. Please contact support.');
        }
      } else {
        setError(result.message || 'Failed to submit KYC. Please try again.');
      }
      
    } catch (err) {
      setError('Failed to submit KYC. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.idNumber && formData.dateOfBirth && formData.address && 
                     formData.city && formData.country && formData.postalCode &&
                     documents.idFront && documents.selfie && isUserDataLoaded;

  const renderFileUpload = (field, label, description, required = false) => (
    <div className="space-y-2">
      <label className="form-label">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        {!documents[field] ? (
          <div
            onClick={() => fileInputRefs.current[field]?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {description}
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {documents[field].name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(documents[field].size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {uploadProgress[field] === 100 && (
                  <CheckCircle className="h-5 w-5 text-success" />
                )}
                <button
                  type="button"
                  onClick={() => removeDocument(field)}
                  className="text-gray-400 hover:text-error transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {uploadProgress[field] < 100 && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[field]}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploading... {uploadProgress[field]}%
                </p>
              </div>
            )}
          </div>
        )}
        <input
          ref={(el) => (fileInputRefs.current[field] = el)}
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => handleFileUpload(field, e.target.files[0])}
          className="hidden"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">F</span>
            </div>
            <span className="text-3xl font-bold text-gradient">Fundli</span>
          </Link>
          
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Complete Your KYC Verification
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            To ensure the security and trust of our platform, we need to verify your identity. 
            This process is required for all users and helps protect everyone on Fundli.
          </p>
        </div>

        {/* KYC Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg text-sm flex items-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg text-sm flex items-center space-x-2"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="idType" className="form-label">
                    ID Type <span className="text-error">*</span>
                  </label>
                  <select
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    {idTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="idNumber" className="form-label">
                    ID Number <span className="text-error">*</span>
                  </label>
                  <input
                    id="idNumber"
                    name="idNumber"
                    type="text"
                    value={formData.idNumber}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your ID number"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="dateOfBirth" className="form-label">
                    Date of Birth <span className="text-error">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="form-label">
                    Street Address <span className="text-error">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your street address"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="city" className="form-label">
                    City <span className="text-error">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your city"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="country" className="form-label">
                    Country <span className="text-error">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select a country</option>
                    {countries.map(country => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="form-label">
                    Postal Code <span className="text-error">*</span>
                  </label>
                  <input
                    id="postalCode"
                    name="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your postal code"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Document Upload */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Document Upload
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFileUpload(
                  'idFront',
                  'ID Front Side',
                  'Upload the front side of your ID document',
                  true
                )}
                
                {renderFileUpload(
                  'idBack',
                  'ID Back Side',
                  'Upload the back side of your ID document (optional)'
                )}
                
                {renderFileUpload(
                  'selfie',
                  'Selfie with ID',
                  'Take a photo of yourself holding your ID',
                  true
                )}
                
                {userType === 'lender' && renderFileUpload(
                  'proofOfAddress',
                  'Proof of Address',
                  'Upload a recent utility bill or bank statement',
                  true
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              {!isUserDataLoaded && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                    Loading user data... Please wait before submitting KYC.
                  </p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : !isUserDataLoaded ? (
                  'Loading user data...'
                ) : (
                  <>
                    Submit KYC Verification
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
              
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                By submitting this form, you agree to our verification process and confirm that all information provided is accurate.
              </p>
            </div>
          </form>
        </div>

        {/* Back to OTP */}
        <div className="text-center mt-6">
          <Link
            to="/verify-otp"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to OTP verification
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCUpload; 