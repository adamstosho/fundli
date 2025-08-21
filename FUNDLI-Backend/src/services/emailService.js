const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@fundli.com';
    this.fromName = 'Fundli Team';
    this.templates = {};
    this.initializeTransporter();
    this.loadTemplates();
  }

  /**
   * Initialize the email transporter
   */
  initializeTransporter() {
    try {
      // Check if email credentials are configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ Email credentials not configured. Email service will be disabled.');
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Test the connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.warn('⚠️ Email service configuration error:', error.message);
          this.transporter = null;
        } else {
          console.log('✅ Email service configured successfully');
        }
      });

    } catch (error) {
      console.warn('⚠️ Email service initialization failed:', error.message);
      this.transporter = null;
    }
  }

  /**
   * Load email templates
   */
  loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      if (fs.existsSync(templatesDir)) {
        const templateFiles = fs.readdirSync(templatesDir);
        
        templateFiles.forEach(file => {
          if (file.endsWith('.html')) {
            const templateName = path.basename(file, '.html');
            const templatePath = path.join(templatesDir, file);
            this.templates[templateName] = fs.readFileSync(templatePath, 'utf8');
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to load email templates:', error);
    }
  }

  /**
   * Send a simple email
   * @param {Object} options - Email options
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        console.warn('⚠️ Email service not configured. Email not sent.');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments || []
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send OTP verification email
   * @param {string} email - Recipient email
   * @param {string} otp - OTP code
   * @param {string} name - Recipient name
   * @returns {Promise<Object>} Send result
   */
  async sendOTPEmail(email, otp, name) {
    try {
      const subject = 'Verify Your Email - Fundli';
      const text = `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateOTPEmailHTML(name, otp);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`OTP email sending failed: ${error.message}`);
    }
  }

  /**
   * Send welcome email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} userType - User type (borrower/lender)
   * @returns {Promise<Object>} Send result
   */
  async sendWelcomeEmail(email, name, userType) {
    try {
      const subject = 'Welcome to Fundli!';
      const text = `Hello ${name},\n\nWelcome to Fundli! We're excited to have you on board.\n\nYour account type: ${userType}\n\nGet started by completing your profile and KYC verification.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateWelcomeEmailHTML(name, userType);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Welcome email sending failed: ${error.message}`);
    }
  }

  /**
   * Send KYC approval email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @returns {Promise<Object>} Send result
   */
  async sendKYCApprovalEmail(email, name) {
    try {
      const subject = 'KYC Verification Approved - Fundli';
      const text = `Hello ${name},\n\nGreat news! Your KYC verification has been approved.\n\nYou can now access all features of the platform.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateKYCApprovalEmailHTML(name);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`KYC approval email sending failed: ${error.message}`);
    }
  }

  /**
   * Send KYC rejection email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Send result
   */
  async sendKYCRejectionEmail(email, name, reason) {
    try {
      const subject = 'KYC Verification Update - Fundli';
      const text = `Hello ${name},\n\nYour KYC verification requires attention.\n\nReason: ${reason}\n\nPlease review and resubmit your documents.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateKYCRejectionEmailHTML(name, reason);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`KYC rejection email sending failed: ${error.message}`);
    }
  }

  /**
   * Send loan approval email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} loanDetails - Loan details
   * @returns {Promise<Object>} Send result
   */
  async sendLoanApprovalEmail(email, name, loanDetails) {
    try {
      const subject = 'Loan Application Approved - Fundli';
      const text = `Hello ${name},\n\nCongratulations! Your loan application has been approved.\n\nLoan Amount: $${loanDetails.amount}\nPurpose: ${loanDetails.purpose}\nDuration: ${loanDetails.duration} months\n\nBest regards,\nFundli Team`;
      
      const html = this.generateLoanApprovalEmailHTML(name, loanDetails);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Loan approval email sending failed: ${error.message}`);
    }
  }

  /**
   * Send loan rejection email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Send result
   */
  async sendLoanRejectionEmail(email, name, reason) {
    try {
      const subject = 'Loan Application Update - Fundli';
      const text = `Hello ${name},\n\nYour loan application requires attention.\n\nReason: ${reason}\n\nPlease review and consider resubmitting.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateLoanRejectionEmailHTML(name, reason);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Loan rejection email sending failed: ${error.message}`);
    }
  }

  /**
   * Send repayment reminder email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} repaymentDetails - Repayment details
   * @returns {Promise<Object>} Send result
   */
  async sendRepaymentReminderEmail(email, name, repaymentDetails) {
    try {
      const subject = 'Payment Reminder - Fundli';
      const text = `Hello ${name},\n\nThis is a friendly reminder about your upcoming payment.\n\nAmount Due: $${repaymentDetails.amount}\nDue Date: ${repaymentDetails.dueDate}\n\nPlease ensure timely payment to avoid late fees.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateRepaymentReminderEmailHTML(name, repaymentDetails);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Repayment reminder email sending failed: ${error.message}`);
    }
  }

  /**
   * Send referral reward email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {Object} rewardDetails - Reward details
   * @returns {Promise<Object>} Send result
   */
  async sendReferralRewardEmail(email, name, rewardDetails) {
    try {
      const subject = 'Referral Reward Earned - Fundli';
      const text = `Hello ${name},\n\nCongratulations! You've earned a referral reward.\n\nReward Amount: $${rewardDetails.amount}\nReferral: ${rewardDetails.referralName}\n\nYour reward has been added to your wallet.\n\nBest regards,\nFundli Team`;
      
      const html = this.generateReferralRewardEmailHTML(name, rewardDetails);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Referral reward email sending failed: ${error.message}`);
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} name - Recipient name
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} Send result
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    try {
      const subject = 'Password Reset Request - Fundli';
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const text = `Hello ${name},\n\nYou requested a password reset.\n\nReset Link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nFundli Team`;
      
      const html = this.generatePasswordResetEmailHTML(name, resetUrl);

      return await this.sendEmail({
        to: email,
        subject: subject,
        text: text,
        html: html
      });

    } catch (error) {
      throw new Error(`Password reset email sending failed: ${error.message}`);
    }
  }

  /**
   * Send system announcement email
   * @param {Array} emails - Array of recipient emails
   * @param {string} subject - Email subject
   * @param {string} message - Announcement message
   * @returns {Promise<Object>} Send result
   */
  async sendSystemAnnouncement(emails, subject, message) {
    try {
      const text = `Hello,\n\n${message}\n\nBest regards,\nFundli Team`;
      const html = this.generateSystemAnnouncementHTML(message);

      const results = [];
      
      for (const email of emails) {
        const result = await this.sendEmail({
          to: email,
          subject: subject,
          text: text,
          html: html
        });
        results.push({ email, result });
      }

      return {
        success: true,
        results: results
      };

    } catch (error) {
      throw new Error(`System announcement sending failed: ${error.message}`);
    }
  }

  /**
   * Generate OTP email HTML
   * @param {string} name - Recipient name
   * @param {string} otp - OTP code
   * @returns {string} HTML content
   */
  generateOTPEmailHTML(name, otp) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .otp-code { font-size: 32px; font-weight: bold; color: #0ea5e9; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Fundli</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
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
   * Generate welcome email HTML
   * @param {string} name - Recipient name
   * @param {string} userType - User type
   * @returns {string} HTML content
   */
  generateWelcomeEmailHTML(name, userType) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Fundli!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .user-type { background: #10b981; color: white; padding: 10px; border-radius: 5px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Fundli!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We're excited to have you on board!</p>
            <p>Your account type: <span class="user-type">${userType}</span></p>
            <p>Get started by completing your profile and KYC verification.</p>
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
   * Generate KYC approval email HTML
   * @param {string} name - Recipient name
   * @returns {string} HTML content
   */
  generateKYCApprovalEmailHTML(name) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KYC Verification Approved - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .success-icon { font-size: 48px; text-align: center; color: #10b981; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KYC Verification Approved!</h1>
          </div>
          <div class="content">
            <div class="success-icon">✅</div>
            <h2>Hello ${name},</h2>
            <p>Great news! Your KYC verification has been approved.</p>
            <p>You can now access all features of the platform.</p>
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
   * Generate KYC rejection email HTML
   * @param {string} name - Recipient name
   * @param {string} reason - Rejection reason
   * @returns {string} HTML content
   */
  generateKYCRejectionEmailHTML(name, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KYC Verification Update - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reason-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KYC Verification Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your KYC verification requires attention.</p>
            <div class="reason-box">
              <strong>Reason:</strong> ${reason}
            </div>
            <p>Please review and resubmit your documents.</p>
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
   * Generate loan approval email HTML
   * @param {string} name - Recipient name
   * @param {Object} loanDetails - Loan details
   * @returns {string} HTML content
   */
  generateLoanApprovalEmailHTML(name, loanDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Loan Application Approved - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .loan-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Loan Application Approved!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Congratulations! Your loan application has been approved.</p>
            <div class="loan-details">
              <div class="detail-row">
                <span>Loan Amount:</span>
                <strong>$${loanDetails.amount}</strong>
              </div>
              <div class="detail-row">
                <span>Purpose:</span>
                <strong>${loanDetails.purpose}</strong>
              </div>
              <div class="detail-row">
                <span>Duration:</span>
                <strong>${loanDetails.duration} months</strong>
              </div>
            </div>
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
   * Generate loan rejection email HTML
   * @param {string} name - Recipient name
   * @param {string} reason - Rejection reason
   * @returns {string} HTML content
   */
  generateLoanRejectionEmailHTML(name, reason) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Loan Application Update - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reason-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Loan Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Your loan application requires attention.</p>
            <div class="reason-box">
              <strong>Reason:</strong> ${reason}
            </div>
            <p>Please review and consider resubmitting.</p>
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
   * Generate repayment reminder email HTML
   * @param {string} name - Recipient name
   * @param {Object} repaymentDetails - Repayment details
   * @returns {string} HTML content
   */
  generateRepaymentReminderEmailHTML(name, repaymentDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reminder-box { background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>This is a friendly reminder about your upcoming payment.</p>
            <div class="reminder-box">
              <p><strong>Amount Due:</strong> $${repaymentDetails.amount}</p>
              <p><strong>Due Date:</strong> ${repaymentDetails.dueDate}</p>
            </div>
            <p>Please ensure timely payment to avoid late fees.</p>
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
   * Generate referral reward email HTML
   * @param {string} name - Recipient name
   * @param {Object} rewardDetails - Reward details
   * @returns {string} HTML content
   */
  generateReferralRewardEmailHTML(name, rewardDetails) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Referral Reward Earned - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reward-box { background: #d1fae5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Referral Reward Earned!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Congratulations! You've earned a referral reward.</p>
            <div class="reward-box">
              <p><strong>Reward Amount:</strong> $${rewardDetails.amount}</p>
              <p><strong>Referral:</strong> ${rewardDetails.referralName}</p>
            </div>
            <p>Your reward has been added to your wallet.</p>
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
   * Generate password reset email HTML
   * @param {string} name - Recipient name
   * @param {string} resetUrl - Password reset URL
   * @returns {string} HTML content
   */
  generatePasswordResetEmailHTML(name, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .reset-button { background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>You requested a password reset.</p>
            <a href="${resetUrl}" class="reset-button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
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
   * Generate system announcement email HTML
   * @param {string} message - Announcement message
   * @returns {string} HTML content
   */
  generateSystemAnnouncementHTML(message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>System Announcement - Fundli</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .announcement-box { background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>System Announcement</h1>
          </div>
          <div class="content">
            <div class="announcement-box">
              ${message}
            </div>
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

module.exports = new EmailService(); 