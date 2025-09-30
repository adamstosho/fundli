// Configuration utilities for API endpoints

/**
 * Build API URL with proper base URL
 * @param {string} endpoint - The API endpoint path
 * @returns {string} - Complete API URL
 */
export const buildApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Get base URL from environment or use default
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Ensure base URL doesn't end with slash
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  
  return `${cleanBaseURL}/${cleanEndpoint}`;
};

/**
 * Get the base API URL
 * @returns {string} - Base API URL
 */
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

/**
 * Check if we're in development mode
 * @returns {boolean} - True if in development
 */
export const isDevelopment = () => {
  return import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;
};

/**
 * Check if we're in production mode
 * @returns {boolean} - True if in production
 */
export const isProduction = () => {
  return import.meta.env.VITE_ENV === 'production' || import.meta.env.PROD;
};

/**
 * Get app configuration
 * @returns {object} - App configuration object
 */
export const getAppConfig = () => {
  return {
    name: import.meta.env.VITE_APP_NAME || 'Fundli',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    apiUrl: getApiBaseUrl(),
    environment: import.meta.env.VITE_ENV || 'development',
    isDev: isDevelopment(),
    isProd: isProduction()
  };
};

export default {
  buildApiUrl,
  getApiBaseUrl,
  isDevelopment,
  isProduction,
  getAppConfig
};
