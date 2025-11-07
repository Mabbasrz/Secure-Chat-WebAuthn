import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useCrypto } from '../hooks/useCrypto';
import { UserList } from '../components/UserList';
import { ChatWindow } from '../components/ChatWindow';
import { MessageInput } from '../components/MessageInput';

export function ChatPage() {
  const { user, logout, token } = useAuth();
  const { socket, emit, on, off } = useSocket(token, user?.id);
  const { encryptMessage, decryptMessage, getPublicKeyB64 } = useCrypto();
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Fetch message history when user is selected
  useEffect(() => {
    if (!selectedUser || !token) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/${selectedUser._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser, token]);

  // Listen to incoming messages
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      // Verify message is from selected user
      if (selectedUser && (message.sender === selectedUser._id || message.sender === selectedUser.id)) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserJoined = (data) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === data.userId)) {
          return prev;
        }
        return [...prev, { id: data.userId, username: data.username }];
      });
    };

    const handleUserDisconnected = (data) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
    };

    const handleTyping = (data) => {
      if (selectedUser && data.sender === selectedUser._id) {
        setTypingUsers((prev) => new Set(prev).add(data.sender));
      }
    };

    const handleStopTyping = (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.sender);
        return next;
      });
    };

    on('receive-message', handleReceiveMessage);
    on('user-joined', handleUserJoined);
    on('user-disconnected', handleUserDisconnected);
    on('typing', handleTyping);
    on('stop-typing', handleStopTyping);

    return () => {
      off('receive-message', handleReceiveMessage);
      off('user-joined', handleUserJoined);
      off('user-disconnected', handleUserDisconnected);
      off('typing', handleTyping);
      off('stop-typing', handleStopTyping);
    };
  }, [selectedUser, on, off]);

  const handleSendMessage = async (messageText) => {
    if (!selectedUser || !messageText.trim()) return;

    try {
      // Encrypt message with recipient's public key
      const encrypted = encryptMessage(messageText, selectedUser.publicKeyForEncryption);

      // Send via Socket.IO for real-time delivery
      emit('send-message', {
        sender: user.id,
        receiver: selectedUser._id || selectedUser.id,
        encryptedContent: encrypted.encryptedContent,
        nonce: encrypted.nonce,
      });

      // Add to local messages
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now(),
          sender: user.id,
          receiver: selectedUser._id || selectedUser.id,
          encryptedContent: encrypted.encryptedContent,
          nonce: encrypted.nonce,
          createdAt: new Date(),
          content: messageText, // Store plaintext for display
        },
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (selectedUser) {
      emit('typing', { receiver: selectedUser._id || selectedUser.id });
    }
  };

  const handleStopTyping = () => {
    if (selectedUser) {
      emit('stop-typing', { receiver: selectedUser._id || selectedUser.id });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-600">🔐 CrypTalk</h1>
              <p className="text-xs text-gray-600">Secured & Encrypted</p>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition"
            >
              Logout
            </button>
          </div>
          <p className="text-sm text-gray-700 mt-2 font-medium">{user?.username}</p>
        </div>        <UserList
          users={onlineUsers}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedUser.username}</h2>
                <p className="text-sm text-gray-500">
                  {selectedUser.online ? '🟢 Online' : '⚫ Offline'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ChatWindow
              messages={messages}
              currentUser={user}
              selectedUser={selectedUser}
              loading={loading}
              typingUsers={typingUsers}
              decryptMessage={decryptMessage}
            />

            {/* Input */}
            <MessageInput
              onSend={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a user from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
