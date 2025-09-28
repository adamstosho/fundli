# Investment Flow Test Guide

## Overview
This guide tests the complete flow of loan funding and investment tracking.

## Test Steps

### 1. **Lender Funds a Loan**
- Login as a lender
- Go to Browse Loans (`/marketplace/browse`)
- Find an available loan
- Fund the loan completely
- Verify loan status changes to 'funded'

### 2. **Verify Loan Removal from Browse**
- Check that the funded loan no longer appears in Browse Loans
- Only active, non-fully-funded loans should be visible

### 3. **Check My Investments Page**
- Navigate to My Investments (`/lender/investments`)
- Verify the funded loan appears in the investments list
- Check that all loan details are displayed correctly

### 4. **Verify Investment Details**
- Click "View Details" on any investment
- Verify the modal shows:
  - Investment summary (purpose, borrower, amount, interest rate)
  - Repayment information (total repayment, amount paid, amount remaining)
  - Due date and days until due
  - Repayment progress bar
  - Investment timeline (funded date, start date, end date)

### 5. **Check Dashboard Integration**
- Verify "My Investments" quick action appears in lender dashboard
- Verify sidebar navigation includes "My Investments" link
- Check that stats are updated (total invested, active investments, etc.)

## Expected Results

### Browse Loans Page
- ✅ Only shows active loans with funding progress < 100%
- ✅ Fully funded loans are filtered out
- ✅ Shows available lending pools only

### My Investments Page
- ✅ Shows all loans funded by the current lender
- ✅ Displays comprehensive investment details
- ✅ Shows repayment progress and due dates
- ✅ Calculates and displays ROI information
- ✅ Provides detailed investment timeline

### Dashboard Integration
- ✅ Quick action card for "My Investments"
- ✅ Sidebar navigation link
- ✅ Updated investment statistics

## API Endpoints Used
- `GET /api/lender/funded-loans` - Fetches lender's funded loans
- `GET /api/pools` - Fetches available lending pools (filtered)
- `POST /api/lender/loan/:id/invest` - Funds a loan

## Notes
- The system automatically updates loan status to 'funded' when fully funded
- Funded loans are immediately removed from browse loans
- Investment details include all repayment information for tracking
- Progress bars show repayment completion percentage
- Due dates and days remaining are calculated and displayed
