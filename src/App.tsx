import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import CryptoJS from 'crypto-js';
import { Send, Lock } from 'lucide-react';

// Encryption key - in a real app, this should be securely exchanged
const ENCRYPTION_KEY = 'your-secret-key-2024';

interface Message {
  text: string;
  sender: string;
  timestamp: number;
  isMine: boolean;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (data) => {
      const decryptedMessage = CryptoJS.AES.decrypt(data.message, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      
      setMessages(prev => [...prev, {
        text: decryptedMessage,
        sender: data.sender,
        timestamp: data.timestamp,
        isMine: false
      }]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim()) return;

    const encryptedMessage = CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();

    socket.emit('send_message', {
      message: encryptedMessage
    });

    setMessages(prev => [...prev, {
      text: message,
      sender: socket.id,
      timestamp: Date.now(),
      isMine: true
    }]);

    setMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-4 text-white flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <h1 className="text-xl font-semibold">Secure Chat</h1>
        </div>
        
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.isMine
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="break-words">{msg.text}</p>
                <p className={`text-xs mt-1 ${
                  msg.isMine ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;