const Escrow = require('../models/Escrow');
const Loan = require('../models/Loan');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const paystackService = require('./paystackService');
const emailService = require('./emailService');
const logger = require('../utils/logger');

class EscrowService {
  /**
   * Create a new escrow account for a loan
   * @param {Object} escrowData - Escrow data
   * @returns {Promise<Object>} Created escrow
   */
  async createEscrow(escrowData) {
    try {
      const { loanId, lenderId, borrowerId, amount } = escrowData;

      // Check if escrow already exists for this loan
      const existingEscrow = await Escrow.findByLoan(loanId);
      if (existingEscrow) {
        throw new Error('Escrow already exists for this loan');
      }

      // Verify loan exists and is in correct status
      const loan = await Loan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== 'approved') {
        throw new Error('Loan must be approved before creating escrow');
      }

      // Create escrow
      const escrow = new Escrow({
        loanId,
        lenderId,
        borrowerId,
        amount,
        status: 'pending'
      });

      await escrow.save();

      logger.info('Escrow created', {
        escrowId: escrow._id,
        loanId,
        amount,
        lenderId,
        borrowerId
      });

      return escrow;
    } catch (error) {
      logger.error('Failed to create escrow', {
        error: error.message,
        escrowData
      });
      throw error;
    }
  }

  /**
   * Fund the escrow account
   * @param {string} escrowId - Escrow ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment result
   */
  async fundEscrow(escrowId, paymentData) {
    try {
      const escrow = await Escrow.findById(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'pending') {
        throw new Error('Escrow is not in pending status');
      }

      // Get lender details
      const lender = await User.findById(escrow.lenderId);
      if (!lender) {
        throw new Error('Lender not found');
      }

      // Initialize payment with Paystack
      const paymentResult = await paystackService.initializePayment({
        amount: escrow.amount,
        email: lender.email,
        type: 'escrow_funding',
        relatedEntities: { escrow: escrow._id, loan: escrow.loanId }
      });

      if (paymentResult.success) {
        // Update escrow with payment details
        await escrow.updatePaymentStatus('pending', {
          reference: paymentResult.reference,
          transactionId: paymentResult.transactionId
        });

        logger.info('Escrow funding initiated', {
          escrowId,
          amount: escrow.amount,
          reference: paymentResult.reference
        });

        return {
          success: true,
          paymentUrl: paymentResult.paymentUrl,
          reference: paymentResult.reference,
          escrowId: escrow._id
        };
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      logger.error('Failed to fund escrow', {
        error: error.message,
        escrowId,
        paymentData
      });
      throw error;
    }
  }

  /**
   * Verify and process escrow payment
   * @param {string} reference - Paystack reference
   * @returns {Promise<Object>} Verification result
   */
  async verifyEscrowPayment(reference) {
    try {
      // Find escrow by reference
      const escrow = await Escrow.findOne({
        'paymentDetails.paystackReference': reference
      });

      if (!escrow) {
        throw new Error('Escrow not found for reference');
      }

      // Verify payment with Paystack
      const verificationResult = await paystackService.verifyPayment(reference);

      if (verificationResult.success && verificationResult.status === 'completed') {
        // Update escrow status
        await escrow.updatePaymentStatus('completed', {
          reference,
          transactionId: verificationResult.data?.transactionId
        });

        // Create transaction record
        await this.createEscrowTransaction(escrow, 'escrow_funding');

        // Send confirmation email to lender
        const lender = await User.findById(escrow.lenderId);
        if (lender) {
          await emailService.sendEmail({
            to: lender.email,
            subject: 'Escrow Funding Confirmed - Fundli',
            text: `Your escrow account has been funded with ₦${escrow.amount}. The funds will be released to the borrower once all conditions are met.`,
            html: this.generateEscrowFundingEmailHTML(lender.firstName, escrow.amount)
          });
        }

        logger.info('Escrow payment verified and processed', {
          escrowId: escrow._id,
          reference,
          amount: escrow.amount
        });

        return {
          success: true,
          escrowId: escrow._id,
          status: escrow.status,
          message: 'Escrow funded successfully'
        };
      } else {
        // Payment failed
        await escrow.updatePaymentStatus('failed');
        
        logger.warn('Escrow payment verification failed', {
          escrowId: escrow._id,
          reference,
          status: verificationResult.status
        });

        return {
          success: false,
          message: 'Payment verification failed'
        };
      }
    } catch (error) {
      logger.error('Failed to verify escrow payment', {
        error: error.message,
        reference
      });
      throw error;
    }
  }

  /**
   * Update escrow conditions
   * @param {string} escrowId - Escrow ID
   * @param {Object} conditions - Conditions to update
   * @returns {Promise<Object>} Updated escrow
   */
  async updateEscrowConditions(escrowId, conditions) {
    try {
      const escrow = await Escrow.findById(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Update conditions
      if (conditions.loanApproved !== undefined) {
        escrow.releaseConditions.loanApproved = conditions.loanApproved;
      }
      if (conditions.kycVerified !== undefined) {
        escrow.releaseConditions.kycVerified = conditions.kycVerified;
      }
      if (conditions.collateralVerified !== undefined) {
        escrow.releaseConditions.collateralVerified = conditions.collateralVerified;
      }

      await escrow.save();

      // Check if ready to release
      if (escrow.isReadyToRelease && escrow.status === 'held') {
        await this.autoReleaseEscrow(escrowId);
      }

      logger.info('Escrow conditions updated', {
        escrowId,
        conditions,
        isReadyToRelease: escrow.isReadyToRelease
      });

      return escrow;
    } catch (error) {
      logger.error('Failed to update escrow conditions', {
        error: error.message,
        escrowId,
        conditions
      });
      throw error;
    }
  }

  /**
   * Automatically release escrow funds when conditions are met
   * @param {string} escrowId - Escrow ID
   * @returns {Promise<Object>} Release result
   */
  async autoReleaseEscrow(escrowId) {
    try {
      const escrow = await Escrow.findById(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (!escrow.isReadyToRelease) {
        throw new Error('Escrow conditions not met for release');
      }

      if (escrow.status !== 'held') {
        throw new Error('Escrow is not in held status');
      }

      // Release funds
      await escrow.releaseFunds(null, 'Automatic release - all conditions met');

      // Update borrower's wallet
      await User.findByIdAndUpdate(escrow.borrowerId, {
        $inc: { walletBalance: escrow.amount }
      });

      // Create transaction record
      await this.createEscrowTransaction(escrow, 'escrow_release');

      // Update loan status
      await Loan.findByIdAndUpdate(escrow.loanId, {
        status: 'funded',
        fundedAt: new Date()
      });

      // Send notification emails
      await this.sendReleaseNotifications(escrow);

      logger.info('Escrow funds released automatically', {
        escrowId,
        amount: escrow.amount,
        borrowerId: escrow.borrowerId,
        loanId: escrow.loanId
      });

      return {
        success: true,
        escrowId: escrow._id,
        amount: escrow.amount,
        message: 'Funds released successfully'
      };
    } catch (error) {
      logger.error('Failed to auto-release escrow', {
        error: error.message,
        escrowId
      });
      throw error;
    }
  }

  /**
   * Manually release escrow funds
   * @param {string} escrowId - Escrow ID
   * @param {string} releasedBy - Admin user ID
   * @param {string} reason - Release reason
   * @returns {Promise<Object>} Release result
   */
  async manualReleaseEscrow(escrowId, releasedBy, reason = 'Manual release by admin') {
    try {
      const escrow = await Escrow.findById(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== 'held') {
        throw new Error('Escrow is not in held status');
      }

      // Release funds
      await escrow.releaseFunds(releasedBy, reason);

      // Update borrower's wallet
      await User.findByIdAndUpdate(escrow.borrowerId, {
        $inc: { walletBalance: escrow.amount }
      });

      // Create transaction record
      await this.createEscrowTransaction(escrow, 'escrow_release');

      // Update loan status
      await Loan.findByIdAndUpdate(escrow.loanId, {
        status: 'funded',
        fundedAt: new Date()
      });

      // Send notification emails
      await this.sendReleaseNotifications(escrow);

      logger.info('Escrow funds released manually', {
        escrowId,
        amount: escrow.amount,
        releasedBy,
        reason,
        borrowerId: escrow.borrowerId,
        loanId: escrow.loanId
      });

      return {
        success: true,
        escrowId: escrow._id,
        amount: escrow.amount,
        message: 'Funds released successfully'
      };
    } catch (error) {
      logger.error('Failed to manually release escrow', {
        error: error.message,
        escrowId,
        releasedBy,
        reason
      });
      throw error;
    }
  }

  /**
   * Refund escrow funds
   * @param {string} escrowId - Escrow ID
   * @param {string} refundedBy - Admin user ID
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async refundEscrow(escrowId, refundedBy, reason = 'Loan cancelled') {
    try {
      const escrow = await Escrow.findById(escrowId);
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (!['held', 'pending'].includes(escrow.status)) {
        throw new Error('Escrow cannot be refunded in current status');
      }

      // Refund funds
      await escrow.refundFunds(refundedBy, reason);

      // Update lender's wallet
      await User.findByIdAndUpdate(escrow.lenderId, {
        $inc: { walletBalance: escrow.amount }
      });

      // Create transaction record
      await this.createEscrowTransaction(escrow, 'escrow_refund');

      // Update loan status
      await Loan.findByIdAndUpdate(escrow.loanId, {
        status: 'cancelled',
        cancelledAt: new Date()
      });

      // Send notification emails
      await this.sendRefundNotifications(escrow);

      logger.info('Escrow funds refunded', {
        escrowId,
        amount: escrow.amount,
        refundedBy,
        reason,
        lenderId: escrow.lenderId,
        loanId: escrow.loanId
      });

      return {
        success: true,
        escrowId: escrow._id,
        amount: escrow.amount,
        message: 'Funds refunded successfully'
      };
    } catch (error) {
      logger.error('Failed to refund escrow', {
        error: error.message,
        escrowId,
        refundedBy,
        reason
      });
      throw error;
    }
  }

  /**
   * Get escrow statistics
   * @returns {Promise<Object>} Escrow statistics
   */
  async getEscrowStats() {
    try {
      const stats = await Escrow.getEscrowStats();
      const totalEscrows = await Escrow.countDocuments();
      const totalAmount = await Escrow.aggregate([
        { $group: { _id: null, total: { $sum: 1 } } }
      ]);

      return {
        totalEscrows,
        totalAmount: totalAmount[0]?.total || 0,
        statusBreakdown: stats,
        readyToRelease: await Escrow.countDocuments({
          status: 'held',
          'releaseConditions.allConditionsMet': true
        })
      };
    } catch (error) {
      logger.error('Failed to get escrow stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Create transaction record for escrow operation
   * @param {Object} escrow - Escrow object
   * @param {string} type - Transaction type
   * @returns {Promise<Object>} Created transaction
   */
  async createEscrowTransaction(escrow, type) {
    try {
      const transaction = new Transaction({
        type,
        amount: escrow.amount,
        currency: 'NGN',
        sender: escrow.lenderId,
        recipient: escrow.borrowerId,
        paymentMethod: 'escrow',
        relatedEntities: {
          escrow: escrow._id,
          loan: escrow.loanId
        },
        description: `Escrow ${type} for loan ${escrow.loanId}`,
        status: 'completed',
        metadata: {
          escrowId: escrow._id,
          loanId: escrow.loanId
        }
      });

      await transaction.save();
      return transaction;
    } catch (error) {
      logger.error('Failed to create escrow transaction', {
        error: error.message,
        escrowId: escrow._id,
        type
      });
      throw error;
    }
  }

  /**
   * Send release notification emails
   * @param {Object} escrow - Escrow object
   */
  async sendReleaseNotifications(escrow) {
    try {
      const [borrower, lender] = await Promise.all([
        User.findById(escrow.borrowerId),
        User.findById(escrow.lenderId)
      ]);

      // Send email to borrower
      if (borrower) {
        await emailService.sendEmail({
          to: borrower.email,
          subject: 'Loan Funds Released - Fundli',
          text: `Your loan funds of ₦${escrow.amount} have been released to your wallet.`,
          html: this.generateFundsReleasedEmailHTML(borrower.firstName, escrow.amount)
        });
      }

      // Send email to lender
      if (lender) {
        await emailService.sendEmail({
          to: lender.email,
          subject: 'Escrow Funds Released - Fundli',
          text: `Your escrow funds of ₦${escrow.amount} have been released to the borrower.`,
          html: this.generateEscrowReleasedEmailHTML(lender.firstName, escrow.amount)
        });
      }
    } catch (error) {
      logger.error('Failed to send release notifications', {
        error: error.message,
        escrowId: escrow._id
      });
    }
  }

  /**
   * Send refund notification emails
   * @param {Object} escrow - Escrow object
   */
  async sendRefundNotifications(escrow) {
    try {
      const lender = await User.findById(escrow.lenderId);
      
      if (lender) {
        await emailService.sendEmail({
          to: lender.email,
          subject: 'Escrow Funds Refunded - Fundli',
          text: `Your escrow funds of ₦${escrow.amount} have been refunded to your wallet.`,
          html: this.generateEscrowRefundedEmailHTML(lender.firstName, escrow.amount, escrow.refundReason)
        });
      }
    } catch (error) {
      logger.error('Failed to send refund notifications', {
        error: error.message,
        escrowId: escrow._id
      });
    }
  }

  /**
   * Generate escrow funding email HTML
   */
  generateEscrowFundingEmailHTML(name, amount) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escrow Funding Confirmed - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .amount-box { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Escrow Funding Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your escrow account has been successfully funded.</p>
            <div class="amount-box">
              <h3>₦${amount}</h3>
              <p>Funds will be released to the borrower once all conditions are met.</p>
            </div>
            <p>You will be notified when the funds are released.</p>
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
   * Generate funds released email HTML
   */
  generateFundsReleasedEmailHTML(name, amount) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Loan Funds Released - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .amount-box { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Loan Funds Released!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Great news! Your loan funds have been released.</p>
            <div class="amount-box">
              <h3>₦${amount}</h3>
              <p>Funds are now available in your wallet.</p>
            </div>
            <p>You can now use these funds for your intended purpose.</p>
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
   * Generate escrow released email HTML
   */
  generateEscrowReleasedEmailHTML(name, amount) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escrow Funds Released - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .amount-box { background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Escrow Funds Released</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your escrow funds have been released to the borrower.</p>
            <div class="amount-box">
              <h3>₦${amount}</h3>
              <p>Funds have been transferred to the borrower's wallet.</p>
            </div>
            <p>The loan is now active and repayments will begin according to the schedule.</p>
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
   * Generate escrow refunded email HTML
   */
  generateEscrowRefundedEmailHTML(name, amount, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Escrow Funds Refunded - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .amount-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .reason-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Escrow Funds Refunded</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your escrow funds have been refunded.</p>
            <div class="amount-box">
              <h3>₦${amount}</h3>
              <p>Funds have been returned to your wallet.</p>
            </div>
            <div class="reason-box">
              <strong>Reason:</strong> ${reason}
            </div>
            <p>You can use these funds for other investments or withdraw them.</p>
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

module.exports = new EscrowService();
