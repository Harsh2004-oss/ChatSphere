import React, { useState, useEffect } from "react";
import { UserPlus, Check, X, Users, Clock, UserCheck } from "lucide-react";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/friendRequests.css";

const FriendRequests = () => {
  const { authUser, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [filter, setFilter] = useState("all"); // all, today, week

  // 🔹 Fetch pending friend requests from backend
  useEffect(() => {
    if (!authUser) return;

    const fetchRequests = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/friend-request/pending");

        const mappedRequests = res.data.map((r) => ({
          id: r._id,
          name: r.sender.username,
          fullName: r.sender.fullName,
          avatar: r.sender.avatar || "👤",
          senderId: r.sender._id,
          createdAt: r.createdAt,
          mutualFriends: r.mutualFriends || 0,
        }));

        setRequests(mappedRequests);
      } catch (err) {
        console.error("Error fetching friend requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [authUser]);

  // 🔹 Accept friend request
  const acceptRequest = async (id) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "accepting" }));
      await api.post(`/api/friend-request/${id}/accept`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error accepting request:", err);
      alert(err.response?.data?.message || "Failed to accept request");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 🔹 Decline friend request
  const declineRequest = async (id) => {
    try {
      setActionLoading((prev) => ({ ...prev, [id]: "declining" }));
      await api.post(`/api/friend-request/${id}/decline`);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error declining request:", err);
      alert(err.response?.data?.message || "Failed to decline request");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // 🔹 Accept all requests
  const acceptAllRequests = async () => {
    try {
      await Promise.all(requests.map((r) => acceptRequest(r.id)));
    } catch (err) {
      console.error("Error accepting all requests:", err);
    }
  };

  // 🔹 Get time ago
  const getTimeAgo = (date) => {
    if (!date) return "Recently";
    
    const now = new Date();
    const requestDate = new Date(date);
    const diffMs = now - requestDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  // 🔹 Filter requests by time
  const filteredRequests = requests.filter((r) => {
    if (filter === "all") return true;
    
    const now = new Date();
    const requestDate = new Date(r.createdAt);
    const diffDays = Math.floor((now - requestDate) / 86400000);
    
    if (filter === "today") return diffDays === 0;
    if (filter === "week") return diffDays <= 7;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="requests-loading">
        <div className="loading-spinner"></div>
        <p>Loading friend requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="requests-empty">
        <div className="empty-icon">
          <UserPlus size={64} strokeWidth={1.5} />
        </div>
        <h3>No Pending Requests</h3>
        <p>When someone sends you a friend request, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="requests-wrapper">
      {/* Header Section */}
      <div className="requests-header">
        <div className="header-top">
          <div className="header-left">
            <h2>Friend Requests</h2>
            <span className="request-count">{filteredRequests.length}</span>
          </div>
          
          {requests.length > 1 && (
            <button className="accept-all-btn" onClick={acceptAllRequests}>
              <UserCheck size={18} />
              Accept All
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        {requests.length > 0 && (
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All
              <span className="tab-count">{requests.length}</span>
            </button>
            <button
              className={`filter-tab ${filter === "today" ? "active" : ""}`}
              onClick={() => setFilter("today")}
            >
              Today
              <span className="tab-count">
                {requests.filter(r => {
                  const diffDays = Math.floor((new Date() - new Date(r.createdAt)) / 86400000);
                  return diffDays === 0;
                }).length}
              </span>
            </button>
            <button
              className={`filter-tab ${filter === "week" ? "active" : ""}`}
              onClick={() => setFilter("week")}
            >
              This Week
              <span className="tab-count">
                {requests.filter(r => {
                  const diffDays = Math.floor((new Date() - new Date(r.createdAt)) / 86400000);
                  return diffDays <= 7;
                }).length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Request Grid */}
      <div className="request-grid">
        {filteredRequests.map((r) => {
          const isAccepting = actionLoading[r.id] === "accepting";
          const isDeclining = actionLoading[r.id] === "declining";
          const isProcessing = isAccepting || isDeclining;

          return (
            <div key={r.id} className="request-card">
              {isProcessing && <div className="card-loading-overlay"></div>}

              <div className="card-header">
                <div className="avatar-section">
                  <div className="avatar">{r.avatar}</div>
                  <span className="request-time">
                    <Clock size={12} />
                    {getTimeAgo(r.createdAt)}
                  </span>
                </div>
              </div>

              <div className="card-body">
                <h4 className="request-name">{r.name}</h4>
                {r.fullName && <p className="request-fullname">{r.fullName}</p>}
                
                {r.mutualFriends > 0 && (
                  <div className="mutual-friends">
                    <Users size={14} />
                    <span>{r.mutualFriends} mutual friend{r.mutualFriends !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  className="accept-btn"
                  onClick={() => acceptRequest(r.id)}
                  disabled={isProcessing}
                >
                  {isAccepting ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Accept</span>
                    </>
                  )}
                </button>
                <button
                  className="decline-btn"
                  onClick={() => declineRequest(r.id)}
                  disabled={isProcessing}
                >
                  {isDeclining ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Declining...</span>
                    </>
                  ) : (
                    <>
                      <X size={18} />
                      <span>Decline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRequests.length === 0 && requests.length > 0 && (
        <div className="no-results">
          <p>No requests found for this filter.</p>
        </div>
      )}
    </div>
  );
};

export default FriendRequests;