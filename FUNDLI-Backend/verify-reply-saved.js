const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Feedback = require('./src/models/Feedback');

async function verifyReplySaved() {
  try {
    console.log('Verifying reply was saved to database...');
    
    // Find all feedback records
    const allFeedback = await Feedback.find().sort({ createdAt: -1 });
    
    console.log(`Found ${allFeedback.length} total feedback records:`);
    
    allFeedback.forEach((fb, index) => {
      console.log(`\nFeedback ${index + 1}:`);
      console.log('  ID:', fb._id);
      console.log('  Type:', fb.type);
      console.log('  Subject:', fb.subject);
      console.log('  Message:', fb.message.substring(0, 50) + '...');
      console.log('  Sender:', fb.sender);
      console.log('  Recipient:', fb.recipient);
      console.log('  IsReply:', fb.isReply);
      console.log('  ParentFeedback:', fb.parentFeedback);
      console.log('  Created:', fb.createdAt);
    });
    
    // Find replies specifically
    const replies = await Feedback.find({ isReply: true });
    console.log(`\nFound ${replies.length} reply records:`);
    
    replies.forEach((reply, index) => {
      console.log(`\nReply ${index + 1}:`);
      console.log('  ID:', reply._id);
      console.log('  Type:', reply.type);
      console.log('  Subject:', reply.subject);
      console.log('  Message:', reply.message);
      console.log('  ParentFeedback:', reply.parentFeedback);
      console.log('  Created:', reply.createdAt);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

verifyReplySaved();


