import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Camera, Save, Edit, CheckCircle, AlertCircle, Upload, X, Trophy, Star, Target, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateProfile, getProfile, uploadProfilePicture } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // KYC verification is now optional - all users can access profile settings

  // Load profile data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Refresh profile data
  const refreshProfile = async () => {
    try {
      const result = await getProfile();
      if (result.success) {
        console.log('Profile refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size too large. Please select an image smaller than 5MB.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async () => {
    if (!previewImage) {
      setError('Please select an image first');
      return;
    }

    setIsUploadingPicture(true);
    setError('');
    setSuccess('');

    try {
      const result = await uploadProfilePicture(previewImage);
      
      if (result.success) {
        setSuccess('Profile picture uploaded successfully!');
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      setError('Failed to upload profile picture');
    } finally {
      setIsUploadingPicture(false);
    }
  };

  const clearPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data for API (only send changed fields)
      const updateData = {};
      if (formData.firstName !== user.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName !== user.lastName) updateData.lastName = formData.lastName;
      if (formData.phone !== user.phone) updateData.phone = formData.phone;
      if (formData.bio !== user.bio) updateData.bio = formData.bio;

      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save');
        setIsEditing(false);
        return;
      }

      console.log('Updating profile with data:', updateData);
      console.log('Current user data:', user);
      console.log('Form data:', formData);

      const result = await updateProfile(updateData);
      console.log('Profile update result:', result);
      
      if (result.success) {
        setSuccess(result.message);
        setIsEditing(false);
        // Refresh profile data to get latest info
        await refreshProfile();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      bio: user.bio || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Badge system data
  const badgesCatalog = [
    { key: 'seed', name: 'Seed Starter', min: 10, icon: '🌱' },
    { key: 'sprout', name: 'Sprout Saver', min: 30, icon: '🌿' },
    { key: 'ember', name: 'Ember Earner', min: 60, icon: '🔥' },
    { key: 'river', name: 'River Reliable', min: 100, icon: '🌊' },
    { key: 'steel', name: 'Steel Steady', min: 150, icon: '🛡️' },
    { key: 'hawk', name: 'Hawk Honest', min: 210, icon: '🦅' },
    { key: 'oak', name: 'Oak On‑time', min: 280, icon: '🌳' },
    { key: 'aurum', name: 'Aurum Achiever', min: 360, icon: '🏅' },
    { key: 'titan', name: 'Titan Trustworthy', min: 450, icon: '🏆' },
    { key: 'legend', name: 'Legendary Lender‑Friend', min: 550, icon: '👑' }
  ];

  const getNextBadge = () => {
    const currentPoints = user?.reliabilityPoints || 0;
    const ownedKeys = new Set((user?.badges || []).map(b => b.key));
    return badgesCatalog.find(badge => !ownedKeys.has(badge.key) && badge.min > currentPoints);
  };

  const getProgressToNextBadge = () => {
    const currentPoints = user?.reliabilityPoints || 0;
    const nextBadge = getNextBadge();
    if (!nextBadge) return { progress: 100, pointsNeeded: 0 };
    
    const previousBadge = badgesCatalog
      .filter(b => b.min <= currentPoints)
      .sort((a, b) => b.min - a.min)[0];
    
    const startPoints = previousBadge ? previousBadge.min : 0;
    const endPoints = nextBadge.min;
    const progress = ((currentPoints - startPoints) / (endPoints - startPoints)) * 100;
    const pointsNeeded = endPoints - currentPoints;
    
    return { progress: Math.min(100, Math.max(0, progress)), pointsNeeded };
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Profile Settings
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Manage your personal information and account details
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg flex items-center"
        >
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </motion.div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Picture Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-1"
        >
          <div className="card p-6 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-32 h-32 rounded-full object-cover" 
                  />
                ) : user?.profilePicture?.url ? (
                  <img 
                    src={user.profilePicture.url} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    className="w-32 h-32 rounded-full object-cover" 
                  />
                ) : (
                  <User className="h-16 w-16 text-white" />
                )}
              </div>
              
              {/* File Upload Button */}
              <label 
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white hover:bg-primary-700 transition-colors cursor-pointer"
                title="Upload profile picture"
              >
                <Camera className="h-5 w-5" />
              </label>
              <input
                ref={fileInputRef}
                id="profile-picture"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Upload Controls */}
            {previewImage && (
              <div className="mb-4 space-y-2">
                <button
                  onClick={handleProfilePictureUpload}
                  disabled={isUploadingPicture}
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUploadingPicture ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Picture
                    </>
                  )}
                </button>
                <button
                  onClick={clearPreview}
                  className="w-full bg-neutral-200 text-neutral-700 px-4 py-2 rounded-lg hover:bg-neutral-300 transition-colors flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}
            
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User Name'}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Member since {formatDate(user?.createdAt)}
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-center space-x-2 text-neutral-600 dark:text-neutral-400">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center justify-center space-x-2 text-neutral-600 dark:text-neutral-400">
                  <Phone className="h-4 w-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>

            {/* Account Status */}
            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-secondary-700">
              <h4 className="text-sm font-medium text-secondary-900 dark:text-white mb-3">Account Status</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Email Verified</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user?.isEmailVerified 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {user?.isEmailVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Phone Verified</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user?.isPhoneVerified 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {user?.isPhoneVerified ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">KYC Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user?.kycStatus === 'verified' 
                      ? 'bg-success/10 text-success'
                      : user?.kycStatus === 'pending'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {user?.kycStatus || 'Not submitted'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                Personal Information
              </h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="btn-outline text-sm py-2 px-4"
              >
                {isEditing ? (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled={true} // Email cannot be changed
                    className="input-field pl-10 bg-neutral-50 dark:bg-secondary-800 cursor-not-allowed"
                    title="Email address cannot be changed"
                  />
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Email address cannot be changed for security reasons
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="form-label">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input-field pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="form-label">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-secondary-700">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>

      {/* Badge Collection Section - Only show for borrowers */}
      {user?.role === 'borrower' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-primary-600" />
                Achievement Badges
              </h3>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">
                {user?.reliabilityPoints || 0} Reliability Points
              </div>
            </div>

            {/* Progress to Next Badge */}
            {getNextBadge() && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-secondary-900 dark:text-white flex items-center">
                    <Target className="h-4 w-4 mr-2 text-primary-600" />
                    Next Badge: {getNextBadge().name}
                  </h4>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    {getProgressToNextBadge().pointsNeeded} points needed
                  </span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-secondary-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressToNextBadge().progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  <span>{user?.reliabilityPoints || 0} points</span>
                  <span>{getNextBadge().min} points</span>
                </div>
              </div>
            )}

            {/* Badge Collection Grid */}
            <div className="achievement-shelf">
              {badgesCatalog.map((badge) => {
                const isEarned = user?.badges?.some(userBadge => userBadge.key === badge.key);
                const earnedBadge = user?.badges?.find(userBadge => userBadge.key === badge.key);
                
                return (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: badgesCatalog.indexOf(badge) * 0.1 }}
                    className={`relative p-4 rounded-lg text-center transition-all duration-300 ${
                      isEarned 
                        ? 'bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 border-2 border-primary-300 dark:border-primary-700 shadow-lg' 
                        : 'bg-neutral-100 dark:bg-secondary-800 border-2 border-neutral-200 dark:border-secondary-700 opacity-60'
                    }`}
                  >
                    <div className="text-4xl mb-2">
                      {badge.icon}
                    </div>
                    <h5 className={`font-semibold text-sm mb-1 ${
                      isEarned 
                        ? 'text-secondary-900 dark:text-white' 
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {badge.name}
                    </h5>
                    <p className={`text-xs ${
                      isEarned 
                        ? 'text-neutral-600 dark:text-neutral-300' 
                        : 'text-neutral-400 dark:text-neutral-500'
                    }`}>
                      {badge.min} points
                    </p>
                    {isEarned && earnedBadge?.earnedAt && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                      </div>
                    )}
                    {isEarned && earnedBadge?.earnedAt && (
                      <p className="text-xs text-success mt-2">
                        Earned {new Date(earnedBadge.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Badge Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-neutral-50 dark:bg-secondary-800 rounded-lg">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {user?.badges?.length || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Badges Earned
                </div>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-secondary-800 rounded-lg">
                <div className="text-2xl font-bold text-accent-600 dark:text-accent-400">
                  {user?.reliabilityPoints || 0}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Total Points
                </div>
              </div>
              <div className="text-center p-4 bg-neutral-50 dark:bg-secondary-800 rounded-lg">
                <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {Math.round(((user?.badges?.length || 0) / badgesCatalog.length) * 100)}%
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Collection
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Profile; 