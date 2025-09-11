import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import { useAuth } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isMobile } = useResponsive();

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-secondary-900">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex">
        {isAuthenticated && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''} pt-16`}>
          <div className="container-responsive py-6">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation - only show on mobile and when authenticated */}
      {isMobile && isAuthenticated && <MobileNavigation />}
    </div>
  );
};

export default Layout; 