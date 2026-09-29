import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, LogOut, User as UserIcon, Settings, ChevronDown, CheckSquare } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import Avatar from './Avatar';
import { formatDate } from '../../lib/utils';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markRead, markAllRead } = useContext(NotificationContext);
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif) => {
    markRead(notif._id);
    setShowNotifications(false);
    if (notif.relatedMatch) {
      navigate(`/matches/${notif.relatedMatch}`);
    } else if (notif.relatedTournament) {
      navigate(`/tournaments/${notif.relatedTournament}`);
    }
  };

  const collegeName = user?.college?.name || 'NEC College of Engineering';
  const logoSrc = user?.college?.logo;

  return (
    <nav style={{ backgroundColor: '#2756F5' }} className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 shadow-md">
      
      {/* Left: Hamburger & College Branding */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg lg:hidden hover:bg-white/20 text-white transition"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={20} />
        </button>
        
        <Link to="/" className="flex items-center space-x-2.5">
          {logoSrc ? (
            <img
              src={logoSrc.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${logoSrc}` : logoSrc}
              alt="College logo"
              className="w-8 h-8 rounded-md object-cover border-2 border-white/40"
            />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/20 border border-white/30 text-white font-bold text-base">
              N
            </div>
          )}
          <span className="hidden sm:inline-block font-extrabold text-sm md:text-base tracking-wide text-white uppercase">
            {collegeName}
          </span>
        </Link>
      </div>

      {/* Right: Notifications, Profile Dropdown */}
      <div className="flex items-center space-x-2">

        {/* Notifications Dropdown */}
        {user && (
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition"
              aria-label="View notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <CheckSquare size={12} /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                          !notif.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className={`text-xs ${!notif.isRead ? 'font-bold' : 'font-medium'} text-gray-900`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Menu */}
        {user ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 focus:outline-none pl-1 pr-2 py-1 rounded-lg hover:bg-white/20 transition"
              aria-label="User menu"
            >
              <Avatar src={user.avatar} name={user.name} size="sm" />
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                <span className="text-[10px] text-white/70 leading-tight capitalize">{user.role}</span>
              </div>
              <ChevronDown size={14} className="text-white/70 hidden sm:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                </div>
                
                <Link
                  to="/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                >
                  <UserIcon size={14} className="mr-2" /> My Profile
                </Link>
                
                {user.role === 'superAdmin' && (
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                  >
                    <Settings size={14} className="mr-2" /> Settings
                  </Link>
                )}

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100 mt-1 transition"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition shadow-sm"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
