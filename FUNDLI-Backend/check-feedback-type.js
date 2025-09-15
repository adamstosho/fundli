const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Feedback = require('./src/models/Feedback');

async function checkFeedbackType() {
  try {
    console.log('Checking feedback types in database...');
    
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).limit(5);
    
    console.log(`Found ${feedbacks.length} feedback records:`);
    
    feedbacks.forEach((fb, index) => {
      console.log(`\nFeedback ${index + 1}:`);
      console.log('  ID:', fb._id);
      console.log('  Type:', fb.type || 'NULL');
      console.log('  Subject:', fb.subject);
      console.log('  Sender:', fb.sender);
      console.log('  Recipient:', fb.recipient);
      console.log('  IsReply:', fb.isReply);
      console.log('  Created:', fb.createdAt);
    });
    
    // Find feedback without type
    const feedbackWithoutType = await Feedback.findOne({ type: { $exists: false } });
    if (feedbackWithoutType) {
      console.log('\n❌ Found feedback without type field:', feedbackWithoutType._id);
    } else {
      console.log('\n✅ All feedback records have type field');
    }
    
    // Find feedback with null type
    const feedbackWithNullType = await Feedback.findOne({ type: null });
    if (feedbackWithNullType) {
      console.log('\n❌ Found feedback with null type:', feedbackWithNullType._id);
    } else {
      console.log('\n✅ No feedback records have null type');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkFeedbackType();


