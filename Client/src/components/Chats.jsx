import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Plus, Send, Smile, Paperclip } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../context/AuthContext";
import socket from "../lib/socket";
import "../styles/chats.css";

export default function Chats() {
  const { authUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const emojiPickerRef = useRef(null);

  if (!authUser) return <div style={{ padding: 20 }}>Loading user...</div>;

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // ---------------- CLOSE EMOJI PICKER ON OUTSIDE CLICK ----------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // ---------------- FETCH FRIENDS ----------------
  useEffect(() => {
    const fetchFriends = async () => {
      try {
 const res = await fetch(`${API_BASE}/api/friend-request/friends`, { credentials: "include" });
        const data = await res.json();
        const acceptedFriends = data.map((f) => ({
          id: f._id,
          name: f.username,
          avatar: f.avatar || "👤",
        }));
        setFriends(acceptedFriends);
        if (acceptedFriends.length && !selectedChat) setSelectedChat(acceptedFriends[0]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFriends();
  }, [authUser]);

  // ---------------- FETCH MESSAGES ----------------
  useEffect(() => {
    if (!selectedChat) return;

    const fetchMessages = async () => {
      try {
        setMessages([]); // clear previous messages

       const res = await fetch(`${API_BASE}/api/message/${selectedChat.id}`, { credentials: "include" });

        const data = await res.json();

        // Remove duplicates
        const uniqueMessages = Array.from(new Set(data.map((m) => m._id))).map(
          (id) => data.find((m) => m._id === id)
        );

        setMessages(
          uniqueMessages.map((msg) => ({
            ...msg,
            type: msg.from === authUser._id ? "sent" : "received",
            mediaUrl: msg.file || null,
            mediaType: msg.fileType || null,
          }))
        );
      } catch (err) {
        console.error(err);
      }
    };

    fetchMessages();
  }, [selectedChat, authUser]);

  // ---------------- ONLINE USERS ----------------
  useEffect(() => {
    if (!authUser) return;

    const emitOnline = () => {
      if (socket.connected) socket.emit("user-online", authUser._id);
    };

    emitOnline();
    socket.on("connect", emitOnline);
    const interval = setInterval(emitOnline, 5000);

    return () => {
      clearInterval(interval);
      socket.off("connect", emitOnline);
    };
  }, [authUser]);

  useEffect(() => {
    const handleOnlineUsers = (users) => setOnlineUsers(users);
    socket.on("online-users", handleOnlineUsers);
    return () => socket.off("online-users", handleOnlineUsers);
  }, []);

  // ---------------- SOCKET MESSAGE EVENTS ----------------
  useEffect(() => {
    if (!selectedChat) return;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        // avoid duplicate messages
        if (prev.some((m) => m._id === msg._id)) return prev;
        if (msg.from === selectedChat.id || msg.from === authUser._id) {
          return [
            ...prev,
            {
              ...msg,
              type: msg.from === authUser._id ? "sent" : "received",
              mediaUrl: msg.file || null,
              mediaType: msg.fileType || null,
            },
          ];
        }
        return prev;
      });
    };

    const handleTyping = ({ from }) => {
      if (selectedChat.id === from) setIsTyping(true);
    };
    const handleStopTyping = ({ from }) => {
      if (selectedChat.id === from) setIsTyping(false);
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [selectedChat, authUser]);

  // ---------------- AUTO SCROLL TO BOTTOM ----------------
  // Use useLayoutEffect to scroll immediately after DOM updates
  useLayoutEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Additional effect to handle typing indicator
  useLayoutEffect(() => {
    if (isTyping && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [isTyping]);

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const msg = {
      from: authUser._id,
      to: selectedChat.id,
      text: messageText.trim(),
      createdAt: new Date(),
    };

    // Emit socket
    socket.emit("send-message", msg);

    setMessages((prev) => [...prev, { ...msg, type: "sent" }]);
    setMessageText("");
    setShowEmojiPicker(false); // Close emoji picker after sending
    socket.emit("stop-typing", { to: selectedChat.id });
  };

  // ---------------- TYPING ----------------
  const handleTypingEvent = () => {
    if (!selectedChat) return;
    socket.emit("typing", { to: selectedChat.id });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { to: selectedChat.id });
    }, 1500);
  };

  // ---------------- EMOJI ----------------
  const handleEmojiClick = (emoji) => {
    setMessageText((prev) => prev + emoji.emoji);
    // Don't close the picker here - let user add multiple emojis
  };

  // ---------------- FILE UPLOAD ----------------
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChat) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("to", selectedChat.id);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/message/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const msg = await res.json();

      socket.emit("send-message", {
        from: msg.from,
        to: msg.to,
        text: msg.text,
        file: msg.file,
        fileType: msg.fileType,
        createdAt: msg.createdAt,
      });

      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          type: "sent",
          mediaUrl: msg.file,
          mediaType: msg.fileType,
        },
      ]);
    } catch (err) {
      console.error("File upload error:", err);
    }
  };

  // ---------------- FILTER & ONLINE ----------------
  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const isOnline = (friendId) => onlineUsers.includes(friendId);

  // ---------------- RENDER ----------------
  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
          <button className="icon-btn">
            <Plus size={20} />
          </button>
        </div>
        <input
          className="chat-search"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="chat-list">
          {filteredFriends.map((friend) => (
            <div
              key={friend.id}
              className={`chat-item ${
                selectedChat?.id === friend.id ? "selected" : ""
              }`}
              onClick={() => setSelectedChat(friend)}
            >
              <div className="chat-avatar">
                {friend.avatar}
                {isOnline(friend.id) && <div className="status-dot" />}
              </div>
              <div className="chat-info">
                <div className="chat-name">{friend.name}</div>
                <div className="chat-status">
                  {isOnline(friend.id) ? "Online" : "Offline"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {selectedChat ? (
          <>
            <div className="chat-window-header">
              <div className="chat-avatar">{selectedChat.avatar}</div>
              <div>
                <div className="chat-name">{selectedChat.name}</div>
                <div className="chat-status">
                  {isOnline(selectedChat.id) ? "Online" : "Offline"}
                </div>
              </div>
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.type}`}>
                  {msg.mediaUrl ? (
                    msg.mediaType === "video" ? (
                      <video
                        src={msg.mediaUrl}
                        controls
                        style={{ maxWidth: "200px" }}
                      />
                    ) : (
                      <img
                        src={msg.mediaUrl}
                        alt="media"
                        style={{ maxWidth: "200px" }}
                      />
                    )
                  ) : (
                    msg.text
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  {selectedChat.name} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <div ref={emojiPickerRef}>
                <button
                  className="icon-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile size={20} />
                </button>
                
                {showEmojiPicker && (
                  <div className="emoji-picker-wrapper">
                    <EmojiPicker onEmojiClick={handleEmojiClick} />
                  </div>
                )}
              </div>

              <label className="icon-btn" style={{ cursor: "pointer" }}>
                <Paperclip size={20} />
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              </label>

              <input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  handleTypingEvent();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // prevent double send
                    handleSendMessage();
                  }
                }}
              />
              <button className="icon-btn" onClick={handleSendMessage}>
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>Select a friend to start chatting</div>
        )}
      </div>
    </div>
  );
}