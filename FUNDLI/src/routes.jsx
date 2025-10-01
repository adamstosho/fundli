import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import OTPVerification from './pages/auth/OTPVerification';
import KYCUpload from './pages/auth/KYCUpload';
import BorrowerDashboard from './pages/dashboard/BorrowerDashboard';
import LenderDashboard from './pages/dashboard/LenderDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import LoanApplication from './pages/loans/LoanApplication';
import LoanStatus from './pages/loans/LoanStatus';
import RepaymentSchedule from './pages/loans/RepaymentSchedule';
import CreatePool from './pages/marketplace/CreatePool';
import Marketplace from './pages/marketplace/Marketplace';
import PoolDetails from './pages/marketplace/PoolDetails';
import ReferralPage from './pages/referral/ReferralPage';
import Profile from './pages/settings/Profile';
import Settings from './pages/settings/Settings';
import UserManagement from './pages/admin/UserManagement';
import KYCManagement from './pages/admin/KYCManagement';
import LoanManagement from './pages/admin/LoanManagement';
import CollateralManagement from './pages/admin/CollateralManagement';
import LenderKYCManagement from './components/lender/KYCManagement';
import BrowseLoans from './pages/borrower/BrowseLoans';
import MyInvestments from './pages/lender/MyInvestments';
import PaymentPage from './pages/PaymentPage';
import PayBackPage from './pages/loans/PayBackPage';
import WalletPage from './pages/WalletPage';
import DepositPage from './pages/DepositPage';
import TransferPage from './pages/TransferPage';
import WithdrawPage from './pages/WithdrawPage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';
import LivenessCheck from './components/kyc/LivenessCheck';
import AchievementsPage from './pages/achievements/AchievementsPage';
import KYCPage from './pages/kyc/KYCPage';

// 404 Error Component
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Page Not Found</h2>
        <p className="text-neutral-600 mb-6">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'liveness',
        element: <LivenessCheck />
      },
      {
        path: 'register',
        element: <Register />
      },
      {
        path: 'verify-otp',
        element: <OTPVerification />
      },
      {
        path: 'kyc-upload',
        element: <KYCUpload />
      },
      {
        path: 'dashboard',
        children: [
          {
            path: 'borrower',
            element: (
              <ProtectedRoute userType="borrower">
                <BorrowerDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'lender',
            element: (
              <ProtectedRoute userType="lender">
                <LenderDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin',
            element: (
              <ProtectedRoute userType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'loans',
        children: [
          {
            path: 'apply',
            element: (
              <ProtectedRoute userType="borrower">
                <LoanApplication />
              </ProtectedRoute>
            )
          },
          {
            path: 'status',
            element: (
              <ProtectedRoute userType="borrower">
                <LoanStatus />
              </ProtectedRoute>
            )
          },
          {
            path: 'repayment',
            element: (
              <ProtectedRoute userType="borrower">
                <RepaymentSchedule />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'borrower',
        children: [
          {
            path: 'browse-loans',
            element: (
              <ProtectedRoute userType="borrower">
                <BrowseLoans />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'marketplace',
        children: [
          {
            path: 'create-pool',
            element: (
              <ProtectedRoute userType="lender">
                <CreatePool />
              </ProtectedRoute>
            )
          },
          { path: 'browse', element: <Marketplace /> },
          { path: 'pool/:id', element: <PoolDetails /> }
        ]
      },
      {
        path: 'lender',
        children: [
          { path: 'kyc', element: <LenderKYCManagement /> },
          {
            path: 'investments',
            element: (
              <ProtectedRoute userType="lender">
                <MyInvestments />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'wallet',
        element: (
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'deposit',
        element: (
          <ProtectedRoute>
            <DepositPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'transfer',
        element: (
          <ProtectedRoute>
            <TransferPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'withdraw',
        element: (
          <ProtectedRoute>
            <WithdrawPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'chat',
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        )
      },
        {
          path: 'achievements',
          element: (
            <ProtectedRoute>
              <AchievementsPage />
            </ProtectedRoute>
          )
        },
        {
          path: 'kyc',
          element: (
            <ProtectedRoute>
              <KYCPage />
            </ProtectedRoute>
          )
        },
      {
        path: 'payment/:loanId',
        element: (
          <ProtectedRoute userType="lender">
            <PaymentPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'payback/:loanId',
        element: (
          <ProtectedRoute userType="borrower">
            <PayBackPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'referral',
        element: (
          <ProtectedRoute>
            <ReferralPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        children: [
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )
          },
          {
            path: '',
            element: (
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: 'admin',
        children: [
          {
            path: 'users',
            element: (
              <ProtectedRoute userType="admin">
                <UserManagement />
              </ProtectedRoute>
            )
          },
          {
            path: 'kyc',
            element: (
              <ProtectedRoute userType="admin">
                <KYCManagement />
              </ProtectedRoute>
            )
          },
          {
            path: 'loans',
            element: (
              <ProtectedRoute userType="admin">
                <LoanManagement />
              </ProtectedRoute>
            )
          },
          {
            path: 'collateral',
            element: (
              <ProtectedRoute userType="admin">
                <CollateralManagement />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]); 