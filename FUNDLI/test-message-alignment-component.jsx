// Test component to verify message alignment
import React from 'react';

const TestMessageAlignment = () => {
  const testMessages = [
    { id: 1, content: "Hello from admin", sender: "admin", isOwn: false },
    { id: 2, content: "Hello back from lender", sender: "lender", isOwn: true },
    { id: 3, content: "How can I help?", sender: "admin", isOwn: false },
    { id: 4, content: "I need assistance", sender: "lender", isOwn: true }
  ];

  return (
    <div className="p-4 space-y-4 w-full">
      <h3 className="text-lg font-bold mb-4">Message Alignment Test</h3>
      
      {testMessages.map((message) => (
        <div 
          key={message.id}
          className={`flex w-full ${message.isOwn ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${
            message.isOwn 
              ? 'bg-primary-600 text-white border border-primary-500' 
              : 'bg-neutral-100 text-secondary-900 border border-neutral-200'
          }`}>
            <div className="text-xs font-medium mb-1">
              {message.sender} {message.isOwn ? '(OWN)' : '(RECEIVED)'}
            </div>
            <div className="text-sm">{message.content}</div>
          </div>
        </div>
      ))}
      
      <div className="mt-8 p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h4 className="font-bold text-yellow-800">Expected Results:</h4>
        <ul className="text-sm text-yellow-700 mt-2">
          <li>• Admin messages should be on the LEFT (light background)</li>
          <li>• Lender messages should be on the RIGHT (blue background)</li>
          <li>• Messages should alternate sides properly</li>
        </ul>
      </div>
    </div>
  );
};

export default TestMessageAlignment;
