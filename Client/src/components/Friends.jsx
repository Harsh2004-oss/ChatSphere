import React, { useState, useEffect } from "react";
import { Menu, X, Users, UserPlus, Search } from "lucide-react";
import "../styles/friends.css";
import AllFriends from "./Friendstab/AllFriends";
import FriendRequests from "./Friendstab/FriendRequests";

export default function Friends() {
  const [activeTab, setActiveTab] = useState("requests");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const requests = [
    { id: 1, name: "Jordan Smith", mutual: 8, avatar: "👩" },
    { id: 2, name: "Riley Cooper", mutual: 12, avatar: "👨" },
    { id: 3, name: "Elena Rodriguez", mutual: 3, avatar: "👩" },
    { id: 4, name: "David Chen", mutual: 15, avatar: "👨" },
  ];

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    if (activeTab === "requests") {
      return <FriendRequests />;
    }

    if (activeTab === "all") {
      return <AllFriends searchQuery={searchQuery} />;
    }

    return (
      <div className="under-construction">
        <div className="construction-content">
          <span className="construction-icon">🚧</span>
          <h2>Under Construction</h2>
          <p>This feature is coming soon!</p>
        </div>
      </div>
    );
  };

  const menuItems = [
    { 
      id: "requests", 
      label: "Friend Requests", 
      icon: UserPlus,
      badge: requests.length 
    },
    { 
      id: "all", 
      label: "All Friends", 
      icon: Users,
      badge: null 
    },
  ];

  return (
    <div className="friends-layout">
      {/* Mobile Top Navigation with Tabs */}
      <div className="friends-mobile-header">
        <div className="friends-mobile-tabs">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`friends-mobile-tab ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="friends-mobile-badge">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Desktop Only */}
      <aside className={`friends-sidebar ${isSidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <h3>Friends</h3>
        </div>

        <div className="search-container">
          <Search className="search-icon-svg" size={18} />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.id}
                  className={activeTab === item.id ? "active" : ""}
                  onClick={() => handleTabChange(item.id)}
                >
                  <div className="menu-item-content">
                    <Icon size={20} className="menu-icon" />
                    <span className="menu-label">{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <span className="badge">{item.badge}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="friends-main">{renderContent()}</main>
    </div>
  );
}