import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, Star, Inbox, Check, ShieldAlert, Sparkles, Navigation, Wallet, CreditCard, TrendingUp, Award, BarChart3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import JobCard from '../../components/JobCard';
import StatCard from '../../components/StatCard';
import { JobCardSkeleton, StatCardSkeleton } from '../../components/SkeletonLoader';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import axios from 'axios';

const WorkerHome = () => {
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dashboard stats (from single API call)
  const [stats, setStats] = useState({
    todaysEarnings: 0, totalCompletedJobs: 0, rating: 0, completionRate: 100,
    reliabilityScore: 100, walletBalance: 0, pendingHireRequests: 0,
  });

  // Job listings
  const [urgentJobs, setUrgentJobs] = useState([]);
  const [nearbyJobs, setNearbyJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [hireRequests, setHireRequests] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  // Auto-detect GPS on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserCoords({ lat: 19.076, lng: 72.8777 }), // Fallback Mumbai
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (isDemo) {
      setStats({
        todaysEarnings: 700, totalCompletedJobs: 45, rating: 4.5,
        completionRate: 96, reliabilityScore: 95, walletBalance: 1400,
        pendingHireRequests: 1,
      });
      setUrgentJobs([
        { _id: '1', title: 'Construction Helpers — Site A', company: { name: 'BuildRight Construction', companyProfile: { verified: true } }, workType: 'daily', pay: 700, payType: 'per_day', workersNeeded: 5, workersHired: 2, skills: ['construction', 'helper'], location: { city: 'Mumbai', address: 'BKC Phase 2' }, duration: '10 hours', urgency: 'urgent', distance: 1.5 },
        { _id: '2', title: 'Delivery Drivers — Same Day', company: { name: 'FastLogistics India' }, workType: 'instant', pay: 500, payType: 'per_day', workersNeeded: 10, workersHired: 4, skills: ['driver'], location: { city: 'Mumbai', address: 'Electronic City' }, duration: '12 hours', urgency: 'urgent', distance: 3.2 },
      ]);
      setNearbyJobs([
        { _id: '4', title: 'Office Deep Cleaning', company: { name: 'CleanHome Services' }, workType: 'daily', pay: 600, payType: 'per_day', workersNeeded: 4, skills: ['cleaner', 'helper'], location: { city: 'Mumbai', address: 'Nehru Place' }, duration: '8 hours', urgency: 'normal', distance: 2.3 },
      ]);
      setRecommendedJobs([
        { _id: '7', title: 'Painter — Interior Flat', company: { name: 'BuildRight Construction', companyProfile: { verified: true } }, workType: 'contract', pay: 15000, payType: 'fixed', workersNeeded: 2, skills: ['painter'], location: { city: 'Mumbai', address: 'Worli Sea Face' }, duration: '5 days', urgency: 'normal', matchScore: 88, distance: 4.1 },
      ]);
      setHireRequests([
        { _id: 'hr1', company: { name: 'BuildRight Construction', companyProfile: { companyName: 'BuildRight Construction Pvt Ltd', verified: true } }, job: { title: 'Construction Workers — Phase 3' }, offeredPay: 750, message: 'We need experienced workers for our new site.', status: 'pending' },
      ]);
      setLoading(false);
      return;
    }

    try {
      // Single dashboard API call for stats
      try {
        const { dashboardAPI } = await import('../../api/endpoints');
        const resDash = await dashboardAPI.getWorkerStats();
        if (resDash.data?.data) {
          setStats(resDash.data.data);
        }
      } catch (e) { console.error(e); }

      const { jobsAPI, hiresAPI, applicationsAPI } = await import('../../api/endpoints');
      
      // Parallel API calls for job data
      const coords = userCoords || { lat: user.location?.coordinates?.[1] || 19.076, lng: user.location?.coordinates?.[0] || 72.8777 };

      const [resU, resR, resN, resH] = await Promise.allSettled([
        jobsAPI.getUrgent(),
        jobsAPI.getRecommended(),
        jobsAPI.getNearby({ lat: coords.lat, lng: coords.lng, maxDistance: 25000 }),
        hiresAPI.getForWorker({ status: 'pending' }),
      ]);

      if (resU.status === 'fulfilled') setUrgentJobs(resU.value.data.data || []);
      if (resR.status === 'fulfilled') setRecommendedJobs(resR.value.data.data || []);
      if (resN.status === 'fulfilled') setNearbyJobs(resN.value.data.data || []);
      if (resH.status === 'fulfilled') setHireRequests(resH.value.data.data || []);

      // Get active job
      try {
        const resApps = await applicationsAPI.getMy({ status: 'accepted' });
        const resHires = await hiresAPI.getForWorker({ status: 'accepted' });
        
        let currentActiveJob = null;
        if (resApps.data?.data?.length > 0) currentActiveJob = resApps.data.data[0].job;
        else if (resHires.data?.data?.length > 0) currentActiveJob = resHires.data.data[0].job;
        
        setActiveJob(currentActiveJob);
        if (currentActiveJob) {
          const resAtt = await axios.get(`/api/attendance/status/${currentActiveJob._id}`);
          setAttendance(resAtt.data.data);
        }
      } catch (e) { console.error(e); }

    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, [user, userCoords]);

  // Real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      if (data.type === 'hire_request') {
        loadDashboardData();
      }
    };

    socket.on('notification', handleNotification);
    return () => socket.off('notification', handleNotification);
  }, [socket]);

  // Toggle Instant Work Mode
  const toggleInstantMode = async () => {
    const nextState = !user?.workerProfile?.isInstantAvailable;
    
    updateUser({
      workerProfile: {
        ...(user?.workerProfile || {}),
        isInstantAvailable: nextState,
        availability: nextState ? 'today' : 'available',
      }
    });

    if (isDemo) {
      toast.success(nextState ? '⚡ Instant Work Mode ON!' : 'Instant Work Mode OFF');
      return;
    }

    try {
      const { workersAPI } = await import('../../api/endpoints');
      await workersAPI.toggleAvailability(user._id, { isInstantAvailable: nextState });
      toast.success(nextState ? '⚡ Instant Work Mode Activated!' : 'Deactivated Instant Mode');
    } catch (err) {
      toast.error('Could not save availability state');
      updateUser({
        workerProfile: { ...(user?.workerProfile || {}), isInstantAvailable: !nextState, availability: !nextState ? 'today' : 'available' }
      });
    }
  };

  // GPS Check-In
  const handleCheckIn = () => {
    if (!activeJob) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        if (isDemo) {
          setAttendance({ status: 'checked_in', checkInTime: new Date() });
          setLoading(false);
          toast.success('Successfully Checked In!', { icon: '📍' });
          return;
        }
        try {
          const res = await axios.post('/api/attendance/check-in', { jobId: activeJob._id, coordinates: coords });
          setAttendance(res.data.data);
          toast.success('Work Started! Checked In.', { icon: '✅' });
        } catch (err) {
          toast.error(err.response?.data?.message || 'Check-in failed.');
        } finally { setLoading(false); }
      },
      () => { setLoading(false); toast.error('Enable GPS to check in.', { icon: '📍' }); },
      { enableHighAccuracy: true }
    );
  };

  // GPS Check-Out
  const handleCheckOut = () => {
    if (!activeJob) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        if (isDemo) {
          setAttendance({ status: 'checked_out', checkOutTime: new Date() });
          setStats(prev => ({ ...prev, walletBalance: prev.walletBalance + (activeJob.pay || 700), todaysEarnings: prev.todaysEarnings + (activeJob.pay || 700) }));
          setLoading(false);
          toast.success('Checked Out! Wage added to wallet.', { icon: '🎉' });
          return;
        }
        try {
          const res = await axios.post('/api/attendance/check-out', { jobId: activeJob._id, coordinates: coords });
          setAttendance(res.data.data);
          toast.success('Work Completed! Checked Out.', { icon: '🏁' });
          loadDashboardData();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Check-out failed.');
        } finally { setLoading(false); }
      },
      () => { setLoading(false); toast.error('GPS error.', { icon: '📍' }); },
      { enableHighAccuracy: true }
    );
  };

  const handleApply = async (job) => {
    if (isDemo) { toast.success(`Applied to "${job.title}"!`, { icon: '✅' }); return; }
    try {
      const { applicationsAPI } = await import('../../api/endpoints');
      const res = await applicationsAPI.apply({ jobId: job._id });
      toast.success(res.data.message || 'Applied successfully!');
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply.');
    }
  };

  const handleAcceptHire = async (req) => {
    if (isDemo) { toast.success('Accepted!', { icon: '🎉' }); setHireRequests(prev => prev.filter(r => r._id !== req._id)); return; }
    try {
      const { hiresAPI } = await import('../../api/endpoints');
      await hiresAPI.respond(req._id, { status: 'accepted' });
      toast.success('Hire request accepted!', { icon: '🎉' });
      loadDashboardData();
    } catch (err) { toast.error('Error responding'); }
  };

  const handleRejectHire = async (req) => {
    if (isDemo) { toast('Declined', { icon: '❌' }); setHireRequests(prev => prev.filter(r => r._id !== req._id)); return; }
    try {
      const { hiresAPI } = await import('../../api/endpoints');
      await hiresAPI.respond(req._id, { status: 'rejected' });
      toast('Declined', { icon: '❌' });
      loadDashboardData();
    } catch (err) { toast.error('Error responding'); }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-surface-900">
              Namaste, {user?.name?.split(' ')[0] || 'Worker'} 👋
            </h1>
            {(user?.isVerified || stats.reliabilityScore > 85) && (
              <span className="inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                ✓ VERIFIED
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary-500" />
            {user?.location?.address || 'Mumbai'}, {user?.location?.city || 'India'}
          </p>
        </div>
        <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white">
          {user?.name?.[0] || 'R'}
        </div>
      </motion.div>

      {/* 📊 Dashboard Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard icon={Wallet} label="Today's Earnings" value={formatCurrency(stats.todaysEarnings)} color="success" />
            <StatCard icon={BarChart3} label="Jobs Done" value={stats.totalCompletedJobs} color="primary" />
            <StatCard icon={Star} label="Rating" value={stats.rating?.toFixed?.(1) || '0.0'} color="warning" />
            <StatCard icon={TrendingUp} label="Reliability" value={`${stats.reliabilityScore || 100}%`} color="accent" />
          </>
        )}
      </div>

      {/* INSTANT WORK MODE toggle + Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instant Available Toggle */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`rounded-3xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 ${
            user?.workerProfile?.isInstantAvailable 
              ? 'gradient-success shadow-glow' 
              : 'bg-gradient-to-br from-surface-700 to-surface-900'
          }`}
        >
          <div className="absolute right-[-20px] top-[-20px] opacity-10">
            <Zap className="w-40 h-40" />
          </div>

          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <Zap className={`w-6 h-6 ${user?.workerProfile?.isInstantAvailable ? 'text-yellow-300 animate-pulse' : 'text-surface-400'}`} fill={user?.workerProfile?.isInstantAvailable ? '#FDE047' : 'none'} />
              <span className="font-bold text-lg tracking-wide uppercase">Available Now</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={user?.workerProfile?.isInstantAvailable || false} onChange={toggleInstantMode} className="sr-only peer" />
              <div className="w-14 h-7 bg-surface-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/20"></div>
            </label>
          </div>

          <div className="mt-6 z-10">
            <h3 className="text-2xl font-extrabold">
              {user?.workerProfile?.isInstantAvailable ? '⚡ OPEN TO WORK' : '💤 OFFLINE'}
            </h3>
            <p className="text-xs opacity-90 mt-1">
              {user?.workerProfile?.isInstantAvailable 
                ? 'Companies can hire you instantly for daily shifts near you' 
                : 'Turn ON when you are ready to receive immediate hire requests'}
            </p>
          </div>
        </motion.div>

        {/* Wallet Balance */}
        <motion.div whileHover={{ scale: 1.01 }} className="bg-white rounded-3xl p-5 border border-surface-100 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-surface-600 font-semibold text-sm">
              <Wallet className="w-5 h-5 text-primary-500" />
              <span>MY WALLET</span>
            </div>
            <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-bold">INR (₹)</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-surface-400">Total Balance</p>
              <h2 className="text-3xl font-extrabold text-surface-900 mt-1">{formatCurrency(stats.walletBalance)}</h2>
            </div>
            <button
              onClick={() => {
                console.log('Withdraw button clicked. Navigating to /worker/withdraw...');
                navigate('/worker/withdraw');
              }}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-xs tracking-wider transition-all active:scale-95 flex items-center gap-1 shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5" /> WITHDRAW
            </button>
          </div>
        </motion.div>
      </div>

      {/* GPS ATTENDANCE CHECK-IN/OUT */}
      {activeJob && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl border-2 border-primary-200 p-5 shadow-glow">
          <div className="flex items-center justify-between mb-4 border-b border-surface-100 pb-3">
            <div>
              <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-extrabold tracking-wider uppercase">TODAY'S SHIFT</span>
              <h3 className="font-bold text-surface-900 text-lg mt-1">{activeJob.title}</h3>
              <p className="text-xs text-surface-500">{activeJob.company?.name || 'Employer'}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-primary-600">{formatCurrency(activeJob.pay)}</span>
              <span className="text-xs text-surface-400 block">{activeJob.payType === 'fixed' ? 'Fixed' : '/day'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {(!attendance || attendance.status === 'checked_out') ? (
              <button onClick={handleCheckIn} disabled={loading}
                className="w-full py-6 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-2xl text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform">
                <Navigation className="w-6 h-6 animate-bounce" fill="white" />
                📍 START WORK (CHECK IN)
              </button>
            ) : attendance.status === 'checked_in' ? (
              <div className="space-y-3">
                <div className="py-2.5 px-4 bg-green-50 text-green-800 rounded-2xl text-sm font-semibold flex items-center gap-2 justify-center border border-green-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping shrink-0" />
                  Checked In at {new Date(attendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — Work in Progress
                </div>
                <button onClick={handleCheckOut} disabled={loading}
                  className="w-full py-6 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-2xl text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform">
                  <Check className="w-6 h-6" />
                  🏁 FINISH WORK (CHECK OUT)
                </button>
              </div>
            ) : null}
            <p className="text-[11px] text-surface-400 text-center flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-warning-500" />
              GPS verified. You must be at the job site.
            </p>
          </div>
        </motion.div>
      )}

      {/* Direct Hire Requests */}
      {hireRequests.length > 0 && (
        <motion.section initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-surface-900">Direct Hire Requests ({hireRequests.length})</h2>
          </div>
          <div className="space-y-3">
            {hireRequests.map((req) => (
              <div key={req._id} className="bg-white rounded-3xl border border-primary-100 p-5 shadow-glow flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">DIRECT HIRE</span>
                  <h3 className="font-extrabold text-surface-950 text-lg">{req.job?.title || req.jobTitle}</h3>
                  <p className="text-xs text-surface-500 font-semibold">{req.company?.companyProfile?.companyName || req.companyName}</p>
                  <p className="text-sm text-surface-600 mt-2 bg-surface-50 p-3 rounded-2xl border border-surface-100 italic">
                    "{req.message || 'Looking forward to working with you!'}"
                  </p>
                </div>
                <div className="flex md:flex-col items-center justify-between md:items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-600">{formatCurrency(req.offeredPay)}</p>
                    <p className="text-xs text-surface-400">per day</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAcceptHire(req)}
                      className="px-5 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-xs transition-all active:scale-95 shadow-md">
                      ✓ ACCEPT
                    </button>
                    <button onClick={() => handleRejectHire(req)}
                      className="px-5 py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-2xl text-xs transition-all active:scale-95">
                      ✕ DECLINE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Urgent Jobs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
            Urgent Jobs Today
          </h2>
          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">INSTANT HIRES</span>
        </div>
        {loading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {[1, 2].map((i) => <div key={i} className="min-w-[300px]"><JobCardSkeleton /></div>)}
          </div>
        ) : urgentJobs.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {urgentJobs.map((job) => (
              <div key={job._id} className="min-w-[300px] snap-start">
                <JobCard 
                  job={job} 
                  onApply={(j) => navigate(`/job/${j._id}`)} 
                  onViewDetails={(j) => navigate(`/job/${j._id}`)} 
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-surface-100 shadow-sm text-surface-400">No urgent jobs right now.</div>
        )}
      </section>

      {/* Nearby Jobs */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-1.5">📍 Nearby Jobs</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <JobCardSkeleton key={i} />)}</div>
        ) : nearbyJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyJobs.map((job) => (
              <JobCard 
                key={job._id} 
                job={job} 
                onApply={(j) => navigate(`/job/${j._id}`)} 
                onViewDetails={(j) => navigate(`/job/${j._id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-surface-100 shadow-sm text-surface-400">No jobs within your range.</div>
        )}
      </section>

      {/* Recommended */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-surface-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-warning-500 fill-warning-400" />
          Recommended For You
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map((i) => <JobCardSkeleton key={i} />)}</div>
        ) : recommendedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedJobs.map((job) => (
              <JobCard 
                key={job._id} 
                job={job} 
                onApply={(j) => navigate(`/job/${j._id}`)} 
                onViewDetails={(j) => navigate(`/job/${j._id}`)} 
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center border border-surface-100 shadow-sm text-surface-400">Add skills in your Profile for matches!</div>
        )}
      </section>
    </div>
  );
};

export default WorkerHome;
