import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, handleAPIError } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  userType: null,
  kycStatus: 'pending',
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    
    case 'AUTH_SUCCESS':
      // Handle both { user: {...} } and direct user object payloads
      const userData = action.payload.user || action.payload;
      console.log('AUTH_SUCCESS reducer - payload:', action.payload);
      console.log('AUTH_SUCCESS reducer - userData:', userData);
      console.log('AUTH_SUCCESS reducer - userType:', userData?.userType);
      console.log('AUTH_SUCCESS reducer - userType type:', typeof userData?.userType);
      
      // Validate that userType is present and valid
      if (!userData?.userType) {
        console.error('AUTH_SUCCESS reducer - ERROR: No userType in userData!');
        console.error('AUTH_SUCCESS reducer - userData:', userData);
        throw new Error('Invalid user data: missing userType');
      }
      
      if (!['borrower', 'lender', 'admin'].includes(userData.userType)) {
        console.error('AUTH_SUCCESS reducer - ERROR: Invalid userType:', userData.userType);
        throw new Error(`Invalid userType: ${userData.userType}`);
      }
      
      const newState = {
        ...state,
        user: userData,
        userType: userData.userType,
        kycStatus: userData?.kycStatus || 'pending',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      
      console.log('AUTH_SUCCESS reducer - new state:', newState);
      console.log('AUTH_SUCCESS reducer - final userType in state:', newState.userType);
      console.log('AUTH_SUCCESS reducer - Authentication successful for userType:', newState.userType);
      
      return newState;
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        userType: null,
        kycStatus: 'pending',
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        userType: null,
        kycStatus: 'pending',
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : action.payload,
        userType: action.payload?.userType || state.userType,
        kycStatus: action.payload?.kycStatus || state.kycStatus,
      };
    
    case 'UPDATE_KYC_STATUS':
      return {
        ...state,
        kycStatus: action.payload,
        user: state.user ? { ...state.user, kycStatus: action.payload } : null,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Debug: Log state changes
  useEffect(() => {
    console.log('AuthContext state changed:', {
      isAuthenticated: state.isAuthenticated,
      userType: state.userType,
      user: state.user ? { email: state.user.email, userType: state.user.userType } : null
    });
  }, [state.isAuthenticated, state.userType, state.user]);

  // Clear corrupted data from localStorage
  const clearCorruptedData = () => {
    try {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      console.log('clearCorruptedData - Checking localStorage data');
      console.log('clearCorruptedData - userData:', userData);
      console.log('clearCorruptedData - accessToken exists:', !!accessToken);
      console.log('clearCorruptedData - refreshToken exists:', !!refreshToken);
      
      // Check if userData exists and is not null/undefined
      if (userData && userData !== 'null' && userData !== 'undefined') {
        try {
          const user = JSON.parse(userData);
          if (!user || !user.email || !user.userType) {
            console.log('clearCorruptedData - Invalid user data structure, clearing session');
            clearAuthData();
          } else {
            console.log('clearCorruptedData - User data is valid');
          }
        } catch (parseError) {
          console.error('clearCorruptedData - Error parsing user data:', parseError);
          console.log('clearCorruptedData - Corrupted user data:', userData);
          clearAuthData();
        }
      } else if (userData === 'null' || userData === 'undefined') {
        // Clear invalid string values
        console.log('clearCorruptedData - Invalid string values found, clearing session');
        clearAuthData();
      } else if (!userData && (accessToken || refreshToken)) {
        // If we have tokens but no user data, clear everything
        console.log('clearCorruptedData - Tokens exist but no user data, clearing session');
        clearAuthData();
      }
    } catch (error) {
      console.error('clearCorruptedData - Error checking localStorage data:', error);
      clearAuthData();
    }
  };

  // Check if user is already logged in on app start
  useEffect(() => {
    // Clear any corrupted data first
    clearCorruptedData();
    
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');
        
        console.log('checkAuthStatus - Token exists:', !!token);
        console.log('checkAuthStatus - User data exists:', !!userData);
        
        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            console.log('checkAuthStatus - Parsed user data:', user);
            console.log('checkAuthStatus - userType from localStorage:', user.userType);
            
            // Validate that user data has required fields
            if (user && user.email && user.userType) {
              // Validate userType is correct
              if (!['borrower', 'lender', 'admin'].includes(user.userType)) {
                console.error('checkAuthStatus - ERROR: Invalid userType in localStorage:', user.userType);
                clearAuthData();
                return;
              }
              
              console.log('checkAuthStatus - Valid user data, restoring session for userType:', user.userType);
              
              // Set authentication state immediately
              dispatch({
                type: 'AUTH_SUCCESS',
                payload: { user }
              });
              
              // Optionally verify token with backend (but don't wait for it)
              verifyTokenWithBackend(token, user);
            } else {
              console.log('checkAuthStatus - Invalid user data structure, clearing session');
              console.log('checkAuthStatus - Missing fields:', {
                hasUser: !!user,
                hasEmail: !!user?.email,
                hasUserType: !!user?.userType
              });
              clearAuthData();
            }
          } catch (parseError) {
            console.error('checkAuthStatus - Error parsing user data:', parseError);
            clearAuthData();
          }
        } else {
          console.log('checkAuthStatus - No token or user data, setting as not authenticated');
          dispatch({ type: 'AUTH_FAILURE', payload: null });
        }
      } catch (error) {
        console.error('checkAuthStatus - Error:', error);
        dispatch({ type: 'AUTH_FAILURE', payload: null });
      }
    };

    checkAuthStatus();
  }, []);

  // Helper function to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    dispatch({ type: 'AUTH_FAILURE', payload: null });
  };

  // Helper function to verify token with backend (non-blocking)
  const verifyTokenWithBackend = async (token, user) => {
    try {
      console.log('verifyTokenWithBackend - Verifying token with backend');
      
      const response = await fetch('http://localhost:5000/api/auth/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        console.log('verifyTokenWithBackend - Token is valid');
        // Token is valid, no need to do anything
      } else if (response.status === 401) {
        console.log('verifyTokenWithBackend - Token invalid, clearing session');
        clearAuthData();
      } else {
        console.log('verifyTokenWithBackend - Unexpected response:', response.status);
        // Don't clear session on unexpected responses
      }
    } catch (error) {
      console.log('verifyTokenWithBackend - Error verifying token:', error);
      // Don't clear session on network errors, keep user logged in
      // This prevents logout when backend is temporarily unavailable
    }
  };

  // Add a function to refresh the token if needed
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch('http://localhost:5000/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        console.log('Token refreshed successfully');
        return true;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Register new user
  const register = async (userData) => {
    try {
      console.log('AuthContext: Starting registration with data:', userData);
      console.log('AuthContext: userType in registration data:', userData.userType);
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.register(userData);
      console.log('AuthContext: Registration API response:', response);
      
      // Handle the nested response structure from backend
      const responseData = response.data;
      console.log('AuthContext: Response data structure:', responseData);
      
      // Check if data is nested under response.data.data
      const user = responseData.data?.user || responseData.user;
      const accessToken = responseData.data?.accessToken || responseData.accessToken;
      const refreshToken = responseData.data?.refreshToken || responseData.refreshToken;
      
      console.log('AuthContext: User data from response:', user);
      console.log('AuthContext: userType from response:', user?.userType);
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('AuthContext: Stored user data in localStorage:', user);
      
      // Update authentication state - user is now logged in
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user }
      });
      console.log('AuthContext: Dispatched AUTH_SUCCESS with userType:', user.userType);
      
      return { success: true, message: 'Registration successful! Please verify your email.' };
    } catch (error) {
      console.error('Registration error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle validation errors specifically
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => `${err.field}: ${err.message}`).join(', ');
        const errorInfo = { type: 'validation', message: errorMessages };
        dispatch({ type: 'AUTH_FAILURE', payload: errorMessages });
        return { success: false, message: errorMessages };
      }
      
      const errorInfo = handleAPIError(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorInfo.message });
      return { success: false, message: errorInfo.message };
    }
  };

  // Login user
  const login = async (credentials) => {
    try {
      console.log('AuthContext: Starting login process for email:', credentials.email);
      dispatch({ type: 'AUTH_START' });
      const response = await authAPI.login(credentials);
      console.log('AuthContext: Login API response:', response);
      
      // Handle the nested response structure from backend
      const responseData = response.data;
      console.log('AuthContext: Response data structure:', responseData);
      
      // Check if data is nested under response.data.data
      const userData = responseData.data?.user || responseData.user;
      const accessToken = responseData.data?.accessToken || responseData.accessToken;
      const refreshToken = responseData.data?.refreshToken || responseData.refreshToken;
      
      console.log('AuthContext: Extracted user data:', userData);
      console.log('AuthContext: userType from response:', userData?.userType);
      console.log('AuthContext: userType type:', typeof userData?.userType);
      
      // Validate that userType is present and correct
      if (!userData?.userType) {
        console.error('AuthContext: ERROR - No userType in response!');
        console.error('AuthContext: Full response data:', responseData);
        throw new Error('Invalid user data received from server');
      }
      
      // Store tokens and user data
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('AuthContext: Stored user data in localStorage:', userData);
      console.log('AuthContext: Stored userType in localStorage:', userData.userType);
      
      // Update authentication state with the complete user data
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: userData }
      });
      console.log('AuthContext: Dispatched AUTH_SUCCESS with userType:', userData.userType);
      
      // Verify the state was updated correctly
      console.log('AuthContext: Login completed successfully for userType:', userData.userType);
      
      return { success: true, message: 'Login successful!' };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorInfo = handleAPIError(error);
      dispatch({ type: 'AUTH_FAILURE', payload: errorInfo.message });
      return { success: false, message: errorInfo.message };
    }
  };

  // Verify OTP
  const verifyOTP = async (email, otp) => {
    try {
      console.log('verifyOTP - Starting OTP verification for email:', email);
      const response = await authAPI.verifyOTP(email, otp);
      console.log('verifyOTP - Backend response:', response);
      
      // Handle the nested response structure from backend
      const responseData = response.data;
      console.log('verifyOTP - Response data structure:', responseData);
      
      // Check if data is nested under response.data.data
      const userData = responseData.data?.user || responseData.user;
      
      // The backend should return the updated user data with userType
      if (userData) {
        console.log('verifyOTP - Updated user data from backend:', userData);
        console.log('verifyOTP - userType from backend:', userData.userType);
        
        // Update localStorage with the complete user data from backend
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update authentication state with the complete user data
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: userData }
        });
        
        console.log('verifyOTP - Authentication state updated with userType:', userData.userType);
        
        return { success: true, message: 'Email verified successfully!' };
      } else {
        // Fallback: update user with verified status but keep existing userType
        const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { 
          ...existingUser,
          isEmailVerified: true 
        };
        
        console.log('verifyOTP - Fallback update, existing userType:', existingUser.userType);
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: { isEmailVerified: true }
        });
        
        return { success: true, message: 'Email verified successfully!' };
      }
    } catch (error) {
      console.error('verifyOTP - Error:', error);
      const errorInfo = handleAPIError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Resend OTP
  const resendOTP = async (email) => {
    try {
      await authAPI.resendOTP(email);
      return { success: true, message: 'OTP sent successfully!' };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      await authAPI.forgotPassword(email);
      return { success: true, message: 'Password reset email sent!' };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Reset password
  const resetPassword = async (token, password) => {
    try {
      await authAPI.resetPassword(token, password);
      return { success: true, message: 'Password reset successfully!' };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      return { success: true, message: 'Password changed successfully!' };
    } catch (error) {
      const errorInfo = handleAPIError(error);
      return { success: false, message: errorInfo.message };
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      console.log('AuthContext: Updating profile with data:', profileData);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      console.log('Profile update response:', result);

      if (response.ok) {
        // Update local state with new user data
        const updatedUser = result.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: updatedUser
        });

        console.log('Profile updated successfully:', updatedUser);
        return { success: true, message: result.message || 'Profile updated successfully!' };
      } else {
        // Handle validation errors
        if (result.errors && Array.isArray(result.errors)) {
          console.log('Validation errors received:', result.errors);
          // Extract the actual error message from the first error object
          const firstError = result.errors[0];
          let errorMessage;
          
          if (typeof firstError === 'string') {
            errorMessage = firstError;
          } else if (firstError && typeof firstError === 'object') {
            // If it's an object, try to get the message property
            errorMessage = firstError.message || firstError.msg || JSON.stringify(firstError);
          } else {
            errorMessage = 'Validation failed';
          }
          
          throw new Error(errorMessage);
        }
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  };

  // Get user profile
  const getProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (response.ok) {
        // Update local state with fresh profile data
        const updatedUser = result.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: updatedUser
        });

        return { success: true, data: updatedUser };
      } else {
        throw new Error(result.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return { success: false, message: error.message || 'Failed to fetch profile' };
    }
  };

  // Upload profile picture
  const uploadProfilePicture = async (base64Data) => {
    try {
      console.log('AuthContext: Uploading profile picture');
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/users/profile-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profilePicture: base64Data })
      });

      const result = await response.json();
      console.log('Profile picture upload response:', result);

      if (response.ok) {
        // Update local state with new profile picture
        const updatedUser = { ...state.user, profilePicture: result.data.profilePicture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: updatedUser
        });

        console.log('Profile picture uploaded successfully:', result.data.profilePicture);
        return { success: true, message: result.message, data: result.data.profilePicture };
      } else {
        throw new Error(result.message || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      return { success: false, message: error.message || 'Failed to upload profile picture' };
    }
  };

  // Update KYC status
  const updateKYCStatus = (status) => {
    dispatch({ type: 'UPDATE_KYC_STATUS', payload: status });
  };

  // Submit KYC documents
  const submitKYC = async (kycData) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('KYC submission - Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      // Check if token is valid by making a test request
      console.log('KYC submission - Making request to:', 'http://localhost:5000/api/users/kyc');
      console.log('KYC submission - Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.substring(0, 20)}...`
      });

      const response = await fetch('http://localhost:5000/api/users/kyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kycData)
      });

      console.log('KYC submission - Response status:', response.status);
      console.log('KYC submission - Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('KYC submission response:', response);
      console.log('KYC submission result:', result);

      if (response.ok) {
        // Update local state
        const updatedUser = { 
          ...JSON.parse(localStorage.getItem('user') || '{}'),
          kycStatus: 'pending',
          isEmailVerified: true 
        };
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        dispatch({
          type: 'UPDATE_USER',
          payload: { 
            kycStatus: 'pending',
            isEmailVerified: true 
          }
        });
        return { success: true, message: result.message };
      } else {
        console.error('KYC submission failed:', result);
        
        // If token is invalid, clear it and redirect to login
        if (response.status === 401) {
          console.log('Token invalid, clearing authentication data');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired. Please login again.' });
        }
        
        return { success: false, message: result.message || 'Failed to submit KYC' };
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      return { success: false, message: 'Failed to submit KYC' };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    register,
    login,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    updateProfile,
    getProfile,
    uploadProfilePicture,
    updateKYCStatus,
    submitKYC,
    refreshAuthToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 