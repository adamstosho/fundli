const { Matrix } = require('ml-matrix');
const ss = require('simple-statistics');
const User = require('../models/User');
const Loan = require('../models/Loan');
const LendingPool = require('../models/LendingPool');
const logger = require('../utils/logger');

class AdvancedMatchingService {
  constructor() {
    this.weights = {
      creditScore: 0.25,
      riskScore: 0.20,
      loanAmount: 0.15,
      interestRate: 0.15,
      duration: 0.10,
      kycStatus: 0.10,
      repaymentHistory: 0.05
    };
  }

  /**
   * Calculate risk score for a borrower
   * @param {Object} borrower - Borrower data
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(borrower) {
    try {
      let riskScore = 50; // Base risk score

      // Credit score factor
      if (borrower.creditScore >= 750) {
        riskScore -= 20;
      } else if (borrower.creditScore >= 650) {
        riskScore -= 10;
      } else if (borrower.creditScore < 500) {
        riskScore += 30;
      }

      // KYC status factor
      if (borrower.kycStatus === 'verified') {
        riskScore -= 15;
      } else if (borrower.kycStatus === 'pending') {
        riskScore += 5;
      } else {
        riskScore += 20;
      }

      // Employment status factor
      const employmentRisk = {
        'employed': -10,
        'self-employed': 0,
        'freelancer': 5,
        'student': 10,
        'unemployed': 25,
        'retired': -5
      };
      riskScore += employmentRisk[borrower.employmentStatus] || 10;

      // Income stability factor
      if (borrower.monthlyIncome > 100000) {
        riskScore -= 10;
      } else if (borrower.monthlyIncome < 30000) {
        riskScore += 15;
      }

      // Previous loan history
      if (borrower.previousLoans && borrower.previousLoans.length > 0) {
        const defaultRate = borrower.previousLoans.filter(loan => loan.status === 'defaulted').length / borrower.previousLoans.length;
        riskScore += defaultRate * 30;
      }

      // Collateral factor
      if (borrower.hasCollateral) {
        riskScore -= 10;
      }

      return Math.max(0, Math.min(100, riskScore));
    } catch (error) {
      logger.error('Error calculating risk score', { error: error.message, borrowerId: borrower._id });
      return 50; // Default risk score
    }
  }

  /**
   * Calculate compatibility score between borrower and lender
   * @param {Object} borrower - Borrower data
   * @param {Object} lender - Lender data
   * @param {Object} loan - Loan data
   * @returns {number} Compatibility score (0-100)
   */
  calculateCompatibilityScore(borrower, lender, loan) {
    try {
      let score = 0;

      // Risk tolerance matching
      const borrowerRisk = this.calculateRiskScore(borrower);
      const lenderRiskTolerance = lender.riskTolerance || 50;
      const riskDifference = Math.abs(borrowerRisk - lenderRiskTolerance);
      score += Math.max(0, 20 - riskDifference * 0.2);

      // Amount matching
      const lenderMaxAmount = lender.maxLoanAmount || 1000000;
      const loanAmount = loan.amount;
      if (loanAmount <= lenderMaxAmount) {
        score += 15;
      } else {
        score += Math.max(0, 15 - (loanAmount - lenderMaxAmount) / 100000);
      }

      // Interest rate matching
      const lenderMinRate = lender.minInterestRate || 5;
      const lenderMaxRate = lender.maxInterestRate || 30;
      const proposedRate = loan.proposedInterestRate || 15;
      
      if (proposedRate >= lenderMinRate && proposedRate <= lenderMaxRate) {
        score += 15;
      } else {
        score += Math.max(0, 15 - Math.abs(proposedRate - (lenderMinRate + lenderMaxRate) / 2) * 0.5);
      }

      // Duration matching
      const lenderMaxDuration = lender.maxLoanDuration || 24;
      const loanDuration = loan.duration;
      if (loanDuration <= lenderMaxDuration) {
        score += 10;
      } else {
        score += Math.max(0, 10 - (loanDuration - lenderMaxDuration) * 0.5);
      }

      // Credit score matching
      const lenderMinCreditScore = lender.minCreditScore || 500;
      if (borrower.creditScore >= lenderMinCreditScore) {
        score += 15;
      } else {
        score += Math.max(0, 15 - (lenderMinCreditScore - borrower.creditScore) * 0.1);
      }

      // KYC status matching
      if (borrower.kycStatus === 'verified') {
        score += 10;
      } else if (borrower.kycStatus === 'pending') {
        score += 5;
      }

      // Geographic preference (if available)
      if (lender.preferredLocations && lender.preferredLocations.includes(borrower.location)) {
        score += 5;
      }

      // Loan purpose matching
      if (lender.preferredLoanPurposes && lender.preferredLoanPurposes.includes(loan.purpose)) {
        score += 5;
      }

      return Math.min(100, Math.max(0, score));
    } catch (error) {
      logger.error('Error calculating compatibility score', { 
        error: error.message, 
        borrowerId: borrower._id, 
        lenderId: lender._id 
      });
      return 0;
    }
  }

