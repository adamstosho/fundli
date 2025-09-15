const User = require('../models/User');
const Loan = require('../models/Loan');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class CreditScoreService {
  constructor() {
    this.baseScore = 0; // Starting credit score
    this.maxScore = 850; // Maximum credit score
    this.minScore = 0; // Minimum credit score
  }

  /**
   * Calculate credit score for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} Calculated credit score
   */
  async calculateCreditScore(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let score = this.baseScore;

      // Get user's loan history
      const loans = await Loan.find({ borrowerId: userId });
      
      // Get user's transaction history
      const transactions = await Transaction.find({
        $or: [
          { sender: userId },
          { recipient: userId }
        ],
        status: 'completed'
      });

      // Factor 1: KYC Verification (20 points)
      if (user.kycVerified) {
        score += 20;
      }

      // Factor 2: Account Age (up to 30 points)
      const accountAgeInMonths = this.getAccountAgeInMonths(user.createdAt);
      score += Math.min(30, accountAgeInMonths * 2);

      // Factor 3: Payment History (up to 200 points)
      const paymentHistoryScore = await this.calculatePaymentHistoryScore(loans);
      score += paymentHistoryScore;

      // Factor 4: Loan Completion Rate (up to 100 points)
      const completionRateScore = this.calculateCompletionRateScore(loans);
      score += completionRateScore;

      // Factor 5: Credit Utilization (up to 50 points)
      const utilizationScore = this.calculateUtilizationScore(loans);
      score += utilizationScore;

      // Factor 6: Transaction Volume (up to 50 points)
      const transactionVolumeScore = this.calculateTransactionVolumeScore(transactions);
      score += transactionVolumeScore;

      // Factor 7: Recent Activity (up to 30 points)
      const recentActivityScore = this.calculateRecentActivityScore(loans, transactions);
      score += recentActivityScore;

      // Factor 8: Default History (penalty)
      const defaultPenalty = this.calculateDefaultPenalty(loans);
      score -= defaultPenalty;

      // Factor 9: Late Payment Penalty
      const latePaymentPenalty = this.calculateLatePaymentPenalty(loans);
      score -= latePaymentPenalty;

      // Factor 10: Referral Bonus (up to 20 points)
      const referralBonus = await this.calculateReferralBonus(userId);
      score += referralBonus;

      // Ensure score is within bounds
      score = Math.max(this.minScore, Math.min(this.maxScore, score));

      logger.info('Credit score calculated', {
        userId,
        score,
        factors: {
          kycVerified: user.kycVerified,
          accountAge: accountAgeInMonths,
          paymentHistory: paymentHistoryScore,
          completionRate: completionRateScore,
          utilization: utilizationScore,
          transactionVolume: transactionVolumeScore,
          recentActivity: recentActivityScore,
          defaultPenalty,
          latePaymentPenalty,
          referralBonus
        }
      });

      return Math.round(score);
    } catch (error) {
      logger.error('Failed to calculate credit score', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Update user's credit score
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  async updateCreditScore(userId) {
    try {
      const newScore = await this.calculateCreditScore(userId);
      
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          creditScore: newScore,
          creditScoreUpdatedAt: new Date()
        },
        { new: true }
      );

      logger.info('Credit score updated', {
        userId,
        oldScore: user.creditScore,
        newScore,
        updatedAt: user.creditScoreUpdatedAt
      });

      return {
        success: true,
        userId,
        creditScore: newScore,
        updatedAt: user.creditScoreUpdatedAt
      };
    } catch (error) {
      logger.error('Failed to update credit score', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get credit score history for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Credit score history
   */
  async getCreditScoreHistory(userId) {
    try {
      // For now, we'll return the current score
      // In a production system, you'd store historical scores
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return [{
        score: user.creditScore,
        date: user.creditScoreUpdatedAt || user.createdAt,
        factors: await this.getCreditScoreFactors(userId)
      }];
    } catch (error) {
      logger.error('Failed to get credit score history', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Get detailed credit score factors
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Credit score factors
   */
  async getCreditScoreFactors(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const loans = await Loan.find({ borrowerId: userId });
      const transactions = await Transaction.find({
        $or: [
          { sender: userId },
          { recipient: userId }
        ],
        status: 'completed'
      });

      return {
        kycVerification: {
          verified: user.kycVerified,
          points: user.kycVerified ? 20 : 0,
          maxPoints: 20
        },
        accountAge: {
          months: this.getAccountAgeInMonths(user.createdAt),
          points: Math.min(30, this.getAccountAgeInMonths(user.createdAt) * 2),
          maxPoints: 30
        },
        paymentHistory: {
          score: await this.calculatePaymentHistoryScore(loans),
          maxPoints: 200,
          details: await this.getPaymentHistoryDetails(loans)
        },
        completionRate: {
          rate: this.getCompletionRate(loans),
          points: this.calculateCompletionRateScore(loans),
          maxPoints: 100
        },
        creditUtilization: {
          rate: this.getUtilizationRate(loans),
          points: this.calculateUtilizationScore(loans),
          maxPoints: 50
        },
        transactionVolume: {
          count: transactions.length,
          points: this.calculateTransactionVolumeScore(transactions),
          maxPoints: 50
        },
        recentActivity: {
          score: this.calculateRecentActivityScore(loans, transactions),
          maxPoints: 30
        },
        penalties: {
          defaults: this.calculateDefaultPenalty(loans),
          latePayments: this.calculateLatePaymentPenalty(loans)
        },
        bonuses: {
          referrals: await this.calculateReferralBonus(userId)
        }
      };
    } catch (error) {
      logger.error('Failed to get credit score factors', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  /**
   * Calculate payment history score
   * @param {Array} loans - User's loans
   * @returns {Promise<number>} Payment history score
   */
  async calculatePaymentHistoryScore(loans) {
    if (loans.length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    for (const loan of loans) {
      if (loan.repayments && loan.repayments.length > 0) {
        const onTimePayments = loan.repayments.filter(repayment => 
          repayment.status === 'paid' && 
          repayment.paidAt <= repayment.dueDate
        ).length;

        const totalPayments = loan.repayments.length;
        const onTimeRate = totalPayments > 0 ? onTimePayments / totalPayments : 0;
        
        // Weight by loan amount (larger loans have more impact)
        const weight = loan.loanAmount / 10000; // Normalize by 10k
        totalScore += onTimeRate * 200 * weight;
        totalWeight += weight;
      }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  }

  /**
   * Calculate completion rate score
   * @param {Array} loans - User's loans
   * @returns {number} Completion rate score
   */
  calculateCompletionRateScore(loans) {
    if (loans.length === 0) return 0;

    const completedLoans = loans.filter(loan => loan.status === 'completed').length;
    const completionRate = completedLoans / loans.length;
    
    return Math.round(completionRate * 100);
  }

  /**
   * Calculate utilization score
   * @param {Array} loans - User's loans
   * @returns {number} Utilization score
   */
  calculateUtilizationScore(loans) {
    if (loans.length === 0) return 0;

    const totalBorrowed = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const activeLoans = loans.filter(loan => loan.status === 'active').length;
    
    // Lower utilization is better (fewer active loans)
    const utilizationRate = activeLoans / loans.length;
    return Math.round((1 - utilizationRate) * 50);
  }

  /**
   * Calculate transaction volume score
   * @param {Array} transactions - User's transactions
   * @returns {number} Transaction volume score
   */
  calculateTransactionVolumeScore(transactions) {
    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    );

    // More transactions = higher score (up to a point)
    return Math.min(50, recentTransactions.length * 2);
  }

  /**
   * Calculate recent activity score
   * @param {Array} loans - User's loans
   * @param {Array} transactions - User's transactions
   * @returns {number} Recent activity score
   */
  calculateRecentActivityScore(loans, transactions) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentLoans = loans.filter(loan => 
      new Date(loan.createdAt) > thirtyDaysAgo
    ).length;

    const recentTransactions = transactions.filter(t => 
      new Date(t.createdAt) > thirtyDaysAgo
    ).length;

    // Activity score based on recent loans and transactions
    return Math.min(30, (recentLoans * 10) + (recentTransactions * 1));
  }

  /**
   * Calculate default penalty
   * @param {Array} loans - User's loans
   * @returns {number} Default penalty
   */
  calculateDefaultPenalty(loans) {
    const defaultedLoans = loans.filter(loan => loan.status === 'defaulted').length;
    return defaultedLoans * 100; // 100 points penalty per default
  }

  /**
   * Calculate late payment penalty
   * @param {Array} loans - User's loans
   * @returns {number} Late payment penalty
   */
  calculateLatePaymentPenalty(loans) {
    let totalPenalty = 0;

    for (const loan of loans) {
      if (loan.repayments) {
        const latePayments = loan.repayments.filter(repayment => 
          repayment.status === 'paid' && 
          repayment.paidAt > repayment.dueDate
        ).length;

        totalPenalty += latePayments * 10; // 10 points penalty per late payment
      }
    }

    return totalPenalty;
  }

  /**
   * Calculate referral bonus
   * @param {string} userId - User ID
   * @returns {Promise<number>} Referral bonus
   */
  async calculateReferralBonus(userId) {
    try {
      const Referral = require('../models/Referral');
      const referrals = await Referral.find({ referrerId: userId });
      
      const successfulReferrals = referrals.filter(ref => 
        ref.status === 'completed' && ref.rewardEarned
      ).length;

      return Math.min(20, successfulReferrals * 5); // 5 points per successful referral, max 20
    } catch (error) {
      logger.error('Failed to calculate referral bonus', { error: error.message, userId });
      return 0;
    }
  }

  /**
   * Get account age in months
   * @param {Date} createdAt - Account creation date
   * @returns {number} Account age in months
   */
  getAccountAgeInMonths(createdAt) {
    const now = new Date();
    const diffTime = now - createdAt;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); // Approximate months
  }

  /**
   * Get completion rate
   * @param {Array} loans - User's loans
   * @returns {number} Completion rate
   */
  getCompletionRate(loans) {
    if (loans.length === 0) return 0;
    const completedLoans = loans.filter(loan => loan.status === 'completed').length;
    return completedLoans / loans.length;
  }

  /**
   * Get utilization rate
   * @param {Array} loans - User's loans
   * @returns {number} Utilization rate
   */
  getUtilizationRate(loans) {
    if (loans.length === 0) return 0;
    const activeLoans = loans.filter(loan => loan.status === 'active').length;
    return activeLoans / loans.length;
  }

  /**
   * Get payment history details
   * @param {Array} loans - User's loans
   * @returns {Promise<Object>} Payment history details
   */
  async getPaymentHistoryDetails(loans) {
    let totalPayments = 0;
    let onTimePayments = 0;
    let latePayments = 0;
    let missedPayments = 0;

    for (const loan of loans) {
      if (loan.repayments) {
        totalPayments += loan.repayments.length;
        
        loan.repayments.forEach(repayment => {
          if (repayment.status === 'paid') {
            if (repayment.paidAt <= repayment.dueDate) {
              onTimePayments++;
            } else {
              latePayments++;
            }
          } else if (repayment.status === 'overdue') {
            missedPayments++;
          }
        });
      }
    }

    return {
      totalPayments,
      onTimePayments,
      latePayments,
      missedPayments,
      onTimeRate: totalPayments > 0 ? onTimePayments / totalPayments : 0
    };
  }

  /**
   * Get credit score range description
   * @param {number} score - Credit score
   * @returns {Object} Score range description
   */
  getScoreRange(score) {
    if (score >= 750) {
      return { range: 'Excellent', color: 'green', description: 'Very low risk' };
    } else if (score >= 700) {
      return { range: 'Good', color: 'blue', description: 'Low risk' };
    } else if (score >= 650) {
      return { range: 'Fair', color: 'yellow', description: 'Medium risk' };
    } else if (score >= 600) {
      return { range: 'Poor', color: 'orange', description: 'High risk' };
    } else {
      return { range: 'Very Poor', color: 'red', description: 'Very high risk' };
    }
  }

  /**
   * Get credit score recommendations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Recommendations
   */
  async getCreditScoreRecommendations(userId) {
    try {
      const factors = await this.getCreditScoreFactors(userId);
      const recommendations = [];

      // KYC recommendations
      if (!factors.kycVerification.verified) {
        recommendations.push({
          type: 'kyc',
          priority: 'high',
          title: 'Complete KYC Verification',
          description: 'Complete your KYC verification to improve your credit score by 20 points.',
          action: 'Complete KYC verification in your profile settings.'
        });
      }

      // Payment history recommendations
      if (factors.paymentHistory.score < 150) {
        recommendations.push({
          type: 'payment_history',
          priority: 'high',
          title: 'Improve Payment History',
          description: 'Make payments on time to improve your credit score significantly.',
          action: 'Set up payment reminders and ensure timely repayments.'
        });
      }

      // Completion rate recommendations
      if (factors.completionRate.rate < 0.8) {
        recommendations.push({
          type: 'completion_rate',
          priority: 'medium',
          title: 'Complete More Loans',
          description: 'Successfully complete more loans to improve your completion rate.',
          action: 'Focus on completing your current loans before applying for new ones.'
        });
      }

      // Utilization recommendations
      if (factors.creditUtilization.rate > 0.5) {
        recommendations.push({
          type: 'utilization',
          priority: 'medium',
          title: 'Reduce Active Loans',
          description: 'Having too many active loans can negatively impact your credit score.',
          action: 'Consider paying off some loans before applying for new ones.'
        });
      }

      // Activity recommendations
      if (factors.transactionVolume.count < 5) {
        recommendations.push({
          type: 'activity',
          priority: 'low',
          title: 'Increase Platform Activity',
          description: 'More platform activity can help improve your credit score.',
          action: 'Engage more with the platform through transactions and referrals.'
        });
      }

      return recommendations;
    } catch (error) {
      logger.error('Failed to get credit score recommendations', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

module.exports = new CreditScoreService();
