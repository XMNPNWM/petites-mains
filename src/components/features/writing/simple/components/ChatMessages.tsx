
import React, { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  selectedText?: string;
}

const ChatMessages = ({ messages, selectedText }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="text-center text-slate-500 mt-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Start a conversation with AI about your story</p>
          {selectedText && (
            <p className="text-xs mt-1">Context: "{selectedText}"</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            <p className={`text-xs mt-1 opacity-70`}>
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
