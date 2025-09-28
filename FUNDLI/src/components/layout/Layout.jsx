import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import NotificationToastContainer from '../common/NotificationToast';
import { useAuth } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const location = useLocation();
  
  // Check if we're on the landing page
  const isLandingPage = location.pathname === '/';

  return (
    <div className={`min-h-screen ${isLandingPage ? '' : 'bg-neutral-100 dark:bg-secondary-900'}`}>
      {/* Only show the main navbar for authenticated users or non-landing pages */}
      {!isLandingPage && <Navbar onMenuClick={() => setSidebarOpen(true)} />}
      
      <div className="flex">
        {isAuthenticated && !isLandingPage && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        <main className={`flex-1 transition-all duration-300 ${
          isAuthenticated && !isLandingPage
            ? isMobile 
              ? 'ml-0' 
              : isTablet 
                ? 'ml-0 lg:ml-72' 
                : 'ml-0 lg:ml-72' 
            : 'ml-0'
        } ${isLandingPage ? '' : 'pt-16'}`}>
          {isLandingPage ? (
            <Outlet />
          ) : (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          )}
        </main>
      </div>
      
      {/* Mobile Navigation - only show on mobile and when authenticated, but not on landing page */}
      {isMobile && isAuthenticated && !isLandingPage && <MobileNavigation />}
      
      {/* Notification Toast Container */}
      {isAuthenticated && !isLandingPage && <NotificationToastContainer />}
    </div>
  );
};

export default Layout; 