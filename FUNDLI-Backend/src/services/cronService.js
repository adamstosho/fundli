const cron = require('node-cron');
const repaymentService = require('./repaymentService');
const escrowService = require('./escrowService');
const creditScoreService = require('./creditScoreService');
const penaltyService = require('./penaltyService');
const NotificationService = require('./notificationService');
const Loan = require('../models/Loan');
const User = require('../models/User');
const logger = require('../utils/logger');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start all cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cron service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting cron service');

    // Process scheduled payments every hour
    this.scheduleJob('process-payments', '0 * * * *', async () => {
      try {
        logger.info('Running scheduled payment processing');
        const result = await repaymentService.processScheduledPayments();
        logger.info('Scheduled payment processing completed', result);
      } catch (error) {
        logger.error('Scheduled payment processing failed', { error: error.message });
      }
    });

    // Send payment reminders every 6 hours
    this.scheduleJob('send-reminders', '0 */6 * * *', async () => {
      try {
        logger.info('Running payment reminder sending');
        const result = await repaymentService.sendPaymentReminders();
        logger.info('Payment reminder sending completed', result);
      } catch (error) {
        logger.error('Payment reminder sending failed', { error: error.message });
      }
    });

    // Calculate penalty charges daily at 1 AM
    this.scheduleJob('calculate-penalties', '0 1 * * *', async () => {
      try {
        logger.info('Running penalty charges calculation');
        const result = await penaltyService.calculatePenaltyCharges();
        logger.info('Penalty charges calculation completed', result);
      } catch (error) {
        logger.error('Penalty charges calculation failed', { error: error.message });
      }
    });

    // Auto-release escrow funds every 30 minutes
    this.scheduleJob('auto-release-escrow', '*/30 * * * *', async () => {
      try {
        logger.info('Running auto-release escrow check');
        const Escrow = require('../models/Escrow');
        const readyEscrows = await Escrow.findReadyToRelease();
        
        for (const escrow of readyEscrows) {
          try {
            await escrowService.autoReleaseEscrow(escrow._id);
            logger.info('Escrow auto-released', { escrowId: escrow._id });
          } catch (error) {
            logger.error('Failed to auto-release escrow', {
              escrowId: escrow._id,
              error: error.message
            });
          }
        }
      } catch (error) {
        logger.error('Auto-release escrow check failed', { error: error.message });
      }
    });

    // Update credit scores daily at 2 AM
    this.scheduleJob('update-credit-scores', '0 2 * * *', async () => {
      try {
        logger.info('Running credit score updates');
        const User = require('../models/User');
        const users = await User.find({}, '_id');
        
        let processed = 0;
        let successful = 0;
        let failed = 0;

        for (const user of users) {
          try {
            await creditScoreService.updateCreditScore(user._id);
            successful++;
          } catch (error) {
            failed++;
            logger.error('Failed to update credit score', {
              userId: user._id,
              error: error.message
            });
          }
          processed++;
        }

        logger.info('Credit score updates completed', {
          processed,
          successful,
          failed
        });
      } catch (error) {
        logger.error('Credit score updates failed', { error: error.message });
      }
    });

    // Check for repayment due notifications daily at 9 AM
    this.scheduleJob('check-repayment-due', '0 9 * * *', async () => {
      try {
        logger.info('Running repayment due notification check');
        
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Find loans due today or in the next 7 days
        const loansDueSoon = await Loan.find({
          status: 'active',
          endDate: {
            $gte: today,
            $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }).populate('borrower', 'firstName lastName email')
          .populate('fundedBy', 'firstName lastName email');

        logger.info(`Found ${loansDueSoon.length} loans due for repayment`);

        let notificationsSent = 0;

        for (const loan of loansDueSoon) {
          try {
            // Calculate days until due
            const daysUntilDue = Math.ceil((loan.endDate - today) / (1000 * 60 * 60 * 24));
            
            // Only send notification if it's due today or in the next 3 days
            if (daysUntilDue <= 3) {
              // Get the lender who funded this loan
              const lender = loan.fundedBy;
              if (lender) {
                await NotificationService.notifyRepaymentDue({
                  lenderId: lender._id,
                  lenderName: `${lender.firstName} ${lender.lastName}`,
                  loanId: loan._id,
                  borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
                  loanAmount: loan.loanAmount,
                  dueDate: loan.endDate,
                  daysUntilDue: daysUntilDue
                });
                
                notificationsSent++;
                logger.info(`Repayment due notification sent to lender ${lender._id} for loan ${loan._id}`);
              }

              // Also send notification to admins about loan due for repayment
              try {
                await NotificationService.notifyAdminLoanDueForRepayment({
                  loanId: loan._id,
                  borrowerName: `${loan.borrower.firstName} ${loan.borrower.lastName}`,
                  lenderName: `${lender.firstName} ${lender.lastName}`,
                  loanAmount: loan.loanAmount,
                  dueDate: loan.endDate,
                  daysUntilDue: daysUntilDue
                });
                
                logger.info(`Repayment due notification sent to admins for loan ${loan._id}`);
              } catch (adminNotificationError) {
                logger.error(`Error sending admin repayment due notification for loan ${loan._id}`, {
                  error: adminNotificationError.message
                });
              }
            }
          } catch (notificationError) {
            logger.error(`Error sending repayment due notification for loan ${loan._id}`, {
              error: notificationError.message
            });
          }
        }

        logger.info('Repayment due notification check completed', {
          loansChecked: loansDueSoon.length,
          notificationsSent: notificationsSent
        });
      } catch (error) {
        logger.error('Repayment due notification check failed', { error: error.message });
      }
    });

    // Clean up old notifications weekly
    this.scheduleJob('cleanup-notifications', '0 3 * * 0', async () => {
      try {
        logger.info('Running notification cleanup');
        const Notification = require('../models/Notification');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const result = await Notification.deleteMany({
          createdAt: { $lt: thirtyDaysAgo },
          read: true
        });

        logger.info('Notification cleanup completed', {
          deletedCount: result.deletedCount
        });
      } catch (error) {
        logger.error('Notification cleanup failed', { error: error.message });
      }
    });

    // Generate daily reports at 6 AM
    this.scheduleJob('daily-reports', '0 6 * * *', async () => {
      try {
        logger.info('Generating daily reports');
        await this.generateDailyReports();
        logger.info('Daily reports generated successfully');
      } catch (error) {
        logger.error('Daily report generation failed', { error: error.message });
      }
    });

    logger.info('All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    if (!this.isRunning) {
      logger.warn('Cron service is not running');
      return;
    }

    this.isRunning = false;
    logger.info('Stopping cron service');

    for (const [name, job] of this.jobs) {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    }

    this.jobs.clear();
    logger.info('All cron jobs stopped');
  }

  /**
   * Schedule a new cron job
   * @param {string} name - Job name
   * @param {string} schedule - Cron schedule
   * @param {Function} task - Task function
   */
  scheduleJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      logger.warn(`Cron job ${name} already exists, stopping previous job`);
      this.jobs.get(name).stop();
    }

    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: 'Africa/Lagos'
    });

    job.start();
    this.jobs.set(name, job);

    logger.info(`Scheduled cron job: ${name} with schedule: ${schedule}`);
  }

  /**
   * Get job status
   * @param {string} name - Job name
   * @returns {Object} Job status
   */
  getJobStatus(name) {
    const job = this.jobs.get(name);
    if (!job) {
      return { exists: false };
    }

    return {
      exists: true,
      running: job.running,
      nextDate: job.nextDate(),
      lastDate: job.lastDate()
    };
  }

  /**
   * Get all jobs status
   * @returns {Object} All jobs status
   */
  getAllJobsStatus() {
    const status = {};
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running,
        nextDate: job.nextDate(),
        lastDate: job.lastDate()
      };
    }
    return status;
  }

  /**
   * Run a job manually
   * @param {string} name - Job name
   * @returns {Promise<Object>} Job result
   */
  async runJobManually(name) {
    const job = this.jobs.get(name);
    if (!job) {
      throw new Error(`Job ${name} not found`);
    }

    logger.info(`Running job manually: ${name}`);
    
    try {
      // Get the task function and run it
      const task = job.task;
      await task();
      
      logger.info(`Job ${name} completed successfully`);
      return { success: true, message: `Job ${name} completed successfully` };
    } catch (error) {
      logger.error(`Job ${name} failed`, { error: error.message });
      throw error;
    }
  }

  /**
   * Generate daily reports
   */
  async generateDailyReports() {
    try {
      const Loan = require('../models/Loan');
      const User = require('../models/User');
      const Transaction = require('../models/Transaction');
      const Escrow = require('../models/Escrow');

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get daily statistics
      const dailyStats = {
        date: yesterday.toISOString().split('T')[0],
        loans: {
          applied: await Loan.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          approved: await Loan.countDocuments({
            status: 'approved',
            updatedAt: { $gte: yesterday, $lt: today }
          }),
          funded: await Loan.countDocuments({
            status: 'funded',
            updatedAt: { $gte: yesterday, $lt: today }
          }),
          completed: await Loan.countDocuments({
            status: 'completed',
            updatedAt: { $gte: yesterday, $lt: today }
          })
        },
        users: {
          registered: await User.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          kycVerified: await User.countDocuments({
            kycVerified: true,
            updatedAt: { $gte: yesterday, $lt: today }
          })
        },
        transactions: {
          total: await Transaction.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          amount: await Transaction.aggregate([
            {
              $match: {
                createdAt: { $gte: yesterday, $lt: today },
                status: 'completed'
              }
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: 1 }
              }
            }
          ])
        },
        escrow: {
          created: await Escrow.countDocuments({
            createdAt: { $gte: yesterday, $lt: today }
          }),
          released: await Escrow.countDocuments({
            status: 'released',
            releasedAt: { $gte: yesterday, $lt: today }
          })
        }
      };

      // Store daily report (you might want to create a DailyReport model)
      logger.info('Daily report generated', dailyStats);

      return dailyStats;
    } catch (error) {
      logger.error('Failed to generate daily reports', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cron service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      running: this.isRunning,
      jobsCount: this.jobs.size,
      jobs: this.getAllJobsStatus()
    };
  }
}

module.exports = new CronService();
