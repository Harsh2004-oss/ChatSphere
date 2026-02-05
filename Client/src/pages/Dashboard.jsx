import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import '../styles/Dashboard.css';
import Chats from '../components/Chats';
import Friends from '../components/Friends';

export default function ChatApp() {
  const { authUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('chats');
  const [selectedChat, setSelectedChat] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Sample friends data
  const friends = [
    {
      id: 1,
      name: 'Sarah Jenkins',
      status: 'ACTIVE NOW',
      avatar: '👩',
      online: true,
      verified: true
    },
    {
      id: 2,
      name: 'Alex Rivera',
      status: 'Last seen 5m ago',
      avatar: '👨',
      online: true,
      verified: false
    },
    {
      id: 3,
      name: 'David Chen',
      status: 'Away',
      avatar: '👨‍💼',
      online: false,
      verified: false
    },
    {
      id: 4,
      name: 'Jessica Bloom',
      status: 'ACTIVE NOW',
      avatar: '👩‍💼',
      online: true,
      verified: false
    },
    {
      id: 5,
      name: 'Marcus Wright',
      status: 'ACTIVE NOW',
      avatar: '👨‍🦱',
      online: true,
      verified: false
    }
  ];

  const navItems = [
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'friends', label: 'Friends', icon: Users },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'friends':
        return <Friends />;
      case 'chats':
        return <Chats friends={friends} />;
      default:
        return null;
    }
  };

  return (
    <div className="chat-app">
      {/* Top Navigation - ALWAYS VISIBLE */}
      <nav className="top-nav">
        <div className="top-nav-left">
          <div className="app-logo">
            <div className="app-logo-icon">
              <MessageCircle size={20} />
            </div>
            ChatApp
          </div>

          {/* Desktop Navigation Links */}
          <div className="desktop-nav-links">
            <button
              className={`desktop-nav-link ${activeTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveTab('chats')}
            >
              <MessageCircle size={18} />
              <span>Chats</span>
            </button>
            <button
              className={`desktop-nav-link ${activeTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              <Users size={18} />
              <span>Friends</span>
              <span className="desktop-nav-badge">3</span>
            </button>
          </div>
        </div>

        <div className="top-nav-right">
          {/* User Menu Dropdown */}
          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button 
              className="user-avatar-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              {authUser?.username?.charAt(0).toUpperCase() || 'H'}
              <ChevronDown 
                size={16} 
                className={`user-menu-chevron ${showUserMenu ? 'open' : ''}`}
              />
            </button>

            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    {authUser?.username?.charAt(0).toUpperCase() || 'H'}
                  </div>
                  <div className="user-dropdown-info">
                    <h4>{authUser?.username || 'User'}</h4>
                    <p>{authUser?.email || 'user@example.com'}</p>
                  </div>
                </div>
                <div className="user-dropdown-menu-items">
                  <button 
                    className="user-dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content-wrapper">
        {renderContent()}
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="bottom-nav">
        <div className="bottom-nav-items">
          <button
            className={`bottom-nav-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
          >
            <div className="bottom-nav-item-icon">
              <MessageCircle size={24} />
            </div>
            <span className="bottom-nav-item-label">Chats</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <div className="bottom-nav-item-icon">
              <Users size={24} />
              <span className="bottom-nav-item-badge">3</span>
            </div>
            <span className="bottom-nav-item-label">Friends</span>
          </button>

      

          <button
            className="bottom-nav-item logout-nav-item"
            onClick={handleLogout}
          >
            <div className="bottom-nav-item-icon">
              <LogOut size={24} />
            </div>
            <span className="bottom-nav-item-label">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}