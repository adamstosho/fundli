// Simple in-memory database for testing
const loans = [];
const users = [];

// Mock database functions
const mockDB = {
  // Loan operations
  createLoan: (loanData) => {
    const loan = {
      _id: Date.now().toString(),
      ...loanData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    loans.push(loan);
    return loan;
  },
  
  findLoans: (filter = {}) => {
    return loans.filter(loan => {
      for (const key in filter) {
        if (loan[key] !== filter[key]) return false;
      }
      return true;
    });
  },
  
  findLoanById: (id) => {
    return loans.find(loan => loan._id === id);
  },
  
  updateLoan: (id, updateData) => {
    const index = loans.findIndex(loan => loan._id === id);
    if (index !== -1) {
      loans[index] = { ...loans[index], ...updateData, updatedAt: new Date() };
      return loans[index];
    }
    return null;
  },
  
  // User operations
  createUser: (userData) => {
    const user = {
      _id: Date.now().toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(user);
    return user;
  },
  
  findUser: (filter) => {
    return users.find(user => {
      for (const key in filter) {
        if (user[key] !== filter[key]) return false;
      }
      return true;
    });
  },
  
  findUserById: (id) => {
    return users.find(user => user._id === id);
  }
};

module.exports = mockDB;
