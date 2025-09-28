// Test script to verify message alignment in admin chat
// This script helps debug message alignment issues

const testMessageAlignment = () => {
  console.log('🧪 Testing Message Alignment in Admin Chat...\n');

  // Sample message data structure
  const sampleMessages = [
    {
      _id: 'msg1',
      content: 'Hello from admin',
      sender: {
        _id: 'admin123',
        firstName: 'Admin',
        lastName: 'User'
      },
      createdAt: new Date()
    },
    {
      _id: 'msg2', 
      content: 'Hello back from lender',
      sender: {
        _id: 'lender456',
        firstName: 'Usman',
        lastName: 'Abdullah'
      },
      createdAt: new Date()
    }
  ];

  const currentUser = {
    id: 'lender456',
    firstName: 'Usman',
    lastName: 'Abdullah'
  };

  console.log('📋 Testing message alignment logic:');
  
  sampleMessages.forEach((message, index) => {
    const senderId = message.sender._id || message.sender.id;
    const userId = currentUser.id || currentUser._id;
    const isOwn = senderId === userId || senderId?.toString() === userId?.toString();
    
    console.log(`Message ${index + 1}:`, {
      content: message.content.substring(0, 20) + '...',
      senderId: senderId,
      userId: userId,
      isOwn: isOwn,
      alignment: isOwn ? 'RIGHT (own message)' : 'LEFT (received message)',
      senderName: `${message.sender.firstName} ${message.sender.lastName}`
    });
  });

  console.log('\n✅ Expected Results:');
  console.log('- Admin messages should appear on the LEFT (received)');
  console.log('- Lender messages should appear on the RIGHT (own)');
  console.log('- Messages should have different background colors');
  console.log('- Sender names should be visible on received messages');
};

// Manual testing instructions
console.log(`
🔧 Manual Testing Instructions:

1. **Open Admin Chat:**
   - Login as admin
   - Start chat with lender "usman abdullah"
   - Send a test message

2. **Check Lender Side:**
   - Login as lender "usman abdullah"
   - Go to Messages page
   - Open the admin chat
   - Verify message alignment:
     * Admin messages should be on the LEFT with light background
     * Lender messages should be on the RIGHT with blue background
     * Sender names should be visible on admin messages

3. **Visual Indicators:**
   - LEFT side: Light gray background, sender name visible
   - RIGHT side: Blue background, no sender name
   - Messages should alternate sides based on who sent them

4. **Debug Console:**
   - Open browser dev tools (F12)
   - Check console for "Message alignment check" logs
   - Verify isOwn values are correct for each message

📝 Note: If messages still appear on the same side, check the console logs to see if the user ID comparison is working correctly.
`);

// Uncomment to run the test
// testMessageAlignment();

module.exports = { testMessageAlignment };
