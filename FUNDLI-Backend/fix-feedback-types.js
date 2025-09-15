const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Feedback = require('./src/models/Feedback');
const User = require('./src/models/User');

async function fixFeedbackTypes() {
  try {
    console.log('Fixing feedback types...');
    
    // Find all feedback without type or with null type
    const feedbacksToFix = await Feedback.find({
      $or: [
        { type: { $exists: false } },
        { type: null }
      ]
    });
    
    console.log(`Found ${feedbacksToFix.length} feedback records to fix`);
    
    for (const feedback of feedbacksToFix) {
      console.log(`\nFixing feedback ${feedback._id}:`);
      console.log('  Subject:', feedback.subject);
      console.log('  Sender:', feedback.sender);
      console.log('  Recipient:', feedback.recipient);
      
      // Get sender and recipient user types
      const sender = await User.findById(feedback.sender);
      const recipient = await User.findById(feedback.recipient);
      
      if (!sender || !recipient) {
        console.log('  ❌ Could not find sender or recipient user');
        continue;
      }
      
      console.log('  Sender type:', sender.userType);
      console.log('  Recipient type:', recipient.userType);
      
      // Determine the correct type
      let correctType;
      if (sender.userType === 'admin' && recipient.userType === 'borrower') {
        correctType = 'admin_to_borrower';
      } else if (sender.userType === 'admin' && recipient.userType === 'lender') {
        correctType = 'admin_to_lender';
      } else if (sender.userType === 'borrower' && recipient.userType === 'admin') {
        correctType = 'borrower_to_admin';
      } else if (sender.userType === 'lender' && recipient.userType === 'admin') {
        correctType = 'lender_to_admin';
      } else {
        console.log('  ❌ Unknown sender/recipient combination');
        continue;
      }
      
      // Update the feedback
      feedback.type = correctType;
      await feedback.save();
      
      console.log('  ✅ Updated type to:', correctType);
    }
    
    console.log('\n✅ All feedback types fixed!');
    
    // Verify the fix
    const remainingNullTypes = await Feedback.countDocuments({
      $or: [
        { type: { $exists: false } },
        { type: null }
      ]
    });
    
    console.log(`Remaining feedback with null types: ${remainingNullTypes}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixFeedbackTypes();


