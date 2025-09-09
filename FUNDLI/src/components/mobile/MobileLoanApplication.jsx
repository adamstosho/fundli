import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, CheckCircle, AlertCircle, DollarSign, Calendar, FileText } from 'lucide-react';

const MobileLoanApplication = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    duration: '',
    monthlyIncome: '',
    employmentStatus: '',
    collateral: null,
    collateralDescription: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { number: 1, title: 'Loan Details', icon: DollarSign },
    { number: 2, title: 'Financial Info', icon: FileText },
    { number: 3, title: 'Collateral', icon: Upload },
    { number: 4, title: 'Review', icon: CheckCircle }
  ];

  const loanPurposes = [
    'Business Investment',
    'Education',
    'Medical Emergency',
    'Home Improvement',
    'Debt Consolidation',
    'Wedding',
    'Vehicle Purchase',
    'Other'
  ];

  const employmentStatuses = [
    'Employed',
    'Self-Employed',
    'Freelancer',
    'Student',
    'Unemployed',
    'Retired'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.amount || formData.amount < 10000) {
          newErrors.amount = 'Minimum loan amount is ₦10,000';
        }
        if (!formData.purpose) {
          newErrors.purpose = 'Please select a loan purpose';
        }
        if (!formData.duration || formData.duration < 1) {
          newErrors.duration = 'Please select a valid duration';
        }
        break;
      case 2:
        if (!formData.monthlyIncome || formData.monthlyIncome < 10000) {
          newErrors.monthlyIncome = 'Please enter a valid monthly income';
        }
        if (!formData.employmentStatus) {
          newErrors.employmentStatus = 'Please select employment status';
        }
        break;
      case 3:
        if (!formData.collateral) {
          newErrors.collateral = 'Please upload collateral document';
        }
        if (!formData.collateralDescription) {
          newErrors.collateralDescription = 'Please describe your collateral';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, collateral: file }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, collateral: null }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Apply for Loan</h1>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step.number
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                <step.icon className="h-4 w-4" />
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-4">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Step 1: Loan Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Amount (₦)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.amount && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.amount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Purpose
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select purpose</option>
                  {loanPurposes.map(purpose => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
                {errors.purpose && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.purpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (months)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="Enter duration"
                  min="1"
                  max="60"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.duration && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.duration}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Financial Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Income (₦)
                </label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                  placeholder="Enter monthly income"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.monthlyIncome && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.monthlyIncome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Employment Status
                </label>
                <select
                  value={formData.employmentStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, employmentStatus: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  {employmentStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.employmentStatus && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.employmentStatus}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Collateral */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collateral Document
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  {formData.collateral ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formData.collateral.name}</p>
                      <button
                        onClick={removeFile}
                        className="text-red-600 dark:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload collateral document
                      </p>
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        id="collateral-upload"
                      />
                      <label
                        htmlFor="collateral-upload"
                        className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg cursor-pointer"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
                {errors.collateral && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.collateral}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Collateral Description
                </label>
                <textarea
                  value={formData.collateralDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, collateralDescription: e.target.value }))}
                  placeholder="Describe your collateral..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {errors.collateralDescription && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.collateralDescription}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Review Your Application</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{formData.amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Purpose:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.purpose}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.duration} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Income:</span>
                    <span className="font-medium text-gray-900 dark:text-white">₦{formData.monthlyIncome?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Employment:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.employmentStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex space-x-3 mt-8">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileLoanApplication;
