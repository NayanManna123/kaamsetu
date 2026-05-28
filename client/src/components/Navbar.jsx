import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Menu,
  Home, 
  Search, 
  Inbox, 
  Briefcase, 
  User, 
  LayoutDashboard, 
  PlusCircle, 
  Users, 
  ClipboardList, 
  MessageSquare,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getInitials } from '../utils/helpers';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, setPanelOpen, panelOpen } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role || 'worker';

  // Role-based Navigation Links
  const WORKER_LINKS = [
    { to: '/worker/home', icon: Home, label: 'Home' },
    { to: '/worker/search', icon: Search, label: 'Search Jobs' },
    { to: '/worker/requests', icon: Inbox, label: 'Hire Requests', hasBadge: true },
    { to: '/worker/jobs', icon: Briefcase, label: 'My Jobs' },
    { to: '/worker/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/worker/profile', icon: User, label: 'Profile' },
  ];

  const COMPANY_LINKS = [
    { to: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/company/post-job', icon: PlusCircle, label: 'Post Job' },
    { to: '/company/workers', icon: Users, label: 'Find Workers' },
    { to: '/company/hires', icon: ClipboardList, label: 'My Hires', hasBadge: true },
    { to: '/company/chat', icon: MessageSquare, label: 'Messages' },
    { to: '/company/profile', icon: User, label: 'Profile' },
  ];

  const links = role === 'company' ? COMPANY_LINKS : WORKER_LINKS;

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-100 px-4 py-3 shadow-sm transition-all duration-350">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* LEFT: Logo */}
          <Link to={user?.role === 'company' ? '/company/dashboard' : '/worker/home'} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">KS</span>
            </div>
            <span className="text-lg font-bold text-surface-900">
              Kaam<span className="text-primary-600">Setu</span>
            </span>
          </Link>

          {/* CENTER: Navigation Links (Desktop only) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{link.label}</span>
                      {link.hasBadge && unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* RIGHT: Notifications & Profile Icon */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
              id="notification-bell"
            >
              <Bell className="w-5 h-5 text-surface-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-slow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 font-semibold text-sm flex items-center justify-center hover:bg-primary-200 transition-colors shadow-inner"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  getInitials(user?.name)
                )}
              </button>

              {/* Desktop Profile Dropdown menu */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card-hover border border-surface-100 py-2 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-surface-100">
                      <p className="font-bold text-surface-900 text-sm truncate">{user?.name}</p>
                      <p className="text-xs text-surface-450 capitalize">{user?.role}</p>
                    </div>
                    <Link
                      to={user?.role === 'company' ? '/company/profile' : '/worker/profile'}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-surface-400" />
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-surface-400" />
                      Settings
                    </Link>
                    <hr className="border-surface-100 my-1" />
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-danger-550" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-surface-650" /> : <Menu className="w-5 h-5 text-surface-650" />}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden bg-white border-t border-surface-100 overflow-hidden shadow-md"
            >
              <div className="px-4 py-4 space-y-2">
                {/* Navigation links */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-3 mb-1">Navigation</p>
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            isActive
                              ? 'bg-primary-50 text-primary-700'
                              : 'text-surface-700 hover:bg-surface-50'
                          }`
                        }
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-surface-400" />
                          {link.label}
                        </span>
                        {link.hasBadge && unreadCount > 0 && (
                          <span className="min-w-[18px] h-5 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                            {unreadCount}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>

                {/* Profile options */}
                <div className="border-t border-surface-100 pt-3 mt-3 space-y-1">
                  <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider px-3 mb-1">Account</p>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-surface-700 hover:bg-surface-50 transition-all"
                  >
                    <Settings className="w-5 h-5 text-surface-400" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-danger-600 hover:bg-danger-50 transition-all text-left"
                  >
                    <LogOut className="w-5 h-5 text-danger-550" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Notification Panel Overlay */}
      <NotificationPanel />
    </>
  );
};

export default Navbar;
