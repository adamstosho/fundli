/**
 * Penalty Configuration Service
 * Manages penalty rates and settings
 */

const PENALTY_CONFIG = {
  RATE_PER_DAY: 0.005, // 0.5% per day
  GRACE_PERIOD_HOURS: 24, // 24 hours grace period
  MAX_PENALTY_DAYS: 365, // Maximum penalty accumulation days
  CURRENCY: 'USD',
  ENABLED: true
};

class PenaltyConfigService {
  /**
   * Get current penalty configuration
   * @returns {Object} Current penalty configuration
   */
  static getConfig() {
    return { ...PENALTY_CONFIG };
  }

  /**
   * Update penalty configuration
   * @param {Object} newConfig - New configuration object
   * @returns {Object} Updated configuration
   */
  static updateConfig(newConfig) {
    // Validate configuration
    if (newConfig.RATE_PER_DAY !== undefined) {
      if (newConfig.RATE_PER_DAY < 0 || newConfig.RATE_PER_DAY > 1) {
        throw new Error('Penalty rate must be between 0 and 1 (0% to 100%)');
      }
    }

    if (newConfig.GRACE_PERIOD_HOURS !== undefined) {
      if (newConfig.GRACE_PERIOD_HOURS < 0 || newConfig.GRACE_PERIOD_HOURS > 168) {
        throw new Error('Grace period must be between 0 and 168 hours (1 week)');
      }
    }

    if (newConfig.MAX_PENALTY_DAYS !== undefined) {
      if (newConfig.MAX_PENALTY_DAYS < 1 || newConfig.MAX_PENALTY_DAYS > 3650) {
        throw new Error('Max penalty days must be between 1 and 3650 days (10 years)');
      }
    }

    // Update configuration
    Object.assign(PENALTY_CONFIG, newConfig);

    return this.getConfig();
  }

  /**
   * Get penalty rate as percentage
   * @returns {number} Penalty rate as percentage
   */
  static getPenaltyRatePercentage() {
    return PENALTY_CONFIG.RATE_PER_DAY * 100;
  }

  /**
   * Get grace period in days
   * @returns {number} Grace period in days
   */
  static getGracePeriodDays() {
    return PENALTY_CONFIG.GRACE_PERIOD_HOURS / 24;
  }

  /**
   * Check if penalty system is enabled
   * @returns {boolean} True if penalty system is enabled
   */
  static isEnabled() {
    return PENALTY_CONFIG.ENABLED;
  }

  /**
   * Enable or disable penalty system
   * @param {boolean} enabled - Whether to enable the penalty system
   */
  static setEnabled(enabled) {
    PENALTY_CONFIG.ENABLED = enabled;
  }

  /**
   * Get formatted penalty information for display
   * @returns {Object} Formatted penalty information
   */
  static getFormattedConfig() {
    return {
      rate: `${this.getPenaltyRatePercentage().toFixed(1)}% per day`,
      gracePeriod: `${this.getGracePeriodDays()} day${this.getGracePeriodDays() !== 1 ? 's' : ''}`,
      maxDays: `${PENALTY_CONFIG.MAX_PENALTY_DAYS} days`,
      currency: PENALTY_CONFIG.CURRENCY,
      enabled: PENALTY_CONFIG.ENABLED
    };
  }

  /**
   * Calculate penalty for given parameters
   * @param {number} amount - Repayment amount
   * @param {Date} dueDate - Due date
   * @param {Date} paymentDate - Payment date
   * @returns {Object} Penalty calculation result
   */
  static calculatePenalty(amount, dueDate, paymentDate = new Date()) {
    if (!PENALTY_CONFIG.ENABLED) {
      return {
        isLate: false,
        penaltyDays: 0,
        penaltyAmount: 0,
        totalRepayment: amount,
        gracePeriodUsed: false,
        penaltyRate: 0,
        dueDate,
        paymentDate
      };
    }

    // Ensure dates are Date objects
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    
    // Calculate time difference in milliseconds
    const timeDiff = payment.getTime() - due.getTime();
    
    // Convert to days
    const totalDaysLate = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Apply grace period
    const gracePeriodMs = PENALTY_CONFIG.GRACE_PERIOD_HOURS * 60 * 60 * 1000;
    const effectiveLateTime = timeDiff - gracePeriodMs;
    
    // Calculate penalty days (only count days after grace period)
    const penaltyDays = Math.max(0, Math.floor(effectiveLateTime / (1000 * 60 * 60 * 1000)));
    
    // Cap penalty days to prevent excessive accumulation
    const cappedPenaltyDays = Math.min(penaltyDays, PENALTY_CONFIG.MAX_PENALTY_DAYS);
    
    // Calculate penalty amount
    const penaltyAmount = amount * PENALTY_CONFIG.RATE_PER_DAY * cappedPenaltyDays;
    
    // Calculate total repayment
    const totalRepayment = amount + penaltyAmount;
    
    return {
      isLate: penaltyDays > 0,
      totalDaysLate,
      penaltyDays: cappedPenaltyDays,
      penaltyAmount: Math.round(penaltyAmount * 100) / 100, // Round to 2 decimal places
      totalRepayment: Math.round(totalRepayment * 100) / 100,
      gracePeriodUsed: totalDaysLate > 0 && penaltyDays === 0,
      penaltyRate: PENALTY_CONFIG.RATE_PER_DAY,
      dueDate: due,
      paymentDate: payment
    };
  }

  /**
   * Get penalty configuration for API responses
   * @returns {Object} API-friendly configuration
   */
  static getApiConfig() {
    return {
      ratePerDay: PENALTY_CONFIG.RATE_PER_DAY,
      ratePercentage: this.getPenaltyRatePercentage(),
      gracePeriodHours: PENALTY_CONFIG.GRACE_PERIOD_HOURS,
      gracePeriodDays: this.getGracePeriodDays(),
      maxPenaltyDays: PENALTY_CONFIG.MAX_PENALTY_DAYS,
      currency: PENALTY_CONFIG.CURRENCY,
      enabled: PENALTY_CONFIG.ENABLED,
      formatted: this.getFormattedConfig()
    };
  }
}

module.exports = PenaltyConfigService;
