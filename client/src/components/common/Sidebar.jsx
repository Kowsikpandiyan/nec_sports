import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Trophy,
  Shield,
  Calendar,
  Tv,
  BarChart2,
  Settings,
  Images,
  Award,
  BookOpen,
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = ({ isOpen, isCollapsed, onToggleCollapse }) => {
  const { user } = useContext(AuthContext);

  const getMenuItems = () => {
    const role = user?.role;

    // Base menu items (accessible to any logged-in user)
    const items = [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    // Public / Shared items
    items.push(
      { path: '/live', label: 'Live Scoreboard', icon: Tv },
      { path: '/points-table', label: 'Points Table', icon: BookOpen },
      { path: '/highlights', label: 'Highlights', icon: Camera },
      { path: '/ai-studio', label: 'AI Sports Studio', icon: Sparkles }
    );

    // Coordinators + Admins items
    if (['superAdmin', 'coordinator'].includes(role)) {
      items.push(
        { path: '/departments', label: 'Departments', icon: Building2 },
        { path: '/players', label: 'Players List', icon: Users },
        { path: '/teams', label: 'Teams List', icon: Shield }
      );
    }

    // Admin-only items
    if (role === 'superAdmin') {
      items.push(
        { path: '/sports', label: 'Sports', icon: Trophy },
        { path: '/tournaments', label: 'Tournaments', icon: Calendar },
        { path: '/reports', label: 'Reports Export', icon: BarChart2 },
        { path: '/gallery', label: 'Gallery Media', icon: Images },
        { path: '/settings', label: 'Site Settings', icon: Settings }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-200 shadow-sm transition-all duration-300 transform 
        lg:translate-x-0 lg:static 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'} w-64 h-[calc(100vh-4rem)] mt-16 lg:mt-0`}
    >
      {/* Logo strip for desktop sidebar header */}
      <div
        className="hidden lg:flex items-center px-4 h-16 border-b border-gray-100 shrink-0"
        style={{ backgroundColor: '#2756F5' }}
      >
        <div className={`flex items-center space-x-2 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-white/20 border border-white/30 text-white font-bold text-sm shrink-0">
            N
          </div>
          {!isCollapsed && (
            <span className="text-white font-extrabold text-sm tracking-wide uppercase truncate">
              NEC Sports
            </span>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: '#2756F5' } : {}
              }
            >
              <item.icon
                size={20}
                className="shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <span className={`ml-3 transition-opacity duration-200 ${isCollapsed ? 'lg:hidden opacity-0 w-0' : 'opacity-100'}`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Collapse Trigger at bottom (hidden on mobile) */}
      <div className="hidden lg:block p-3 border-t border-gray-100">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
          aria-label={isCollapsed ? 'Expand sidebar panel' : 'Collapse sidebar panel'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : (
            <div className="flex items-center space-x-2">
              <ChevronLeft size={18} />
              <span className="text-xs font-semibold">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
