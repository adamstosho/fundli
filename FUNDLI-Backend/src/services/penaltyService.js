const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const NotificationService = require('./notificationService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class PenaltyService {
  constructor() {
    this.penaltyRate = 0.5; // 0.5% per day
    this.gracePeriodHours = 24; // 24 hours grace period
  }

  /**
   * Calculate penalty charges for overdue loans
   * @returns {Promise<Object>} Processing result
   */
  async calculatePenaltyCharges() {
    try {
      const now = new Date();
      const gracePeriodEnd = new Date(now.getTime() - (this.gracePeriodHours * 60 * 60 * 1000));
      
      // Find loans with overdue payments that are past grace period
      const overdueLoans = await Loan.find({
        status: 'active',
        'repayments.status': 'overdue',
        'repayments.dueDate': { $lt: gracePeriodEnd }
      }).populate('borrower', 'email firstName lastName');

      logger.info('Calculating penalty charges', {
        count: overdueLoans.length,
        gracePeriodEnd: gracePeriodEnd,
        penaltyRate: this.penaltyRate
      });

      const results = {
        processed: 0,
        penaltiesApplied: 0,
        totalPenaltyAmount: 0,
        errors: []
      };

      for (const loan of overdueLoans) {
        try {
          const penaltyResult = await this.calculateLoanPenalties(loan, now);
          
          if (penaltyResult.penaltyApplied) {
            results.penaltiesApplied++;
            results.totalPenaltyAmount += penaltyResult.penaltyAmount;
          }
          
          results.processed++;
        } catch (error) {
          results.errors.push({
            loanId: loan._id,
            error: error.message
          });
          
          logger.error('Error calculating penalties for loan', {
            loanId: loan._id,
            error: error.message
          });
        }
      }

      logger.info('Penalty calculation completed', results);
      return results;
    } catch (error) {
      logger.error('Failed to calculate penalty charges', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate penalties for a specific loan
   * @param {Object} loan - Loan object
   * @param {Date} currentDate - Current date
   * @returns {Promise<Object>} Penalty result
   */
  async calculateLoanPenalties(loan, currentDate = new Date()) {
    try {
      const gracePeriodEnd = new Date(currentDate.getTime() - (this.gracePeriodHours * 60 * 60 * 1000));
      let totalPenaltyAmount = 0;
      let penaltiesApplied = false;

      // Find overdue repayments that are past grace period
      const overdueRepayments = loan.repayments.filter(repayment => 
        repayment.status === 'overdue' && 
        repayment.dueDate < gracePeriodEnd
      );

      for (const repayment of overdueRepayments) {
        const penaltyResult = await this.calculateRepaymentPenalty(repayment, loan, currentDate);
        
        if (penaltyResult.penaltyAmount > 0) {
          totalPenaltyAmount += penaltyResult.penaltyAmount;
          penaltiesApplied = true;
          
          // Update repayment with new penalty
          repayment.penaltyCharges = penaltyResult.totalPenaltyCharges;
          repayment.lastPenaltyCalculation = currentDate;
          
          if (!repayment.penaltyStartDate) {
            repayment.penaltyStartDate = new Date(repayment.dueDate.getTime() + (this.gracePeriodHours * 60 * 60 * 1000));
          }
        }
      }

      if (penaltiesApplied) {
        // Update loan total penalty charges
        loan.totalPenaltyCharges = loan.repayments.reduce((total, repayment) => 
          total + (repayment.penaltyCharges || 0), 0
        );

        // Update amount remaining to include penalties
        loan.amountRemaining = loan.totalRepayment + loan.totalPenaltyCharges - loan.amountPaid;

        await loan.save();

        // Send penalty notification to borrower
        await this.sendPenaltyNotification(loan, totalPenaltyAmount);

        logger.info('Penalties calculated for loan', {
          loanId: loan._id,
          totalPenaltyAmount,
          overdueRepayments: overdueRepayments.length
        });
      }

      return {
        penaltyApplied: penaltiesApplied,
        penaltyAmount: totalPenaltyAmount,
        overdueRepayments: overdueRepayments.length
      };
    } catch (error) {
      logger.error('Failed to calculate loan penalties', {
        loanId: loan._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate penalty for a specific repayment
   * @param {Object} repayment - Repayment object
   * @param {Object} loan - Loan object
   * @param {Date} currentDate - Current date
   * @returns {Promise<Object>} Penalty calculation result
   */
  async calculateRepaymentPenalty(repayment, loan, currentDate = new Date()) {
    try {
      const gracePeriodEnd = new Date(repayment.dueDate.getTime() + (this.gracePeriodHours * 60 * 60 * 1000));
      
      // If current date is before grace period ends, no penalty
      if (currentDate <= gracePeriodEnd) {
        return {
          penaltyAmount: 0,
          totalPenaltyCharges: repayment.penaltyCharges || 0,
          daysOverdue: 0
        };
      }

      // Calculate days overdue (excluding grace period)
      const daysOverdue = Math.floor((currentDate - gracePeriodEnd) / (1000 * 60 * 60 * 24));
      
      // Calculate penalty amount (0.5% of loan amount per day)
      const dailyPenaltyAmount = (loan.loanAmount * this.penaltyRate) / 100;
      const newPenaltyAmount = dailyPenaltyAmount * daysOverdue;
      
      // Get existing penalty charges
      const existingPenaltyCharges = repayment.penaltyCharges || 0;
      
      // Calculate additional penalty since last calculation
      const lastCalculation = repayment.lastPenaltyCalculation || gracePeriodEnd;
      const daysSinceLastCalculation = Math.floor((currentDate - lastCalculation) / (1000 * 60 * 60 * 24));
      const additionalPenalty = dailyPenaltyAmount * daysSinceLastCalculation;
      
      const totalPenaltyCharges = existingPenaltyCharges + additionalPenalty;

      return {
        penaltyAmount: additionalPenalty,
        totalPenaltyCharges: totalPenaltyCharges,
        daysOverdue: daysOverdue,
        dailyPenaltyAmount: dailyPenaltyAmount
      };
    } catch (error) {
      logger.error('Failed to calculate repayment penalty', {
        repaymentId: repayment._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send penalty notification to borrower
   * @param {Object} loan - Loan object
   * @param {number} penaltyAmount - Penalty amount
   */
  async sendPenaltyNotification(loan, penaltyAmount) {
    try {
      const borrower = await User.findById(loan.borrower);
      if (!borrower) {
        throw new Error('Borrower not found');
      }

      // Send email notification
      await emailService.sendEmail({
        to: borrower.email,
        subject: 'Penalty Charges Applied - Fundli',
        text: `Penalty charges of ₦${penaltyAmount} have been applied to your loan due to late payment.`,
        html: this.generatePenaltyNotificationHTML(
          borrower.firstName,
          penaltyAmount,
          loan.loanAmount,
          loan.totalPenaltyCharges
        )
      });

      // Send in-app notification
      await NotificationService.notifyPenaltyApplied({
        borrowerId: borrower._id,
        borrowerName: `${borrower.firstName} ${borrower.lastName}`,
        loanId: loan._id,
        penaltyAmount: penaltyAmount,
        totalPenaltyCharges: loan.totalPenaltyCharges,
        loanAmount: loan.loanAmount
      });

      logger.info('Penalty notification sent', {
        loanId: loan._id,
        borrowerId: borrower._id,
        penaltyAmount
      });
    } catch (error) {
      logger.error('Failed to send penalty notification', {
        loanId: loan._id,
        error: error.message
      });
    }
  }

  /**
   * Get penalty summary for a loan
   * @param {string} loanId - Loan ID
   * @returns {Promise<Object>} Penalty summary
   */
  async getPenaltySummary(loanId) {
    try {
      const loan = await Loan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      const now = new Date();
      const gracePeriodEnd = new Date(now.getTime() - (this.gracePeriodHours * 60 * 60 * 1000));
      
      const overdueRepayments = loan.repayments.filter(repayment => 
        repayment.status === 'overdue' && 
        repayment.dueDate < gracePeriodEnd
      );

      let totalCurrentPenalties = 0;
      let dailyPenaltyAmount = 0;

      if (overdueRepayments.length > 0) {
        dailyPenaltyAmount = (loan.loanAmount * this.penaltyRate) / 100;
        
        for (const repayment of overdueRepayments) {
          const penaltyResult = await this.calculateRepaymentPenalty(repayment, loan, now);
          totalCurrentPenalties += penaltyResult.penaltyAmount;
        }
      }

      return {
        loanId: loan._id,
        totalPenaltyCharges: loan.totalPenaltyCharges || 0,
        currentPenaltyAmount: totalCurrentPenalties,
        dailyPenaltyAmount: dailyPenaltyAmount,
        penaltyRate: this.penaltyRate,
        gracePeriodHours: this.gracePeriodHours,
        overdueRepayments: overdueRepayments.length,
        nextPenaltyCalculation: new Date(now.getTime() + (24 * 60 * 60 * 1000)) // Next day
      };
    } catch (error) {
      logger.error('Failed to get penalty summary', {
        loanId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate penalty notification email HTML
   */
  generatePenaltyNotificationHTML(name, penaltyAmount, loanAmount, totalPenaltyCharges) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Penalty Charges Applied - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .penalty-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Penalty Charges Applied</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Penalty charges have been applied to your loan due to late payment.</p>
            <div class="penalty-details">
              <div class="detail-row">
                <span>Loan Amount:</span>
                <strong>₦${loanAmount}</strong>
              </div>
              <div class="detail-row">
                <span>New Penalty Applied:</span>
                <strong>₦${penaltyAmount}</strong>
              </div>
              <div class="detail-row">
                <span>Total Penalty Charges:</span>
                <strong>₦${totalPenaltyCharges}</strong>
              </div>
              <div class="detail-row">
                <span>Penalty Rate:</span>
                <strong>0.5% per day</strong>
              </div>
            </div>
            <div class="warning-box">
              <p><strong>Important:</strong> Penalty charges will continue to accrue daily until your loan is fully repaid. Please make your payment as soon as possible to avoid additional charges.</p>
            </div>
            <p>You can make your payment through your dashboard or contact support if you need assistance.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>Fundli Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Update penalty calculation for all active loans
   * @returns {Promise<Object>} Update result
   */
  async updateAllPenaltyCalculations() {
    try {
      const now = new Date();
      const gracePeriodEnd = new Date(now.getTime() - (this.gracePeriodHours * 60 * 60 * 1000));
      
      // Find all active loans with overdue payments
      const activeLoans = await Loan.find({
        status: 'active',
        'repayments.status': 'overdue',
        'repayments.dueDate': { $lt: gracePeriodEnd }
      });

      logger.info('Updating penalty calculations for all active loans', {
        count: activeLoans.length
      });

      const results = {
        processed: 0,
        updated: 0,
        totalPenaltyAmount: 0,
        errors: []
      };

      for (const loan of activeLoans) {
        try {
          const penaltyResult = await this.calculateLoanPenalties(loan, now);
          
          if (penaltyResult.penaltyApplied) {
            results.updated++;
            results.totalPenaltyAmount += penaltyResult.penaltyAmount;
          }
          
          results.processed++;
        } catch (error) {
          results.errors.push({
            loanId: loan._id,
            error: error.message
          });
        }
      }

      logger.info('Penalty calculations updated for all loans', results);
      return results;
    } catch (error) {
      logger.error('Failed to update penalty calculations', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = new PenaltyService();
