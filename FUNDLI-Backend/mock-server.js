const express = require('express');
const cors = require('cors');
const mockDB = require('./src/utils/mockDB');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Simple JWT-like token system for testing
const tokens = new Map();

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }
  
  const user = tokens.get(token);
  if (!user) {
    return res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
  
  req.user = user;
  next();
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server is running' });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password, userType, phoneNumber } = req.body;
  
  // Check if user already exists
  const existingUser = mockDB.findUser({ email });
  if (existingUser) {
    return res.status(400).json({
      status: 'error',
      message: 'User with this email already exists'
    });
  }
  
  const user = mockDB.createUser({
    firstName,
    lastName,
    email,
    password, // In real app, this would be hashed
    userType,
    phoneNumber
  });
  
  const token = `token_${Date.now()}_${user._id}`;
  tokens.set(token, user);
  
  res.json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType
      },
      token
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = mockDB.findUser({ email, password });
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid credentials'
    });
  }
  
  const token = `token_${Date.now()}_${user._id}`;
  tokens.set(token, user);
  
  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType
      },
      token
    }
  });
});

// Loan routes
app.post('/api/loans/apply', authenticate, (req, res) => {
  const { amount, purpose, duration, repaymentSchedule, description, collateral } = req.body;
  
  const loan = mockDB.createLoan({
    borrower: req.user.id,
    loanAmount: amount,
    purpose,
    purposeDescription: description,
    duration,
    interestRate: 8.5, // Default rate
    repaymentSchedule,
    monthlyPayment: Math.round((amount * 1.085) / duration * 100) / 100,
    totalRepayment: Math.round(amount * 1.085 * 100) / 100,
    totalInterest: Math.round(amount * 0.085 * 100) / 100,
    amountRemaining: Math.round(amount * 1.085 * 100) / 100,
    collateral: collateral || null,
    status: 'pending',
    kycStatus: 'pending',
    submittedAt: new Date(),
    fundingProgress: {
      fundedAmount: 0,
      investors: [],
      targetAmount: amount
    }
  });
  
  res.json({
    status: 'success',
    message: 'Loan application submitted successfully',
    data: {
      loanId: loan._id,
      status: loan.status,
      submittedAt: loan.submittedAt
    }
  });
});

// Lender routes
app.get('/api/lender/loan-applications', authenticate, (req, res) => {
  if (req.user.userType !== 'lender') {
    return res.status(403).json({
      status: 'error',
      message: 'Only lenders can view loan applications'
    });
  }
  
  const allLoans = mockDB.findLoans();
  
  // Format loan applications with borrower info
  const loanApplications = allLoans.map(loan => {
    const borrower = mockDB.findUserById(loan.borrower);
    return {
      id: loan._id,
      loanAmount: loan.loanAmount,
      purpose: loan.purpose,
      duration: loan.duration,
      collateral: loan.collateral,
      status: loan.status,
      kycStatus: loan.kycStatus,
      createdAt: loan.createdAt,
      fundingProgress: loan.fundingProgress,
      borrower: {
        id: borrower._id,
        name: `${borrower.firstName} ${borrower.lastName}`,
        email: borrower.email,
        kycStatus: borrower.kycStatus || 'pending',
        kycVerified: borrower.kycVerified || false,
        hasKycData: !!borrower.kycData?.submittedAt
      }
    };
  });
  
  res.json({
    status: 'success',
    data: {
      loanApplications,
      total: loanApplications.length,
      pendingKyc: loanApplications.filter(loan => loan.kycStatus === 'pending').length,
      approvedKyc: loanApplications.filter(loan => loan.kycStatus === 'verified').length
    }
  });
});

app.post('/api/lender/loan/:id/invest', authenticate, (req, res) => {
  if (req.user.userType !== 'lender') {
    return res.status(403).json({
      status: 'error',
      message: 'Only lenders can invest in loans'
    });
  }
  
  const { investmentAmount, notes } = req.body;
  const loanId = req.params.id;
  
  const loan = mockDB.findLoanById(loanId);
  if (!loan) {
    return res.status(404).json({
      status: 'error',
      message: 'Loan application not found'
    });
  }
  
  if (loan.status !== 'pending' && loan.status !== 'approved') {
    return res.status(400).json({
      status: 'error',
      message: 'This loan is no longer available for investment'
    });
  }
  
  // Add investment
  const newInvestment = {
    user: req.user.id,
    amount: parseFloat(investmentAmount),
    investedAt: new Date(),
    notes: notes || ''
  };
  
  loan.fundingProgress.investors.push(newInvestment);
  loan.fundingProgress.fundedAmount += parseFloat(investmentAmount);
  
  // Check if fully funded
  if (loan.fundingProgress.fundedAmount >= loan.fundingProgress.targetAmount) {
    loan.status = 'funded';
  } else {
    loan.status = 'approved';
  }
  
  mockDB.updateLoan(loanId, loan);
  
  res.json({
    status: 'success',
    message: `Successfully invested $${investmentAmount.toLocaleString()} in loan application`,
    data: {
      loan: {
        id: loan._id,
        status: loan.status,
        totalInvested: loan.fundingProgress.fundedAmount,
        remainingAmount: loan.loanAmount - loan.fundingProgress.fundedAmount
      },
      investment: newInvestment
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Fundli Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: development`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n📝 Available endpoints:`);
  console.log(`  POST /api/auth/register`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/loans/apply`);
  console.log(`  GET  /api/lender/loan-applications`);
  console.log(`  POST /api/lender/loan/:id/invest`);
});
