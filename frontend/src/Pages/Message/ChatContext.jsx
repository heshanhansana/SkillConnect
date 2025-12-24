import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Provider component
export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Initialize socket and get current user from localStorage
  useEffect(() => {
    // Get logged in user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
    }

    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Register user when socket and currentUser are ready
  useEffect(() => {
    if (socket && currentUser?.id) {
      socket.emit('user_online', currentUser.id);
    }
  }, [socket, currentUser]);

  // Fetch conversations when currentUser is set
  useEffect(() => {
    if (currentUser?.id) {
      fetchConversations();
      fetchUsers();
    }
  }, [currentUser]);

  // Join conversation room when selected
  useEffect(() => {
    if (socket && selectedChat?._id) {
      socket.emit('join_conversation', selectedChat._id);
      fetchMessages(selectedChat._id);

      return () => {
        socket.emit('leave_conversation', selectedChat._id);
      };
    }
  }, [socket, selectedChat?._id]);

  // Listen for new messages
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        
        // Update chat list with last message
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat._id === newMessage.conversationId
              ? { ...chat, lastMessage: newMessage.text, lastMessageTime: newMessage.createdAt }
              : chat
          )
        );
      });

      return () => {
        socket.off('new_message');
      };
    }
  }, [socket]);

  // Fetch all users for new chats
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_URL}/users`);
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch conversations for the current user
  const fetchConversations = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/conversations/${currentUser.id}`);
      const data = await response.json();
      if (data.success) {
        // Format conversations for display
        const formattedChats = data.conversations.map((conv) => {
          const otherParticipant = conv.participants.find(
            (p) => p._id !== currentUser.id
          );
          return {
            ...conv,
            name: otherParticipant 
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : 'Unknown User',
            otherUser: otherParticipant,
            message: conv.lastMessage || 'No messages yet',
            time: formatTime(conv.lastMessageTime),
            unread: 0,
            color: getRandomColor(),
          };
        });
        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await fetch(`${API_URL}/messages/${conversationId}`);
      const data = await response.json();
      if (data.success) {
        // Format messages for display
        const formattedMessages = data.messages.map((msg) => ({
          id: msg._id,
          text: msg.text,
          time: formatTime(msg.createdAt),
          sender: msg.senderId._id === currentUser?.id ? 'me' : msg.senderId.firstName,
          senderId: msg.senderId._id,
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Create or get conversation with another user
  const startConversation = async (otherUserId) => {
    if (!currentUser?.id) return null;
    
    try {
      const response = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant1: currentUser.id,
          participant2: otherUserId,
        }),
      });
      const data = await response.json();
      if (data.success) {
        // Refresh conversations
        await fetchConversations();
        
        // Find and select the new conversation
        const otherParticipant = data.conversation.participants.find(
          (p) => p._id !== currentUser.id
        );
        const formattedChat = {
          ...data.conversation,
          name: otherParticipant 
            ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
            : 'Unknown User',
          otherUser: otherParticipant,
          message: data.conversation.lastMessage || 'No messages yet',
          time: formatTime(data.conversation.lastMessageTime),
          unread: 0,
          color: getRandomColor(),
        };
        setSelectedChat(formattedChat);
        return formattedChat;
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
    return null;
  };

  const handleSelectChat = useCallback((chat) => {
    setSelectedChat(chat);
  }, []);

  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !selectedChat?._id || !currentUser?.id) return;

    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat._id,
          senderId: currentUser.id,
          text: messageText,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        console.error('Error sending message:', data.message);
      }
      // Message will be added via socket event
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Helper function to format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Helper function for random colors
  const getRandomColor = () => {
    const colors = ['bg-gray-200', 'bg-blue-200', 'bg-green-200', 'bg-purple-200', 'bg-pink-200', 'bg-yellow-200'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const value = {
    chats,
    selectedChat,
    messages,
    users,
    loading,
    currentUser,
    onSelectChat: handleSelectChat,
    onSendMessage: handleSendMessage,
    startConversation,
    refreshConversations: fetchConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// custom hook
export const useChat = () => {
  return useContext(ChatContext);
};