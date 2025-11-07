import React, { useEffect, useRef } from 'react';

export function ChatWindow({
  messages,
  currentUser,
  selectedUser,
  loading,
  typingUsers,
  decryptMessage,
}) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const decryptedMessages = messages.map((msg) => {
    try {
      if (msg.content) {
        // Already decrypted (sent by current user)
        return { ...msg, decryptedContent: msg.content };
      }

      // Decrypt received message
      const decrypted = decryptMessage(
        msg.encryptedContent,
        msg.nonce,
        msg.sender === currentUser.id
          ? currentUser.publicKeyForEncryption
          : selectedUser.publicKeyForEncryption
      );

      return { ...msg, decryptedContent: decrypted };
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      return { ...msg, decryptedContent: '[Decryption failed]' };
    }
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-gray-50">
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin">
            <svg className="w-8 h-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
      ) : decryptedMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">👋</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        </div>
      ) : (
        decryptedMessages.map((msg, idx) => {
          const isSender = msg.sender === currentUser.id;
          return (
            <div key={idx} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isSender
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-300 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="break-words">{msg.decryptedContent}</p>
                <p className={`text-xs mt-1 ${isSender ? 'text-blue-100' : 'text-gray-600'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })
      )}

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="flex justify-start">
          <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
