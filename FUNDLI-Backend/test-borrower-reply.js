const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fundli', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const User = require('./src/models/User');
const Feedback = require('./src/models/Feedback');

async function testBorrowerReply() {
  try {
    console.log('Testing borrower reply functionality...');
    
    // Find borrower user
    const borrower = await User.findOne({ userType: 'borrower' });
    if (!borrower) {
      console.log('❌ No borrower user found');
      return;
    }
    
    console.log('Found borrower:', borrower.email, borrower.userType);
    
    // Find a feedback message to reply to
    const feedback = await Feedback.findOne({ recipient: borrower._id });
    if (!feedback) {
      console.log('❌ No feedback found for borrower to reply to');
      return;
    }
    
    console.log('Found feedback to reply to:', feedback._id, feedback.subject);
    
    // Create JWT token for borrower
    const token = jwt.sign(
      { 
        id: borrower._id, 
        userType: borrower.userType,
        email: borrower.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('Generated borrower token:', token.substring(0, 50) + '...');
    
    // Test reply API call
    const replyData = {
      message: 'This is a test reply from borrower to admin',
      subject: 'Re: ' + feedback.subject
    };
    
    console.log('Sending reply with data:', replyData);
    
    const response = await axios.post(`https://fundli-hjqn.vercel.app/api/feedback/${feedback._id}/reply`, replyData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Reply API call successful!');
    console.log('Response:', response.data);
    
    // Check if reply was saved in database
    const savedReply = await Feedback.findById(response.data.data.feedback.id);
    if (savedReply) {
      console.log('✅ Reply saved to database:', savedReply._id);
      console.log('Reply details:', {
        sender: savedReply.sender,
        recipient: savedReply.recipient,
        subject: savedReply.subject,
        message: savedReply.message,
        isReply: savedReply.isReply,
        parentFeedback: savedReply.parentFeedback
      });
    } else {
      console.log('❌ Reply not found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    mongoose.connection.close();
  }
}

testBorrowerReply();


