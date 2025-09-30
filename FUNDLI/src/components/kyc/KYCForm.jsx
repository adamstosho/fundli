import { useState, useEffect } from 'react';
import { buildApiUrl } from '../utils/config';
import { motion } from 'framer-motion';
import { Shield, CreditCard, Building2, CheckCircle, AlertCircle, Camera, Upload, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LivenessCheck from './LivenessCheck';

const KYCForm = ({ onSubmit, onCancel, isSubmitting = false }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    idType: 'passport',
    idNumber: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    country: '',
    postalCode: '',
    idFrontSide: null,
    idBackSide: null,
    selfieWithId: null
  });
  const [errors, setErrors] = useState({});
  const [showLivenessCheck, setShowLivenessCheck] = useState(false);
  const [livenessCompleted, setLivenessCompleted] = useState(false);
  const [uploading, setUploading] = useState({});

  const idTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'national_id', label: 'National ID' },
    { value: 'voters_card', label: 'Voter\'s Card' }
  ];

  const countries = [
    { value: 'NG', label: 'Nigeria' },
    { value: 'US', label: 'United States' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'GH', label: 'Ghana' },
    { value: 'KE', label: 'Kenya' },
    { value: 'ZA', label: 'South Africa' }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.idNumber) {
      newErrors.idNumber = 'ID Number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of Birth is required';
    }

    if (!formData.streetAddress) {
      newErrors.streetAddress = 'Street Address is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.country) {
      newErrors.country = 'Country is required';
    }

    if (!formData.postalCode) {
      newErrors.postalCode = 'Postal Code is required';
    }

    if (!formData.idFrontSide) {
      newErrors.idFrontSide = 'ID Front Side is required';
    }

    if (!formData.selfieWithId) {
      newErrors.selfieWithId = 'Selfie with ID is required';
    }

    if (!livenessCompleted) {
      newErrors.liveness = 'Facial verification is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('🔍 Form validation check:', formData);
    
    if (validateForm()) {
      console.log('✅ Form validation passed, submitting:', {
        idType: formData.idType,
        idNumber: formData.idNumber ? formData.idNumber.substring(0, 3) + '***' : 'not provided',
        livenessCompleted
      });
      onSubmit({ ...formData, livenessCompleted });
    } else {
      console.log('❌ Form validation failed, errors:', errors);
    }
  };

  const handleLivenessSuccess = () => {
    setLivenessCompleted(true);
    setShowLivenessCheck(false);
    setErrors(prev => ({ ...prev, liveness: '' }));
  };

  const handleFileUpload = (field, file) => {
    setUploading(prev => ({ ...prev, [field]: true }));
    
    // Simulate upload process
    setTimeout(() => {
      setFormData(prev => ({ ...prev, [field]: file }));
      setUploading(prev => ({ ...prev, [field]: false }));
      setErrors(prev => ({ ...prev, [field]: '' }));
    }, 1000);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, field) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(field, file);
    }
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            KYC Verification
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Complete your identity verification to access all platform features
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ID Type */}
              <div>
                <label htmlFor="idType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Type
                </label>
                <select
                  id="idType"
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {idTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ID Number */}
            <div>
                <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Number
                </label>
                <input
                  type="text"
                  id="idNumber"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your ID number"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.idNumber 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white`}
                />
                {errors.idNumber && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.idNumber}
                  </p>
                )}
              </div>

              {/* Date of Birth */}
              <div className="md:col-span-2">
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.dateOfBirth 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white`}
                  />
                </div>
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
            
            <div className="space-y-4">
              {/* Street Address */}
              <div>
                <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  id="streetAddress"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your street address"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.streetAddress 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white`}
                />
                {errors.streetAddress && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.streetAddress}
                  </p>
                )}
        </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* City */}
          <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
            </label>
              <input
                type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                onChange={handleInputChange}
                    placeholder="Enter your city"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white`}
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.city}
              </p>
            )}
          </div>

                {/* Country */}
          <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
            </label>
              <select
                    id="country"
                    name="country"
                    value={formData.country}
                onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.country 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white`}
                  >
                    <option value="">Select a country</option>
                    {countries.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                    </option>
                    ))}
              </select>
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.country}
              </p>
            )}
          </div>

                {/* Postal Code */}
          <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postal Code
            </label>
            <input
              type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
              onChange={handleInputChange}
                    placeholder="Enter your postal code"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.postalCode 
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white`}
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document Upload</h3>
            
            <div className="space-y-6">
              {/* ID Front Side */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Front Side
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    errors.idFrontSide 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : formData.idFrontSide 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'idFrontSide')}
                  onClick={() => document.getElementById('idFrontSide').click()}
                >
                  <input
                    type="file"
                    id="idFrontSide"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload('idFrontSide', e.target.files[0])}
                  />
                  {uploading.idFrontSide ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                    </div>
                  ) : formData.idFrontSide ? (
                    <div className="flex flex-col items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Uploaded: {formData.idFrontSide.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Upload the front side of your ID document</p>
                    </div>
                  )}
                </div>
                {errors.idFrontSide && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.idFrontSide}
                  </p>
                )}
              </div>

              {/* ID Back Side */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ID Back Side (Optional)
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    formData.idBackSide 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'idBackSide')}
                  onClick={() => document.getElementById('idBackSide').click()}
                >
                  <input
                    type="file"
                    id="idBackSide"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload('idBackSide', e.target.files[0])}
                  />
                  {uploading.idBackSide ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                    </div>
                  ) : formData.idBackSide ? (
                    <div className="flex flex-col items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Uploaded: {formData.idBackSide.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Upload the back side of your ID document (optional)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie with ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selfie with ID
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    errors.selfieWithId 
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                      : formData.selfieWithId 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'selfieWithId')}
                  onClick={() => document.getElementById('selfieWithId').click()}
                >
                  <input
                    type="file"
                    id="selfieWithId"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload('selfieWithId', e.target.files[0])}
                  />
                  {uploading.selfieWithId ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Uploading...</p>
                    </div>
                  ) : formData.selfieWithId ? (
                    <div className="flex flex-col items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm font-medium">Uploaded: {formData.selfieWithId.name}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Take a photo of yourself holding your ID</p>
                    </div>
                  )}
                </div>
                {errors.selfieWithId && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.selfieWithId}
              </p>
            )}
              </div>

              {/* Facial Verification */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Facial Verification Required
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Complete facial verification to enhance security and verify your identity.
                    </p>
                    {livenessCompleted ? (
                      <div className="flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Facial verification completed ✅</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowLivenessCheck(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Start Facial Verification
                      </button>
                    )}
                    {errors.liveness && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.liveness}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  Your Data is Secure
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All information is encrypted and securely transmitted. We use industry-standard 
                  security measures to protect your personal and financial information.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to OTP verification
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting KYC Verification...
                </>
              ) : (
                <>
                  Submit KYC Verification
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </button>
          </div>

          {/* Disclaimer */}
          <div className="text-center pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              By submitting this form, you agree to our verification process and confirm that all information provided is accurate.
            </p>
          </div>
        </form>
      </div>
      
      {/* Liveness Check Modal */}
      {showLivenessCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Facial Verification</h3>
            <LivenessCheck onSuccess={handleLivenessSuccess} />
            <button
              onClick={() => setShowLivenessCheck(false)}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default KYCForm;

