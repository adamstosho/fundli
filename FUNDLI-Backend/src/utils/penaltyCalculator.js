/**
 * Penalty Calculator Utility
 * Handles late repayment penalty calculations
 */

const PenaltyConfigService = require('../services/penaltyConfigService');

/**
 * Calculate penalty for late repayment
 * @param {number} repaymentAmount - Original repayment amount
 * @param {Date} dueDate - Due date for repayment
 * @param {Date} paymentDate - Actual payment date
 * @returns {Object} Penalty calculation result
 */
function calculatePenalty(repaymentAmount, dueDate, paymentDate = new Date()) {
  return PenaltyConfigService.calculatePenalty(repaymentAmount, dueDate, paymentDate);
}

/**
 * Calculate penalty for a specific number of days
 * @param {number} repaymentAmount - Original repayment amount
 * @param {number} penaltyDays - Number of penalty days
 * @returns {Object} Penalty calculation result
 */
function calculatePenaltyByDays(repaymentAmount, penaltyDays) {
  const config = PenaltyConfigService.getConfig();
  const cappedPenaltyDays = Math.min(penaltyDays, config.MAX_PENALTY_DAYS);
  const penaltyAmount = repaymentAmount * config.RATE_PER_DAY * cappedPenaltyDays;
  const totalRepayment = repaymentAmount + penaltyAmount;
  
  return {
    penaltyDays: cappedPenaltyDays,
    penaltyAmount: Math.round(penaltyAmount * 100) / 100,
    totalRepayment: Math.round(totalRepayment * 100) / 100,
    penaltyRate: config.RATE_PER_DAY
  };
}

/**
 * Get current penalty for a loan (real-time calculation)
 * @param {Object} loan - Loan object with due date and amount
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {Object} Current penalty status
 */
function getCurrentPenalty(loan, currentDate = new Date()) {
  if (!loan.dueDate || !loan.repaymentAmount) {
    return {
      isLate: false,
      penaltyDays: 0,
      penaltyAmount: 0,
      totalRepayment: loan.repaymentAmount || 0
    };
  }
  
  return calculatePenalty(loan.repaymentAmount, loan.dueDate, currentDate);
}

/**
 * Update penalty configuration
 * @param {Object} newConfig - New configuration object
 */
function updatePenaltyConfig(newConfig) {
  return PenaltyConfigService.updateConfig(newConfig);
}

/**
 * Get current penalty configuration
 * @returns {Object} Current penalty configuration
 */
function getPenaltyConfig() {
  return PenaltyConfigService.getConfig();
}

/**
 * Format penalty information for display
 * @param {Object} penaltyResult - Result from calculatePenalty
 * @returns {Object} Formatted penalty information
 */
function formatPenaltyInfo(penaltyResult) {
  return {
    isLate: penaltyResult.isLate,
    daysLate: penaltyResult.penaltyDays,
    penaltyAmount: penaltyResult.penaltyAmount,
    totalAmount: penaltyResult.totalRepayment,
    gracePeriodUsed: penaltyResult.gracePeriodUsed,
    formattedPenalty: `$${penaltyResult.penaltyAmount.toFixed(2)}`,
    formattedTotal: `$${penaltyResult.totalRepayment.toFixed(2)}`,
    penaltyRate: `${(penaltyResult.penaltyRate * 100).toFixed(1)}% per day`
  };
}

module.exports = {
  calculatePenalty,
  calculatePenaltyByDays,
  getCurrentPenalty,
  updatePenaltyConfig,
  getPenaltyConfig,
  formatPenaltyInfo
};
