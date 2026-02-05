import React, { useState, useEffect } from "react";
import { Search, UserPlus, Eye, Check, Clock, X } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import socket from "../../lib/socket";
import "../../styles/Allfriends.css";

export default function AllFriends({ searchQuery }) {
  const { authUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, online, offline, friends
  const [actionLoading, setActionLoading] = useState({});

  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!authUser) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // 1️⃣ All users except self
        const resUsers = await api.get("/api/user/all");
        setUsers(resUsers.data.filter(u => u._id !== authUser._id));

        // 2️⃣ Sent requests
        const resSent = await api.get("/api/friend-request/sent");
        setSentRequests(resSent.data.map(r => r.receiver._id.toString()));

        // 3️⃣ Received requests
        const resReceived = await api.get("/api/friend-request/pending");
        setReceivedRequests(resReceived.data.map(r => r.sender._id.toString()));

        // 4️⃣ Accepted friends
        const resFriends = await api.get("/api/friend-request/friends");
        setFriends(resFriends.data.map(f => f._id.toString()));
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authUser]);

  // Socket online
  useEffect(() => {
    if (!authUser) return;
    socket.emit("user-online", authUser._id);
    socket.on("online-users", setOnlineUsers);
    return () => socket.off("online-users");
  }, [authUser]);

  const sendFriendRequest = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      await api.post(`/api/friend-request/${userId}`);
      setSentRequests(prev => [...prev, userId]);
    } catch (err) {
      console.error("Error sending friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const acceptFriendRequest = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      const pending = await api.get("/api/friend-request/pending");
      const request = pending.data.find(r => r.sender._id.toString() === userId);
      if (!request) return;

      await api.post(`/api/friend-request/accept/${request._id}`);
      setFriends(prev => [...prev, userId]);
      setReceivedRequests(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error("Error accepting friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const rejectFriendRequest = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      const pending = await api.get("/api/friend-request/pending");
      const request = pending.data.find(r => r.sender._id.toString() === userId);
      if (!request) return;

      await api.delete(`/api/friend-request/${request._id}`);
      setReceivedRequests(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const cancelFriendRequest = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      const sent = await api.get("/api/friend-request/sent");
      const request = sent.data.find(r => r.receiver._id.toString() === userId);
      if (!request) return;

      await api.delete(`/api/friend-request/${request._id}`);
      setSentRequests(prev => prev.filter(id => id !== userId));
    } catch (err) {
      console.error("Error canceling friend request:", err);
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Filter and search logic
  const filteredUsers = users.filter(user => {
    const userId = user._id.toString();
    const isOnline = onlineUsers.includes(userId);
    const isFriend = friends.includes(userId);
    const query = (searchQuery || localSearch).toLowerCase();
    
    // Search filter
    const matchesSearch = user.username.toLowerCase().includes(query) || 
                         user.fullName?.toLowerCase().includes(query);
    
    if (!matchesSearch) return false;

    // Type filter
    switch(filterType) {
      case "online":
        return isOnline;
      case "offline":
        return !isOnline;
      case "friends":
        return isFriend;
      default:
        return true;
    }
  });

  const stats = {
    total: users.length,
    online: users.filter(u => onlineUsers.includes(u._id.toString())).length,
    friends: friends.length,
    pending: receivedRequests.length
  };

  if (authLoading || loading) {
    return (
      <div className="all-friends-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="all-friends">
      {/* Header Section */}
      <div className="all-friends-header">
        <div className="header-top">
          <h2>All Users</h2>
          <div className="stats-badges">
            <span className="stat-badge">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total</span>
            </span>
            <span className="stat-badge online">
              <span className="stat-number">{stats.online}</span>
              <span className="stat-label">Online</span>
            </span>
            <span className="stat-badge friends">
              <span className="stat-number">{stats.friends}</span>
              <span className="stat-label">Friends</span>
            </span>
          </div>
        </div>

        {/* Search Bar */}
        {!searchQuery && (
          <div className="local-search-container">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search by name..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="local-search-input"
            />
            {localSearch && (
              <button 
                className="clear-search"
                onClick={() => setLocalSearch("")}
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Users
          </button>
          <button
            className={`filter-tab ${filterType === "online" ? "active" : ""}`}
            onClick={() => setFilterType("online")}
          >
            Online
          </button>
          <button
            className={`filter-tab ${filterType === "friends" ? "active" : ""}`}
            onClick={() => setFilterType("friends")}
          >
            Friends
          </button>
        </div>
      </div>

      {/* Friends List */}
      <div className="friends-list">
        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No users found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredUsers.map(u => {
            const userId = u._id.toString();
            const isOnline = onlineUsers.includes(userId);
            const isFriend = friends.includes(userId);
            const isSent = sentRequests.includes(userId);
            const isReceived = receivedRequests.includes(userId);
            const isLoading = actionLoading[userId];

            return (
              <div key={userId} className="friend-card">
                <div className="friend-avatar-section">
                  <div className="avatar-wrapper">
                    <span className="avatar">{u.avatar || "👤"}</span>
                    <span className={`status-indicator ${isOnline ? "online" : "offline"}`}></span>
                  </div>
                </div>

                <div className="friend-info">
                  <h4 className="friend-name">{u.username}</h4>
                  {u.fullName && <p className="friend-fullname">{u.fullName}</p>}
                  <div className="friend-meta">
                    <span className={`status-text ${isOnline ? "online" : "offline"}`}>
                      {isOnline ? "● Online" : "○ Offline"}
                    </span>
                    {isFriend && (
                      <span className="friend-badge">
                        <Check size={12} />
                        Friend
                      </span>
                    )}
                  </div>
                </div>

                <div className="friend-actions">
               

                  {isFriend ? (
                    <span className="friend-status-badge">
                      <Check size={16} />
                      <span>Friends</span>
                    </span>
                  ) : isReceived ? (
                    <div className="request-actions">
                      <button 
                        className="action-btn accept-btn"
                        onClick={() => acceptFriendRequest(userId)}
                        disabled={isLoading}
                      >
                        <Check size={18} />
                        <span className="btn-text">Accept</span>
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => rejectFriendRequest(userId)}
                        disabled={isLoading}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : isSent ? (
                    <button 
                      className="action-btn sent-btn"
                      onClick={() => cancelFriendRequest(userId)}
                      disabled={isLoading}
                    >
                      <Clock size={18} />
                      <span className="btn-text">Pending</span>
                    </button>
                  ) : (
                    <button 
                      className="action-btn add-btn"
                      onClick={() => sendFriendRequest(userId)}
                      disabled={isLoading}
                    >
                      <UserPlus size={18} />
                      <span className="btn-text">Add Friend</span>
                    </button>
                  )}
                </div>

                {isLoading && <div className="card-loading-overlay"></div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}