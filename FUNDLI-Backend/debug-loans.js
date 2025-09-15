const mongoose = require('mongoose');
const Loan = require('./src/models/Loan');
const Notification = require('./src/models/Notification');
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://fundli:fundli123@cluster0.vixdbhc.mongodb.net/fundli?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function debugLoans() {
  try {
    console.log('🔍 Debugging loans and notifications...');
    
    // Check all loans
    const allLoans = await Loan.find({}).populate('borrower', 'firstName lastName email userType');
    console.log('📊 Total loans in database:', allLoans.length);
    
    allLoans.forEach(loan => {
      console.log(`  - Loan ${loan._id}: ${loan.status} | Borrower: ${loan.borrower?.firstName} ${loan.borrower?.lastName} | Amount: $${loan.loanAmount} | Purpose: ${loan.purpose}`);
    });
    
    // Check pending loans
    const pendingLoans = await Loan.find({ status: 'pending' }).populate('borrower', 'firstName lastName email userType');
    console.log('⏳ Pending loans:', pendingLoans.length);
    
    // Check approved loans
    const approvedLoans = await Loan.find({ status: 'approved' }).populate('borrower', 'firstName lastName email userType');
    console.log('✅ Approved loans:', approvedLoans.length);
    
    // Check all notifications
    const allNotifications = await Notification.find({}).populate('recipient', 'firstName lastName email userType');
    console.log('🔔 Total notifications in database:', allNotifications.length);
    
    allNotifications.forEach(notif => {
      console.log(`  - Notification ${notif._id}: ${notif.title} | Type: ${notif.type} | Recipient: ${notif.recipient?.firstName} ${notif.recipient?.lastName} | Status: ${notif.status}`);
    });
    
    // Check lender users
    const lenders = await User.find({ userType: 'lender' });
    console.log('👥 Lender users:', lenders.length);
    lenders.forEach(lender => {
      console.log(`  - Lender: ${lender.firstName} ${lender.lastName} (${lender.email})`);
    });
    
    // Check borrower users
    const borrowers = await User.find({ userType: 'borrower' });
    console.log('👤 Borrower users:', borrowers.length);
    borrowers.forEach(borrower => {
      console.log(`  - Borrower: ${borrower.firstName} ${borrower.lastName} (${borrower.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugLoans();

