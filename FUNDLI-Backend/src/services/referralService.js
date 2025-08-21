const Referral = require('../models/Referral');
const User = require('../models/User');

class ReferralService {
  /**
   * Create a new referral when someone signs up with a referral code
   */
  static async createReferral(referralCode, referredUserId) {
    try {
      // Find the referrer by referral code
      const referrer = await User.findByReferralCode(referralCode);
      if (!referrer) {
        throw new Error('Invalid referral code');
      }

      // Check if user was already referred
      const existingReferral = await Referral.findOne({ referred: referredUserId });
      if (existingReferral) {
        throw new Error('User already has a referral');
      }

      // Create the referral
      const referral = new Referral({
        referrer: referrer._id,
        referred: referredUserId,
        referralCode,
        status: 'pending'
      });

      await referral.save();

      // Update referrer's total referred count
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { 'referralStats.totalReferred': 1 }
      });

      return referral;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Track when a referred user completes an action
   */
  static async trackAction(userId, actionType, transactionAmount = 0) {
    try {
      const referral = await Referral.findOne({ referred: userId });
      if (!referral) {
        return null; // User wasn't referred
      }

      // Track the action
      await referral.trackAction(actionType, transactionAmount);

      // Update referrer's completed actions count
      await User.findByIdAndUpdate(referral.referrer, {
        $inc: { 'referralStats.completedActions': 1 }
      });

      // Check if referrer is now eligible for rewards
      await this.checkAndUpdateEligibility(referral.referrer);

      return referral;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check and update referrer's eligibility for rewards
   */
  static async checkAndUpdateEligibility(referrerId) {
    try {
      const eligibility = await Referral.checkReferrerEligibility(referrerId);
      
      if (eligibility.eligible) {
        await User.findByIdAndUpdate(referrerId, {
          'referralStats.isEligibleForRewards': true,
          'referralStats.rewardEligibilityDate': new Date()
        });
      }

      return eligibility;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process a transaction reward for a referred user
   */
  static async processTransactionReward(userId, transactionAmount, actionType) {
    try {
      const reward = await Referral.processTransactionReward(userId, transactionAmount, actionType);
      return reward;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get comprehensive referral statistics for a user
   */
  static async getReferralStats(userId) {
    try {
      const referralStats = await Referral.getReferrerStats(userId);
      const user = await User.findById(userId);
      
      return {
        ...referralStats,
        referralCode: user.referralCode,
        referralEarnings: user.referralEarnings,
        walletBalance: user.walletBalance,
        requirements: {
          totalNeeded: 5,
          actionsNeeded: 3,
          currentTotal: referralStats.totalReferred,
          currentActions: referralStats.completedActions
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get referral history for a user
   */
  static async getReferralHistory(userId) {
    try {
      const referrals = await Referral.find({ referrer: userId })
        .populate('referred', 'firstName lastName email createdAt')
        .sort({ createdAt: -1 });

      return referrals.map(referral => ({
        id: referral._id,
        referredUser: referral.referred,
        status: referral.status,
        hasCompletedAction: referral.hasCompletedAction,
        completedActions: referral.completedActions,
        rewardAmount: referral.rewardAmount,
        createdAt: referral.createdAt,
        completedAt: referral.completedAt
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle various platform actions that should trigger referral tracking
   */
  static async handlePlatformAction(userId, actionType, transactionAmount = 0) {
    try {
      // Track the action
      await this.trackAction(userId, actionType, transactionAmount);

      // If this is a transaction, process the reward
      if (transactionAmount > 0) {
        await this.processTransactionReward(userId, transactionAmount, actionType);
      }

      return true;
    } catch (error) {
      console.error('Error handling platform action:', error);
      return false;
    }
  }
}

module.exports = ReferralService; 