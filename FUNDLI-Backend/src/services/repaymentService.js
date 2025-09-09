const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const paystackService = require('./paystackService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class RepaymentService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Process all scheduled payments
   * @returns {Promise<Object>} Processing result
   */
  async processScheduledPayments() {
    try {
      const now = new Date();
      
      // Find loans with due payments
      const loansWithDuePayments = await Loan.find({
        status: 'active',
        'repayments.status': 'pending',
        'repayments.dueDate': { $lte: now }
      }).populate('borrowerId', 'email firstName lastName');

      logger.info('Processing scheduled payments', {
        count: loansWithDuePayments.length,
        timestamp: now
      });

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
      };

      for (const loan of loansWithDuePayments) {
        try {
          const result = await this.processLoanPayment(loan);
          
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              loanId: loan._id,
              error: result.error
            });
          }
          
          results.processed++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            loanId: loan._id,
            error: error.message
          });
          
          logger.error('Error processing loan payment', {
            loanId: loan._id,
            error: error.message
          });
        }
      }

      logger.info('Scheduled payments processing completed', results);
      return results;
    } catch (error) {
      logger.error('Failed to process scheduled payments', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process payment for a specific loan
   * @param {Object} loan - Loan object
   * @returns {Promise<Object>} Payment result
   */
  async processLoanPayment(loan) {
    try {
      // Find the next due payment
      const duePayment = loan.repayments.find(repayment => 
        repayment.status === 'pending' && repayment.dueDate <= new Date()
      );

      if (!duePayment) {
        return {
          success: false,
          error: 'No due payment found',
          skipped: true
        };
      }

      // Check if payment is overdue
      const isOverdue = duePayment.dueDate < new Date();
      const daysOverdue = isOverdue ? 
        Math.floor((new Date() - duePayment.dueDate) / (1000 * 60 * 60 * 24)) : 0;

      // Calculate late fee if applicable
      const lateFee = this.calculateLateFee(duePayment.amount, daysOverdue);
      const totalAmount = duePayment.amount + lateFee;

      // Check borrower's wallet balance
      const borrower = await User.findById(loan.borrowerId);
      if (!borrower) {
        throw new Error('Borrower not found');
      }

      if (borrower.walletBalance < totalAmount) {
        // Insufficient funds - mark as failed and send reminder
        await this.handleInsufficientFunds(loan, duePayment, totalAmount, borrower);
        return {
          success: false,
          error: 'Insufficient funds',
          amount: totalAmount,
          availableBalance: borrower.walletBalance
        };
      }

      // Process payment
      const paymentResult = await this.processPayment(
        loan,
        duePayment,
        totalAmount,
        borrower,
        lateFee
      );

      if (paymentResult.success) {
        // Update loan status
        await this.updateLoanAfterPayment(loan, duePayment, totalAmount, lateFee);
        
        // Send confirmation email
        await this.sendPaymentConfirmation(loan, duePayment, totalAmount, lateFee);
        
        logger.info('Loan payment processed successfully', {
          loanId: loan._id,
          paymentId: duePayment._id,
          amount: totalAmount,
          lateFee
        });

        return {
          success: true,
          amount: totalAmount,
          lateFee,
          paymentId: duePayment._id
        };
      } else {
        // Payment failed
        await this.handlePaymentFailure(loan, duePayment, paymentResult.error);
        return {
          success: false,
          error: paymentResult.error
        };
      }
    } catch (error) {
      logger.error('Failed to process loan payment', {
        loanId: loan._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process payment using Paystack
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {number} amount - Total amount to pay
   * @param {Object} borrower - Borrower object
   * @param {number} lateFee - Late fee amount
   * @returns {Promise<Object>} Payment result
   */
  async processPayment(loan, payment, amount, borrower, lateFee) {
    try {
      // Initialize payment with Paystack
      const paymentResult = await paystackService.initializePayment({
        amount: amount,
        email: borrower.email,
        type: 'loan_repayment',
        relatedEntities: { 
          loan: loan._id,
          payment: payment._id
        },
        metadata: {
          loanId: loan._id,
          paymentId: payment._id,
          installmentNumber: payment.installmentNumber,
          lateFee: lateFee
        }
      });

      if (paymentResult.success) {
        // Deduct from borrower's wallet
        await User.findByIdAndUpdate(borrower._id, {
          $inc: { walletBalance: -amount }
        });

        // Create transaction record
        await this.createRepaymentTransaction(
          loan,
          payment,
          amount,
          borrower,
          lateFee,
          paymentResult.reference
        );

        return {
          success: true,
          reference: paymentResult.reference,
          amount
        };
      } else {
        return {
          success: false,
          error: paymentResult.message || 'Payment initialization failed'
        };
      }
    } catch (error) {
      logger.error('Payment processing failed', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update loan after successful payment
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {number} amount - Total amount paid
   * @param {number} lateFee - Late fee amount
   */
  async updateLoanAfterPayment(loan, payment, amount, lateFee) {
    try {
      // Update payment status
      payment.status = 'paid';
      payment.paidAt = new Date();
      payment.amountPaid = amount;
      payment.lateFee = lateFee;

      // Check if this was the last payment
      const remainingPayments = loan.repayments.filter(r => r.status === 'pending');
      
      if (remainingPayments.length === 0) {
        // Loan completed
        loan.status = 'completed';
        loan.completedAt = new Date();
        
        // Update borrower's credit score
        const creditScoreService = require('./creditScoreService');
        await creditScoreService.updateCreditScore(loan.borrowerId);
      }

      await loan.save();

      logger.info('Loan updated after payment', {
        loanId: loan._id,
        paymentId: payment._id,
        amount,
        lateFee,
        remainingPayments: remainingPayments.length,
        loanStatus: loan.status
      });
    } catch (error) {
      logger.error('Failed to update loan after payment', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle insufficient funds scenario
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {number} requiredAmount - Required amount
   * @param {Object} borrower - Borrower object
   */
  async handleInsufficientFunds(loan, payment, requiredAmount, borrower) {
    try {
      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = 'Insufficient funds';
      payment.failedAt = new Date();
      
      // Increment retry count
      payment.retryCount = (payment.retryCount || 0) + 1;
      
      await loan.save();

      // Send insufficient funds notification
      await emailService.sendEmail({
        to: borrower.email,
        subject: 'Insufficient Funds for Loan Payment - Fundli',
        text: `Your loan payment of $${requiredAmount} could not be processed due to insufficient funds. Please add funds to your wallet.`,
        html: this.generateInsufficientFundsEmailHTML(
          borrower.firstName,
          requiredAmount,
          borrower.walletBalance
        )
      });

      logger.warn('Insufficient funds for loan payment', {
        loanId: loan._id,
        paymentId: payment._id,
        requiredAmount,
        availableBalance: borrower.walletBalance,
        retryCount: payment.retryCount
      });
    } catch (error) {
      logger.error('Failed to handle insufficient funds', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
    }
  }

  /**
   * Handle payment failure
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {string} error - Error message
   */
  async handlePaymentFailure(loan, payment, error) {
    try {
      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = error;
      payment.failedAt = new Date();
      
      // Increment retry count
      payment.retryCount = (payment.retryCount || 0) + 1;
      
      await loan.save();

      // Send failure notification
      const borrower = await User.findById(loan.borrowerId);
      if (borrower) {
        await emailService.sendEmail({
          to: borrower.email,
          subject: 'Loan Payment Failed - Fundli',
          text: `Your loan payment of $${payment.amount} failed. Reason: ${error}`,
          html: this.generatePaymentFailureEmailHTML(
            borrower.firstName,
            payment.amount,
            error
          )
        });
      }

      logger.warn('Loan payment failed', {
        loanId: loan._id,
        paymentId: payment._id,
        error,
        retryCount: payment.retryCount
      });
    } catch (error) {
      logger.error('Failed to handle payment failure', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
    }
  }

  /**
   * Send payment reminders
   * @returns {Promise<Object>} Reminder result
   */
  async sendPaymentReminders() {
    try {
      const now = new Date();
      const reminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      // Find loans with payments due in 24 hours
      const loansWithUpcomingPayments = await Loan.find({
        status: 'active',
        'repayments.status': 'pending',
        'repayments.dueDate': { 
          $gte: now,
          $lte: reminderDate
        }
      }).populate('borrowerId', 'email firstName lastName');

      logger.info('Sending payment reminders', {
        count: loansWithUpcomingPayments.length
      });

      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };

      for (const loan of loansWithUpcomingPayments) {
        try {
          const upcomingPayment = loan.repayments.find(repayment => 
            repayment.status === 'pending' && 
            repayment.dueDate >= now && 
            repayment.dueDate <= reminderDate
          );

          if (upcomingPayment) {
            await this.sendPaymentReminder(loan, upcomingPayment);
            results.sent++;
          }
        } catch (error) {
          results.failed++;
          results.errors.push({
            loanId: loan._id,
            error: error.message
          });
        }
      }

      logger.info('Payment reminders sent', results);
      return results;
    } catch (error) {
      logger.error('Failed to send payment reminders', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send payment reminder for a specific loan
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   */
  async sendPaymentReminder(loan, payment) {
    try {
      const borrower = await User.findById(loan.borrowerId);
      if (!borrower) {
        throw new Error('Borrower not found');
      }

      await emailService.sendRepaymentReminderEmail(
        borrower.email,
        borrower.firstName,
        {
          amount: payment.amount,
          dueDate: payment.dueDate.toLocaleDateString(),
          loanPurpose: loan.purpose,
          installmentNumber: payment.installmentNumber
        }
      );

      logger.info('Payment reminder sent', {
        loanId: loan._id,
        paymentId: payment._id,
        borrowerEmail: borrower.email,
        amount: payment.amount,
        dueDate: payment.dueDate
      });
    } catch (error) {
      logger.error('Failed to send payment reminder', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send payment confirmation email
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {number} amount - Total amount paid
   * @param {number} lateFee - Late fee amount
   */
  async sendPaymentConfirmation(loan, payment, amount, lateFee) {
    try {
      const borrower = await User.findById(loan.borrowerId);
      if (!borrower) {
        throw new Error('Borrower not found');
      }

      await emailService.sendEmail({
        to: borrower.email,
        subject: 'Payment Confirmation - Fundli',
        text: `Your loan payment of $${amount} has been processed successfully.`,
        html: this.generatePaymentConfirmationEmailHTML(
          borrower.firstName,
          amount,
          lateFee,
          payment.installmentNumber
        )
      });
    } catch (error) {
      logger.error('Failed to send payment confirmation', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
    }
  }

  /**
   * Calculate late fee
   * @param {number} amount - Payment amount
   * @param {number} daysOverdue - Days overdue
   * @returns {number} Late fee amount
   */
  calculateLateFee(amount, daysOverdue) {
    if (daysOverdue <= 0) return 0;
    
    // 5% of payment amount per week overdue, minimum $10
    const weeklyFee = amount * 0.05;
    const totalFee = weeklyFee * Math.ceil(daysOverdue / 7);
    
    return Math.max(10, totalFee);
  }

  /**
   * Create repayment transaction record
   * @param {Object} loan - Loan object
   * @param {Object} payment - Payment object
   * @param {number} amount - Total amount
   * @param {Object} borrower - Borrower object
   * @param {number} lateFee - Late fee amount
   * @param {string} reference - Payment reference
   */
  async createRepaymentTransaction(loan, payment, amount, borrower, lateFee, reference) {
    try {
      const transaction = new Transaction({
        type: 'loan_repayment',
        amount: amount,
        currency: 'NGN',
        sender: borrower._id,
        recipient: loan.lenderId,
        paymentMethod: 'wallet',
        relatedEntities: {
          loan: loan._id,
          payment: payment._id
        },
        description: `Loan repayment - Installment ${payment.installmentNumber}`,
        status: 'completed',
        metadata: {
          loanId: loan._id,
          paymentId: payment._id,
          installmentNumber: payment.installmentNumber,
          lateFee: lateFee,
          reference: reference
        }
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      logger.error('Failed to create repayment transaction', {
        loanId: loan._id,
        paymentId: payment._id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate payment confirmation email HTML
   */
  generatePaymentConfirmationEmailHTML(name, amount, lateFee, installmentNumber) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your loan payment has been processed successfully.</p>
            <div class="payment-details">
              <div class="detail-row">
                <span>Installment:</span>
                <strong>${installmentNumber}</strong>
              </div>
              <div class="detail-row">
                <span>Amount Paid:</span>
                <strong>$${amount}</strong>
              </div>
              ${lateFee > 0 ? `
              <div class="detail-row">
                <span>Late Fee:</span>
                <strong>$${lateFee}</strong>
              </div>
              ` : ''}
            </div>
            <p>Thank you for your timely payment!</p>
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
   * Generate insufficient funds email HTML
   */
  generateInsufficientFundsEmailHTML(name, requiredAmount, availableBalance) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Insufficient Funds - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .warning-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Insufficient Funds</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your loan payment could not be processed due to insufficient funds.</p>
            <div class="warning-box">
              <p><strong>Required Amount:</strong> $${requiredAmount}</p>
              <p><strong>Available Balance:</strong> $${availableBalance}</p>
              <p><strong>Shortfall:</strong> $${requiredAmount - availableBalance}</p>
            </div>
            <p>Please add funds to your wallet to complete the payment.</p>
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
   * Generate payment failure email HTML
   */
  generatePaymentFailureEmailHTML(name, amount, error) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Failed - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .error-box { background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your loan payment could not be processed.</p>
            <div class="error-box">
              <p><strong>Amount:</strong> $${amount}</p>
              <p><strong>Error:</strong> ${error}</p>
            </div>
            <p>Please try again or contact support if the issue persists.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>Fundli Team</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new RepaymentService();
