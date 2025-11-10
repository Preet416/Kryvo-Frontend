import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";


const SOCKET_SERVER_URL = "http://localhost:5000";

export default function Chat({ username, room }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef();
  const messagesEndRef = useRef();

  useEffect(() => {
    
    socketRef.current = io(SOCKET_SERVER_URL, {
      query: { username, room },
    });

   
    socketRef.current.on("chat-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

   
    socketRef.current.emit("join-room", room);

    return () => {
      socketRef.current.disconnect();
    };
  }, [room, username]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      user: username,
      text: newMessage,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("send-message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-gray-50 rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold text-indigo-700 mb-4">Team Chat</h2>

      
      <div className="flex-1 overflow-auto mb-4 p-2 bg-white rounded-lg shadow-inner">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-2 p-2 rounded ${
              msg.user === username ? "bg-indigo-100 self-end" : "bg-gray-100"
            }`}
          >
            <p className="text-sm font-semibold text-gray-700">{msg.user}</p>
            <p className="text-sm text-gray-800">{msg.text}</p>
            <p className="text-xs text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

    
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          Send
        </button>
      </form>
    </div>
  );
}
