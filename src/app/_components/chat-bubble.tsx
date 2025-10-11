import React from 'react';

// ChatBubble component for messaging UI
interface ChatBubbleProps {
  message: string;
  fromUser?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, fromUser = false }) => (
  <div className={`chat ${fromUser ? 'chat-end' : 'chat-start'}`}>
    <div className={`chat-bubble ${fromUser ? 'bg-primary text-white' : 'bg-base-200 text-base-content'}`}>{message}</div>
  </div>
);

export default ChatBubble;

// ElectricBorderCard component for subscribed users
export const ElectricBorderCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative p-1 rounded-xl bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 animate-pulse">
    <div className="bg-base-100 rounded-xl p-4">
      {children}
    </div>
  </div>
);
