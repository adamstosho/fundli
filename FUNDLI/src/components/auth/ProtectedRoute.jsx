import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, userType: requiredUserType = null }) => {
  const { isAuthenticated, userType: currentUserType, isLoading, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute - Auth state:', {
    isLoading,
    isAuthenticated,
    currentUserType,
    requiredUserType,
    user: user ? { email: user.email, userType: user.userType } : null,
    pathname: location.pathname
  });

  if (isLoading) {
    console.log('ProtectedRoute - Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, checking localStorage...');
    
    // Check if we have auth data in localStorage but it's not loaded yet
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      console.log('ProtectedRoute - Found auth data in localStorage, waiting for AuthContext to load...');
      // Show loading spinner while AuthContext processes the data
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      );
    }
    
    console.log('ProtectedRoute - No auth data found, redirecting to login');
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific user type is required, check if user has permission
  if (requiredUserType && currentUserType !== requiredUserType) {
    console.log('ProtectedRoute - User type mismatch, redirecting to appropriate dashboard');
    // Redirect to appropriate dashboard based on user type
    if (currentUserType === 'borrower') {
      return <Navigate to="/dashboard/borrower" replace />;
    } else if (currentUserType === 'lender') {
      return <Navigate to="/dashboard/lender" replace />;
    } else if (currentUserType === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    }
  }

  console.log('ProtectedRoute - Access granted, rendering children');
  return children;
};

export default ProtectedRoute; 