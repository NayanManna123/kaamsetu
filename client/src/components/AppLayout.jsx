import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

/**
 * App Layout
 * Combines Navbar + Content + Footer + BottomNav (mobile)
 * 
 * Wrapped with NotificationProvider so Navbar has access to notification state
 */
const AppLayout = () => {
  const { user } = useAuth();
  const role = user?.role || 'worker';

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-surface-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col min-h-[calc(100vh-65px)]">
          <main className="flex-grow pb-20 lg:pb-6">
            <div className="max-w-7xl mx-auto px-4 py-4 lg:py-6">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
        <BottomNav role={role} />
      </div>
    </NotificationProvider>
  );
};

export default AppLayout;
