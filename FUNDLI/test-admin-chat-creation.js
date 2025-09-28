// Test script to verify admin chat creation and visibility
const testAdminChatCreation = async () => {
  console.log('🧪 Testing Admin Chat Creation...\n');

  try {
    // Step 1: Admin creates chat with lender
    console.log('📋 Step 1: Admin creating chat with lender');
    
    const adminToken = 'your-admin-token'; // Replace with actual admin token
    const lenderId = 'your-lender-id'; // Replace with actual lender ID
    
    const createResponse = await fetch('http://localhost:5000/api/chat/chats/admin/' + lenderId, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetUserType: 'lender'
      })
    });

    if (createResponse.ok) {
      const chatData = await createResponse.json();
      console.log('✅ Admin chat created:', {
        chatId: chatData.data.chat.id,
        participants: chatData.data.chat.participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`),
        chatType: chatData.data.chat.chatType
      });
      
      // Step 2: Check if lender can see the chat
      console.log('\n📋 Step 2: Lender fetching chats');
      
      const lenderToken = 'your-lender-token'; // Replace with actual lender token
      
      const getChatsResponse = await fetch('http://localhost:5000/api/chat/chats', {
        headers: { 'Authorization': `Bearer ${lenderToken}` }
      });

      if (getChatsResponse.ok) {
        const chatsData = await getChatsResponse.json();
        const adminChats = chatsData.data.chats.filter(chat => chat.chatType === 'admin_support');
        
        console.log(`📊 Total chats found: ${chatsData.data.chats.length}`);
        console.log(`📊 Admin chats found: ${adminChats.length}`);
        
        if (adminChats.length > 0) {
          console.log('✅ Lender can see admin chats');
          adminChats.forEach((chat, index) => {
            console.log(`  Admin Chat ${index + 1}:`, {
              id: chat._id,
              participants: chat.participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`),
              chatType: chat.chatType,
              unreadCount: chat.unreadCount
            });
          });
        } else {
          console.log('❌ Lender cannot see admin chats');
          console.log('📊 All chats:', chatsData.data.chats.map(c => ({
            id: c._id,
            chatType: c.chatType,
            participants: c.participants?.map(p => `${p.firstName} ${p.lastName} (${p.userType})`)
          })));
        }
      } else {
        console.log('❌ Failed to fetch lender chats');
      }
      
      // Step 3: Test message sending
      console.log('\n📋 Step 3: Testing message sending');
      
      const messageResponse = await fetch(`http://localhost:5000/api/chat/chats/${chatData.data.chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'Test message from admin',
          type: 'text'
        })
      });

      if (messageResponse.ok) {
        console.log('✅ Message sent successfully');
      } else {
        console.log('❌ Failed to send message');
      }
      
    } else {
      console.log('❌ Failed to create admin chat');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Manual testing instructions
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
   - Refresh the page if needed
   - Check if admin chat appears in the chat list
   - Click on the admin chat to open it
   - Verify messages from admin are visible

3. **Debug Steps:**
   - Check browser console for any errors
   - Verify Socket.IO connection is working
   - Check if chat is being created in database
   - Verify both users are participants in the chat

4. **Expected Results:**
   - Admin chat should appear in lender's chat list
   - Chat should be labeled as "Admin Support Chat"
   - Messages from admin should be visible to lender
   - Real-time updates should work via Socket.IO

📝 Note: The key difference from regular chats is that admin chats use 'admin_support' chatType instead of 'loan_discussion' or 'pool_discussion'.
`);

// Uncomment to run the test
// testAdminChatCreation();

module.exports = { testAdminChatCreation };
