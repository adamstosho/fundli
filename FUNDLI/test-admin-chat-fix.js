// Test script to verify admin chat functionality
// This script tests the chat API endpoints to ensure admin chats are properly created and accessible

const testAdminChatFix = async () => {
  console.log('🧪 Testing Admin Chat Fix...\n');

  try {
    // Test 1: Check if admin can create chat with lender
    console.log('📋 Test 1: Admin creating chat with lender');
    
    const adminToken = 'your-admin-token-here'; // Replace with actual admin token
    const lenderId = 'your-lender-id-here'; // Replace with actual lender ID
    
    const createChatResponse = await fetch('http://localhost:5000/api/chat/chats/admin/' + lenderId, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUserType: 'lender'
      })
    });

    if (createChatResponse.ok) {
      const chatData = await createChatResponse.json();
      console.log('✅ Admin chat created successfully:', chatData.data.chat.id);
      
      // Test 2: Check if lender can see the admin chat
      console.log('\n📋 Test 2: Lender fetching chats');
      
      const lenderToken = 'your-lender-token-here'; // Replace with actual lender token
      
      const getChatsResponse = await fetch('http://localhost:5000/api/chat/chats', {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });

      if (getChatsResponse.ok) {
        const chatsData = await getChatsResponse.json();
        const adminChats = chatsData.data.chats.filter(chat => chat.chatType === 'admin_support');
        
        if (adminChats.length > 0) {
          console.log('✅ Lender can see admin chats:', adminChats.length);
          console.log('📊 Admin chat details:', {
            id: adminChats[0]._id,
            participants: adminChats[0].participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`),
            chatType: adminChats[0].chatType
          });
        } else {
          console.log('❌ Lender cannot see admin chats');
        }
      } else {
        console.log('❌ Failed to fetch lender chats');
      }
      
    } else {
      console.log('❌ Failed to create admin chat');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Instructions for manual testing
console.log(`
🔧 Manual Testing Instructions:

1. **Admin Side:**
   - Login as admin
   - Go to admin dashboard
   - Find a lender (e.g., "usman abdullah")
   - Click "Chat" button to start admin chat
   - Send a test message

2. **Lender Side:**
   - Login as the lender
   - Go to Messages page (/chat)
   - Check if admin chat appears in the chat list
   - Click on the admin chat to open it
   - Verify messages from admin are visible

3. **Expected Results:**
   - Admin chat should appear in lender's chat list
   - Chat should be labeled as "Admin Support Chat"
   - Messages from admin should be visible to lender
   - Real-time updates should work via Socket.IO

📝 Note: Replace the token and ID placeholders in this script with actual values for automated testing.
`);

// Uncomment the line below to run the test
// testAdminChatFix();

module.exports = { testAdminChatFix };
