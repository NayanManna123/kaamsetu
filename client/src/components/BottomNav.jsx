import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Inbox, Briefcase, User, LayoutDashboard, PlusCircle, Users, ClipboardList, MessageSquare } from 'lucide-react';
import NotificationContext from '../context/NotificationContext';

/**
 * Mobile Bottom Navigation Bar
 * Different tabs for worker vs company
 * Includes notification badges for requests and chat tabs
 */
const WORKER_TABS = [
  { to: '/worker/home', icon: Home, label: 'Home' },
  { to: '/worker/search', icon: Search, label: 'Search' },
  { to: '/worker/requests', icon: Inbox, label: 'Requests', badgeKey: 'requests' },
  { to: '/worker/chat', icon: MessageSquare, label: 'Chat', badgeKey: 'chat' },
  { to: '/worker/profile', icon: User, label: 'Profile' },
];

const COMPANY_TABS = [
  { to: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company/post-job', icon: PlusCircle, label: 'Post Job' },
  { to: '/company/workers', icon: Users, label: 'Workers' },
  { to: '/company/hires', icon: ClipboardList, label: 'Hires', badgeKey: 'hires' },
  { to: '/company/chat', icon: MessageSquare, label: 'Chat', badgeKey: 'chat' },
];

const BottomNav = ({ role = 'worker' }) => {
  const tabs = role === 'company' ? COMPANY_TABS : WORKER_TABS;

  // Use useContext directly — returns null if NotificationProvider is not mounted (safe)
  const notifCtx = useContext(NotificationContext);
  const unreadCount = notifCtx?.unreadCount || 0;

  const getBadge = (badgeKey) => {
    if (!badgeKey) return 0;
    if (badgeKey === 'requests' || badgeKey === 'hires') return unreadCount;
    if (badgeKey === 'chat') return 0; // Chat unread count would come from chat context
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-surface-100 lg:hidden">
      <div className="flex items-stretch justify-around px-1 py-1">
        {tabs.map(({ to, icon: Icon, label, badgeKey }) => {
          const badge = getBadge(badgeKey);
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all duration-200 relative ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-surface-400 hover:text-surface-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 animate-bounce-gentle">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
      {/* Safe area padding for notch phones */}
      <div className="h-safe-area-inset-bottom bg-white" />
    </nav>
  );
};

export default BottomNav;
