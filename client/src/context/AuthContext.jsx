import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

/**
 * Demo users for frontend-only mode (when backend is not running)
 */
const DEMO_USERS = {
  worker: {
    _id: 'demo_worker_1',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    role: 'worker',
    rating: 4.5,
    ratingCount: 23,
    isVerified: true,
    avatar: '',
    location: { coordinates: [72.8777, 19.076], address: 'Andheri West', city: 'Mumbai' },
    workerProfile: {
      skills: ['construction', 'painter', 'helper'],
      experience: 8,
      preferredWorkType: 'daily',
      availability: 'today',
      expectedWage: 700,
      bio: 'Experienced construction worker with 8 years in the industry.',
      completedJobs: 45,
      attendanceRate: 96,
    },
  },
  company: {
    _id: 'demo_company_1',
    name: 'BuildRight Construction',
    phone: '9900000001',
    role: 'company',
    rating: 4.3,
    ratingCount: 50,
    isVerified: true,
    avatar: '',
    location: { coordinates: [72.8777, 19.076], address: 'BKC', city: 'Mumbai' },
    companyProfile: {
      companyName: 'BuildRight Construction Pvt Ltd',
      businessType: 'Construction',
      description: 'Leading construction company in Mumbai.',
      verified: true,
      totalJobsPosted: 34,
      totalWorkersHired: 128,
    },
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('kaamsetu_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('kaamsetu_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem('kaamsetu_user', JSON.stringify(userData));
    if (token) localStorage.setItem('kaamsetu_token', token);

    // Redirect based on role
    if (userData.role === 'worker') navigate('/worker/home');
    else if (userData.role === 'company') navigate('/company/dashboard');
  };

  /** Demo login without backend */
  const demoLogin = (role) => {
    const demoUser = DEMO_USERS[role];
    login(demoUser, 'demo_token');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('kaamsetu_user');
    localStorage.removeItem('kaamsetu_token');
    navigate('/');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('kaamsetu_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, demoLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