  /**
   * Find best matches for a loan application
   * @param {string} loanId - Loan ID
   * @param {number} limit - Maximum number of matches
   * @returns {Promise<Array>} Array of matched lenders with scores
   */
  async findLoanMatches(loanId, limit = 10) {
    try {
      const loan = await Loan.findById(loanId).populate('borrowerId');
      if (!loan) {
        throw new Error('Loan not found');
      }

      const borrower = loan.borrowerId;
      if (!borrower) {
        throw new Error('Borrower not found');
      }

      // Get all active lenders
      const lenders = await User.find({ 
        userType: 'lender', 
        isActive: true,
        kycStatus: { $in: ['verified', 'pending'] }
      });

      if (lenders.length === 0) {
        return [];
      }

      // Calculate compatibility scores
      const matches = [];
      for (const lender of lenders) {
        const compatibilityScore = this.calculateCompatibilityScore(borrower, lender, loan);
        
        if (compatibilityScore >= 30) { // Minimum threshold
          matches.push({
            lenderId: lender._id,
            lender: {
              firstName: lender.firstName,
              lastName: lender.lastName,
              email: lender.email,
              riskTolerance: lender.riskTolerance,
              maxLoanAmount: lender.maxLoanAmount,
              minInterestRate: lender.minInterestRate,
              maxInterestRate: lender.maxInterestRate,
              maxLoanDuration: lender.maxLoanDuration,
              minCreditScore: lender.minCreditScore
            },
            compatibilityScore,
            riskScore: this.calculateRiskScore(borrower),
            recommendedInterestRate: this.calculateRecommendedInterestRate(borrower, lender, loan),
            matchReasons: this.getMatchReasons(borrower, lender, loan, compatibilityScore)
          });
        }
      }

      // Sort by compatibility score and return top matches
      return matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding loan matches', { 
        error: error.message, 
        loanId 
      });
      throw error;
    }
  }

  /**
   * Find best loans for a lender
   * @param {string} lenderId - Lender ID
   * @param {number} limit - Maximum number of matches
   * @returns {Promise<Array>} Array of matched loans with scores
   */
  async findLenderMatches(lenderId, limit = 10) {
    try {
      const lender = await User.findById(lenderId);
      if (!lender || lender.userType !== 'lender') {
        throw new Error('Lender not found');
      }

      // Get all active loan applications
      const loans = await Loan.find({ 
        status: 'pending',
        borrowerId: { $exists: true }
      }).populate('borrowerId');

      if (loans.length === 0) {
        return [];
      }

      // Calculate compatibility scores
      const matches = [];
      for (const loan of loans) {
        const borrower = loan.borrowerId;
        if (!borrower) continue;

        const compatibilityScore = this.calculateCompatibilityScore(borrower, lender, loan);
        
        if (compatibilityScore >= 30) { // Minimum threshold
          matches.push({
            loanId: loan._id,
            loan: {
              amount: loan.amount,
              purpose: loan.purpose,
              duration: loan.duration,
              proposedInterestRate: loan.proposedInterestRate,
              description: loan.description,
              createdAt: loan.createdAt
            },
            borrower: {
              firstName: borrower.firstName,
              lastName: borrower.lastName,
              creditScore: borrower.creditScore,
              kycStatus: borrower.kycStatus,
              monthlyIncome: borrower.monthlyIncome,
              employmentStatus: borrower.employmentStatus
            },
            compatibilityScore,
            riskScore: this.calculateRiskScore(borrower),
            recommendedInterestRate: this.calculateRecommendedInterestRate(borrower, lender, loan),
            matchReasons: this.getMatchReasons(borrower, lender, loan, compatibilityScore)
          });
        }
      }

      // Sort by compatibility score and return top matches
      return matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding lender matches', { 
        error: error.message, 
        lenderId 
      });
      throw error;
    }
  }

  /**
   * Calculate recommended interest rate
   * @param {Object} borrower - Borrower data
   * @param {Object} lender - Lender data
   * @param {Object} loan - Loan data
   * @returns {number} Recommended interest rate
   */
  calculateRecommendedInterestRate(borrower, lender, loan) {
    try {
      const baseRate = 12; // Base interest rate
      const riskScore = this.calculateRiskScore(borrower);
      const riskAdjustment = (riskScore - 50) * 0.2; // Risk adjustment
      
      const creditScoreAdjustment = (750 - borrower.creditScore) * 0.02; // Credit score adjustment
      
      const amountAdjustment = loan.amount > 500000 ? -1 : 0; // Large loan discount
      
      const durationAdjustment = loan.duration > 12 ? 1 : 0; // Longer duration premium
      
      const recommendedRate = baseRate + riskAdjustment + creditScoreAdjustment + amountAdjustment + durationAdjustment;
      
      return Math.max(5, Math.min(35, recommendedRate)); // Clamp between 5% and 35%
    } catch (error) {
      logger.error('Error calculating recommended interest rate', { error: error.message });
      return 15; // Default rate
    }
  }

  /**
   * Get reasons for match
   * @param {Object} borrower - Borrower data
   * @param {Object} lender - Lender data
   * @param {Object} loan - Loan data
   * @param {number} score - Compatibility score
   * @returns {Array} Array of match reasons
   */
  getMatchReasons(borrower, lender, loan, score) {
    const reasons = [];

    if (borrower.creditScore >= 700) {
      reasons.push('Excellent credit score');
    }

    if (borrower.kycStatus === 'verified') {
      reasons.push('KYC verified');
    }

    if (loan.amount <= (lender.maxLoanAmount || 1000000)) {
      reasons.push('Loan amount within limits');
    }

    if (borrower.monthlyIncome > 100000) {
      reasons.push('High income stability');
    }

    if (borrower.employmentStatus === 'employed') {
      reasons.push('Stable employment');
    }

    if (loan.duration <= (lender.maxLoanDuration || 24)) {
      reasons.push('Preferred loan duration');
    }

    if (score >= 80) {
      reasons.push('High compatibility score');
    }

    return reasons.slice(0, 5); // Return top 5 reasons
  }

  /**
   * Get matching statistics
   * @returns {Promise<Object>} Matching statistics
   */
  async getMatchingStats() {
    try {
      const totalLoans = await Loan.countDocuments({ status: 'pending' });
      const totalLenders = await User.countDocuments({ userType: 'lender', isActive: true });
      const totalBorrowers = await User.countDocuments({ userType: 'borrower', isActive: true });
      
      const avgCreditScore = await User.aggregate([
        { $match: { userType: 'borrower', isActive: true } },
        { $group: { _id: null, avgScore: { $avg: 1 } } }
      ]);

      return {
        totalLoans,
        totalLenders,
        totalBorrowers,
        averageCreditScore: avgCreditScore[0]?.avgScore || 650,
        matchingAlgorithm: 'AI-Powered Compatibility Engine',
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error getting matching stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Update matching weights based on success rates
   * @param {Object} newWeights - New weight configuration
   */
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
    logger.info('Matching weights updated', { newWeights: this.weights });
  }
}

module.exports = new AdvancedMatchingService();
