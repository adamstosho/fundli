import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, userType: requiredUserType = null }) => {
  const { isAuthenticated, userType: currentUserType, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific user type is required, check if user has permission
  if (requiredUserType && currentUserType !== requiredUserType) {
    // Redirect to appropriate dashboard based on user type
    if (currentUserType === 'borrower') {
      return <Navigate to="/dashboard/borrower" replace />;
    } else if (currentUserType === 'lender') {
      return <Navigate to="/dashboard/lender" replace />;
    } else if (currentUserType === 'admin') {
      return <Navigate to="/dashboard/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 