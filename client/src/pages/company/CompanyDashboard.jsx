import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Users, TrendingUp, Star, PlusCircle, Search, Clock, ChevronRight, Check, X, Shield, ShieldCheck, Wallet, RefreshCw, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/StatCard';
import { StatCardSkeleton } from '../../components/SkeletonLoader';
import { formatCurrency, timeAgo } from '../../utils/helpers';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Dashboard details
  const [stats, setStats] = useState({ totalJobs: 0, totalHired: 0, activeJobs: 0, rating: 4.3 });
  const [activeJobsList, setActiveJobsList] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [financeStats, setFinanceStats] = useState({ totalHeld: 0, totalReleased: 0, totalSpent: 0 });
  const [topMatches, setTopMatches] = useState([]);
  const [previousWorkers, setPreviousWorkers] = useState([]);
  const [selectedRehireWorker, setSelectedRehireWorker] = useState(null);
  const [rehireJobId, setRehireJobId] = useState('');
  const [rehirePay, setRehirePay] = useState('');
  const [rehireMessage, setRehireMessage] = useState('Would love to work with you again!');

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  const loadDashboardData = async () => {
    if (isDemo) {
      setStats({ totalJobs: 34, totalHired: 128, activeJobs: 3, rating: user?.rating || 4.3 });
      setActiveJobsList([
        { _id: 'j1', title: 'Construction Helpers — Site A', workersNeeded: 5, workersHired: 2, applicationsCount: 3, status: 'open', urgency: 'urgent', pay: 700 },
        { _id: 'j2', title: 'House Painter — Interior Flat', workersNeeded: 2, workersHired: 0, applicationsCount: 1, status: 'open', urgency: 'normal', pay: 15000 }
      ]);
      setRecentApplications([
        { _id: 'a1', worker: { name: 'Rajesh Kumar', rating: 4.5 }, job: { title: 'Construction Helpers — Site A' }, createdAt: new Date(Date.now() - 1800000) },
        { _id: 'a2', worker: { name: 'Meena Kumari', rating: 4.7 }, job: { title: 'Office Cleaning' }, createdAt: new Date(Date.now() - 3600000) }
      ]);
      setFinanceStats({ totalHeld: 1400, totalReleased: 25000, totalSpent: 26400 });
      setTopMatches([
        { _id: 'w1', name: 'Suresh Yadav', rating: 4.2, workerProfile: { skills: ['helper', 'electrician'], experience: 5 }, matchScore: 92, distance: 1.2 },
        { _id: 'w2', name: 'Amit Sharma', rating: 4.8, workerProfile: { skills: ['driver', 'helper'], experience: 12 }, matchScore: 88, distance: 3.5 }
      ]);
      setPreviousWorkers([
        { _id: 'pw1', name: 'Rajesh Kumar', rating: 4.5, workerProfile: { skills: ['construction', 'painter'], experience: 8 } }
      ]);
      setLoading(false);
      return;
    }

    try {
      const { dashboardAPI, jobsAPI, applicationsAPI, workersAPI } = await import('../../api/endpoints');

      // Primary: Single dashboard API call for aggregated stats
      try {
        const dashRes = await dashboardAPI.getCompanyStats();
        const d = dashRes.data?.data || {};
        setStats({
          totalJobs: d.totalJobs || 0,
          totalHired: d.totalWorkersHired || 0,
          activeJobs: d.activeJobs || 0,
          rating: d.rating || user?.rating || 4.3,
          hiringSuccessRate: d.hiringSuccessRate || 0,
        });
        setFinanceStats(d.financeStats || { totalHeld: 0, totalReleased: 0, totalSpent: 0 });
      } catch (e) {
        console.warn('Dashboard API unavailable, using individual calls:', e);
      }

      // Fetch Company's posted jobs for active jobs list
      const resJobs = await jobsAPI.getMy();
      const myJobs = resJobs.data?.data || [];
      const activeJobs = myJobs.filter(j => j.status === 'open' || j.status === 'in_progress');
      
      setActiveJobsList(activeJobs);

      // Fetch escrow financial stats (fallback if dashboard didn't set them)
      if (!financeStats.totalSpent) {
        try {
          const resEsc = await axios.get('/api/escrow/stats');
          setFinanceStats(resEsc.data.data);
        } catch (e) { console.error(e); }
      }

      // Fetch all applications for all active jobs
      let apps = [];
      for (const job of activeJobs.slice(0, 3)) {
        try {
          const resApps = await applicationsAPI.getForJob(job._id);
          const jobApps = (resApps.data?.data || []).map(app => ({
            ...app,
            job: { _id: job._id, title: job.title }
          }));
          apps = [...apps, ...jobApps];
        } catch (e) { console.error(e); }
      }
      
      // Sort applications by date
      apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentApplications(apps.slice(0, 5));

      // Fetch worker matches for the first active job
      if (activeJobs.length > 0) {
        try {
          const resMatches = await workersAPI.getSuggested(activeJobs[0]._id);
          setTopMatches(resMatches.data?.data || []);
        } catch (e) { console.error(e); }
      }

      // Fetch previously hired workers (released escrows)
      try {
        const resPrev = await axios.get('/api/hires/company');
        const hiredList = (resPrev.data?.data || [])
          .filter(h => h.status === 'accepted')
          .map(h => h.worker)
          // Filter unique workers by ID
          .filter((w, index, self) => w && self.findIndex(t => t._id === w._id) === index);
        
        setPreviousWorkers(hiredList);
      } catch (e) { console.error(e); }

      // Fallback: Update stats if dashboard API didn't work
      if (!stats.totalJobs) {
        const totalHiredCount = myJobs.reduce((sum, j) => sum + (j.workersHired || 0), 0);
        setStats(prev => ({
          ...prev,
          totalJobs: myJobs.length,
          totalHired: totalHiredCount,
          activeJobs: activeJobs.length,
          rating: user?.rating || 4.3,
        }));
      }

    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Sockets hook
  useEffect(() => {
    if (!socket) return;

    socket.on('notification', (data) => {
      toast.success(data.message || 'Notification received!', { icon: '🔔' });
      loadDashboardData();
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  // Handle rehire submission
  const submitRehire = async (e) => {
    e.preventDefault();
    if (!rehireJobId || !rehirePay) {
      toast.error('Please select a job and enter the offer amount');
      return;
    }

    if (isDemo) {
      toast.success(`Sent Rehire Request to ${selectedRehireWorker.name}!`, { icon: '🎉' });
      setSelectedRehireWorker(null);
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      await hiresAPI.send({
        workerId: selectedRehireWorker._id,
        jobId: rehireJobId,
        offeredPay: parseFloat(rehirePay),
        message: rehireMessage,
        startDate: new Date(),
      });

      toast.success(`Sent Rehire Request to ${selectedRehireWorker.name}!`, { icon: '🎉' });
      setSelectedRehireWorker(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send rehire request.');
    }
  };

  // Application Accept/Reject
  const handleAppStatus = async (appId, status) => {
    if (isDemo) {
      toast.success(`Application ${status}!`, { icon: '✓' });
      setRecentApplications(prev => prev.filter(a => a._id !== appId));
      return;
    }

    try {
      const { applicationsAPI } = await import('../../api/endpoints');
      await applicationsAPI.updateStatus(appId, { status });
      toast.success(`Application ${status} successfully.`);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating status.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <Toaster position="top-center" />

      {/* Greeting and Verification Badge */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl font-bold text-surface-900">
              Welcome, {user?.companyProfile?.companyName || user?.name || 'Company'} 🏢
            </h1>
            {user?.companyProfile?.verified && (
              <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                <ShieldCheck className="w-3 h-3" /> VERIFIED COMPANY
              </span>
            )}
          </div>
          <p className="text-sm text-surface-500 mt-0.5">Real-Time daily wage recruitment dashboard</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="p-2.5 rounded-xl border border-surface-200 hover:bg-surface-50 text-surface-500 hover:text-surface-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Briefcase} label="Jobs Posted" value={stats.totalJobs} color="primary" />
          <StatCard icon={Users} label="Workers Hired" value={stats.totalHired} color="success" />
          <StatCard icon={TrendingUp} label="Active Jobs" value={stats.activeJobs} color="warning" />
          <StatCard icon={Star} label="Rating" value={stats.rating.toFixed(1)} color="accent" />
        </div>
      )}

      {/* Quick Actions & Finance Escrow Spends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Post Job Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/company/post-job')}
          className="gradient-primary rounded-3xl p-5 text-white text-left shadow-lg flex flex-col justify-between h-40"
        >
          <PlusCircle className="w-8 h-8 opacity-90" />
          <div>
            <p className="font-extrabold text-lg tracking-wide uppercase">Post New Job</p>
            <p className="text-xs text-blue-100 mt-0.5">Hire daily wage workers instantly</p>
          </div>
        </motion.button>

        {/* Find Workers Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/company/workers')}
          className="gradient-success rounded-3xl p-5 text-white text-left shadow-lg flex flex-col justify-between h-40"
        >
          <Search className="w-8 h-8 opacity-90" />
          <div>
            <p className="font-extrabold text-lg tracking-wide uppercase">Find Workers</p>
            <p className="text-xs text-green-100 mt-0.5">Filter by skills and distance</p>
          </div>
        </motion.button>

        {/* Financial Escrow Spends Summary */}
        <div className="bg-white rounded-3xl p-5 border border-surface-100 shadow-card flex flex-col justify-between h-40">
          <div className="flex items-center justify-between text-surface-500 font-semibold text-xs">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-warning-500" />
              <span>ESCROW SPENDS</span>
            </div>
            <span className="text-[10px] bg-warning-50 text-warning-700 px-2 py-0.5 rounded-full font-bold">LOCKED</span>
          </div>

          <div className="mt-2 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-400">Funds Held:</span>
              <span className="text-base font-bold text-surface-900">{formatCurrency(financeStats.totalHeld)}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-surface-400">Funds Released:</span>
              <span className="text-base font-bold text-green-600">{formatCurrency(financeStats.totalReleased)}</span>
            </div>
            <div className="border-t border-surface-50 pt-1 mt-1 flex justify-between items-baseline">
              <span className="text-xs font-semibold text-surface-500">Total Spent:</span>
              <span className="text-lg font-black text-primary-600">{formatCurrency(financeStats.totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section: Applications and Active jobs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Applications */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-surface-900">Recent Applications</h2>
              <span className="text-xs text-surface-400 font-medium">Daily wage applications</span>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2].map((i) => <div key={i} className="h-16 skeleton w-full" />)
              ) : recentApplications.length > 0 ? (
                recentApplications.map((app) => (
                  <div
                    key={app._id}
                    className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {app.worker?.name?.[0] || 'W'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold text-surface-900 truncate">{app.worker?.name}</p>
                          <span className="flex items-center text-xs text-warning-500 font-bold gap-0.5">
                            ★{app.worker?.rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <p className="text-xs text-surface-400 truncate">Applied for <span className="font-semibold">{app.job?.title}</span></p>
                        {app.worker?.workerProfile?.reliabilityScore && (
                          <p className="text-[10px] text-green-600 font-semibold mt-0.5">Reliability: {app.worker.workerProfile.reliabilityScore}%</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAppStatus(app._id, 'accepted')}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-all active:scale-95"
                        title="Accept Application"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAppStatus(app._id, 'rejected')}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all active:scale-95"
                        title="Decline Application"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center border border-surface-100 text-surface-400">
                  No active job applications found.
                </div>
              )}
            </div>
          </section>

          {/* Active Jobs Progress */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-surface-900">Active Jobs Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1, 2].map((i) => <div key={i} className="h-28 skeleton w-full" />)
              ) : activeJobsList.length > 0 ? (
                activeJobsList.map((job) => (
                  <div key={job._id} className="bg-white rounded-2xl border border-surface-100 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-surface-900 truncate w-3/4" title={job.title}>
                        {job.title}
                      </h3>
                      {job.urgency === 'urgent' && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-extrabold rounded-full">URGENT</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-surface-500 mt-2">
                      <span>{job.workersHired} / {job.workersNeeded} Workers Hired</span>
                      <span className="font-bold text-primary-600">{formatCurrency(job.pay)}{job.payType === 'fixed' ? ' Fixed' : '/day'}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 h-2.5 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, ((job.workersHired || 0) / (job.workersNeeded || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center border border-surface-100 text-surface-400 md:col-span-2">
                  No active job postings. Tap 'Post New Job' to start.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar section: Top Matches & Rehire */}
        <div className="space-y-6">
          {/* Smart Matching - suggested workers */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-surface-900 flex items-center gap-1.5">
              💡 Top Matches Near You
            </h2>
            <div className="bg-gradient-to-br from-surface-900 to-surface-950 rounded-3xl p-4 text-white space-y-3 shadow-lg">
              {topMatches.length > 0 ? (
                topMatches.map((worker) => (
                  <div key={worker._id} className="bg-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 border border-white/5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate">{worker.name}</span>
                        <span className="text-[10px] text-yellow-300 font-semibold">★{worker.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                      <p className="text-[10px] text-surface-300 truncate mt-0.5">
                        {worker.workerProfile?.skills?.slice(0, 2).join(', ')} • {worker.workerProfile?.experience || 0} yrs
                      </p>
                      {worker.distance !== undefined && (
                        <p className="text-[9px] text-primary-300 font-semibold mt-0.5">📍 {worker.distance} km away</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="bg-green-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full block">
                        {worker.matchScore || 90}% Match
                      </span>
                      <button
                        onClick={() => setSelectedRehireWorker(worker)}
                        className="mt-2 text-[9px] text-primary-300 underline font-bold hover:text-white"
                      >
                        Hire Now
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-surface-400 text-center py-4">No suggested workers matches found.</p>
              )}
            </div>
          </section>

          {/* Rehire workers list */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-surface-900">Rehire Previous Workers</h2>
            <div className="space-y-2">
              {previousWorkers.length > 0 ? (
                previousWorkers.map((worker) => (
                  <div
                    key={worker._id}
                    className="bg-white rounded-2xl border border-surface-100 p-3.5 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-surface-900 truncate">{worker.name}</p>
                      <p className="text-[10px] text-surface-400 truncate">★{worker.rating?.toFixed(1) || '4.0'} • {worker.workerProfile?.skills?.slice(0, 2).join(', ')}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedRehireWorker(worker);
                        setRehirePay('');
                      }}
                      className="px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl text-[10px] tracking-wider transition-all active:scale-95 shrink-0"
                    >
                      REHIRE
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-5 text-center border border-surface-100 text-xs text-surface-400">
                  Workers you complete jobs with will appear here for fast rehiring.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* REHIRE DIALOG MODAL */}
      <AnimatePresence>
        {selectedRehireWorker && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-lg text-surface-900">Send Hire Offer</h3>
                  <p className="text-xs text-surface-500">To: <span className="font-semibold">{selectedRehireWorker.name}</span></p>
                </div>
                <button
                  onClick={() => setSelectedRehireWorker(null)}
                  className="p-1 text-surface-400 hover:text-surface-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={submitRehire} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-surface-600 block mb-1">Select Job Posting</label>
                  <select
                    value={rehireJobId}
                    onChange={(e) => {
                      setRehireJobId(e.target.value);
                      const selectedJob = activeJobsList.find(j => j._id === e.target.value);
                      if (selectedJob) setRehirePay(selectedJob.pay);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">-- Choose Job --</option>
                    {activeJobsList.map(j => (
                      <option key={j._id} value={j._id}>{j.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-600 block mb-1">Offered Daily Wage (₹)</label>
                  <input
                    type="number"
                    value={rehirePay}
                    onChange={(e) => setRehirePay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Offer wage (e.g. 700)"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-surface-600 block mb-1">Invite Message</label>
                  <textarea
                    value={rehireMessage}
                    onChange={(e) => setRehireMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    maxLength={300}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-xs tracking-wider flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" /> SEND REHIRE OFFER
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyDashboard;
