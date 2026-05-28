import { NavLink } from 'react-router-dom';
import { Home, Search, Inbox, Briefcase, User, LayoutDashboard, PlusCircle, Users, ClipboardList, MessageCircle, Settings } from 'lucide-react';

/**
 * Desktop Sidebar Navigation
 * Hidden on mobile, visible on lg: screens
 */
const WORKER_LINKS = [
  { to: '/worker/home', icon: Home, label: 'Home' },
  { to: '/worker/search', icon: Search, label: 'Search Jobs' },
  { to: '/worker/requests', icon: Inbox, label: 'Hire Requests' },
  { to: '/worker/jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/worker/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/worker/profile', icon: User, label: 'Profile' },
];

const COMPANY_LINKS = [
  { to: '/company/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/company/post-job', icon: PlusCircle, label: 'Post Job' },
  { to: '/company/workers', icon: Users, label: 'Find Workers' },
  { to: '/company/hires', icon: ClipboardList, label: 'My Hires' },
  { to: '/company/chat', icon: MessageCircle, label: 'Messages' },
  { to: '/company/profile', icon: User, label: 'Profile' },
];

const Sidebar = ({ role = 'worker' }) => {
  const links = role === 'company' ? COMPANY_LINKS : WORKER_LINKS;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-surface-100 min-h-[calc(100vh-65px)] sticky top-[65px]">
      <div className="flex flex-col py-4 px-3 flex-1">
        {/* Navigation Links */}
        <div className="space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-auto pt-4 border-t border-surface-100">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-surface-500 hover:bg-surface-50 hover:text-surface-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
