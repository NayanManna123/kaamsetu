import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, X, Users, CheckSquare, Zap, MapPin, SlidersHorizontal, Loader2 } from 'lucide-react';
import WorkerCard from '../../components/WorkerCard';
import QuickHireModal from '../../components/QuickHireModal';
import EmptyState from '../../components/EmptyState';
import { ALL_SKILLS } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

/**
 * Demo worker data for offline mode
 */
const DEMO_WORKERS = [
  { _id: 'w1', name: 'Rajesh Kumar', rating: 4.5, ratingCount: 23, isVerified: true, location: { city: 'Mumbai', address: 'Andheri West', coordinates: [72.8362, 19.1362] }, workerProfile: { skills: ['construction', 'painter', 'helper'], experience: 8, availability: 'today', expectedWage: 700, completedJobs: 45, completionRate: 96, reliabilityScore: 95, isInstantAvailable: true }, distance: 1.2, matchScore: 92 },
  { _id: 'w2', name: 'Suresh Yadav', rating: 4.2, ratingCount: 15, location: { city: 'Mumbai', address: 'Worli', coordinates: [72.8150, 19.0000] }, workerProfile: { skills: ['electrician', 'plumber'], experience: 5, availability: 'available', expectedWage: 900, completedJobs: 30, completionRate: 90, reliabilityScore: 88 }, distance: 3.5, matchScore: 78 },
  { _id: 'w3', name: 'Amit Sharma', rating: 4.8, ratingCount: 40, isVerified: true, location: { city: 'Delhi', address: 'Connaught Place', coordinates: [77.2200, 28.6328] }, workerProfile: { skills: ['driver', 'helper'], experience: 12, availability: 'today', expectedWage: 800, completedJobs: 120, completionRate: 98, reliabilityScore: 97, isInstantAvailable: true }, distance: 2.1, matchScore: 88 },
  { _id: 'w4', name: 'Priya Devi', rating: 4.6, ratingCount: 18, location: { city: 'Bangalore', address: 'Koramangala', coordinates: [77.6150, 12.9352] }, workerProfile: { skills: ['cleaner', 'helper', 'cook'], experience: 3, availability: 'this_week', expectedWage: 600, completedJobs: 22, completionRate: 100, reliabilityScore: 92 }, distance: 5.8, matchScore: 65 },
  { _id: 'w5', name: 'Ravi Patel', rating: 3.9, ratingCount: 8, location: { city: 'Ahmedabad', address: 'Navrangpura', coordinates: [72.5571, 23.0337] }, workerProfile: { skills: ['carpenter', 'welder', 'construction'], experience: 6, availability: 'available', expectedWage: 850, completedJobs: 18, completionRate: 85, reliabilityScore: 80 }, distance: 8.2, matchScore: 55 },
  { _id: 'w6', name: 'Meena Kumari', rating: 4.7, ratingCount: 30, isVerified: true, location: { city: 'Mumbai', address: 'Goregaon', coordinates: [72.8494, 19.1643] }, workerProfile: { skills: ['painter', 'cleaner'], experience: 4, availability: 'today', expectedWage: 550, completedJobs: 55, completionRate: 97, reliabilityScore: 94, isInstantAvailable: true }, distance: 1.8, matchScore: 85 },
];

/**
 * Search Workers Page — core hiring interface
 * 
 * Features:
 * - Real API calls with demo fallback
 * - Filters: Skills, Available Now toggle, Distance, Min Rating
 * - Auto-detect company GPS location
 * - Exact distance on each card
 * - One-click "Hire Now" opens QuickHireModal
 * - Bulk Hire mode
 * - Sorted by distance → skill → rating
 * - Pagination with "Load More"
 */
const SearchWorkers = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [instantOnly, setInstantOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Quick hire modal state
  const [hireTarget, setHireTarget] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);

  // GPS location
  const [userCoords, setUserCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  // Auto-detect GPS location on mount
  useEffect(() => {
    if (user?.location?.coordinates?.[0] !== 0) {
      setUserCoords({
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      });
    } else {
      detectGPS();
    }
  }, []);

  const detectGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        // Fallback to Mumbai
        setUserCoords({ lat: 19.076, lng: 72.8777 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Fetch active jobs for QuickHireModal
  useEffect(() => {
    const fetchJobs = async () => {
      if (isDemo) {
        setActiveJobs([
          { _id: 'j1', title: 'Construction Helpers — Site A', pay: 700 },
          { _id: 'j2', title: 'House Painter — Interior', pay: 15000 },
        ]);
        return;
      }
      try {
        const { jobsAPI } = await import('../../api/endpoints');
        const res = await jobsAPI.getMy({ status: 'open' });
        setActiveJobs(res.data?.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchJobs();
  }, []);

  // Search workers
  const searchWorkers = useCallback(async (pageNum = 1, append = false) => {
    if (isDemo) {
      let filtered = DEMO_WORKERS.filter((w) => {
        const matchesQuery = !query || w.name.toLowerCase().includes(query.toLowerCase());
        const matchesSkills = selectedSkills.length === 0 || w.workerProfile.skills.some((s) => selectedSkills.includes(s));
        const matchesInstant = !instantOnly || w.workerProfile.isInstantAvailable;
        const matchesRating = !minRating || w.rating >= minRating;
        return matchesQuery && matchesSkills && matchesInstant && matchesRating;
      });

      // Sort: instant first, then by distance
      filtered.sort((a, b) => {
        if (a.workerProfile.isInstantAvailable && !b.workerProfile.isInstantAvailable) return -1;
        if (!a.workerProfile.isInstantAvailable && b.workerProfile.isInstantAvailable) return 1;
        return (a.distance || 999) - (b.distance || 999);
      });

      setWorkers(filtered);
      setTotalCount(filtered.length);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      if (!append) setLoading(true);
      const { workersAPI } = await import('../../api/endpoints');

      const params = {
        page: pageNum,
        limit: 12,
        ...(query && { q: query }),
        ...(selectedSkills.length > 0 && { skills: selectedSkills.join(',') }),
        ...(instantOnly && { instantOnly: 'true' }),
        ...(minRating && { minRating }),
        ...(userCoords && { lat: userCoords.lat, lng: userCoords.lng, maxDistance: 50000 }),
      };

      const res = await workersAPI.search(params);
      const data = res.data?.data || [];
      const total = res.data?.total || data.length;

      if (append) {
        setWorkers(prev => [...prev, ...data]);
      } else {
        setWorkers(data);
      }
      setTotalCount(total);
      setHasMore(data.length >= 12);
      setPage(pageNum);
    } catch (err) {
      toast.error('Failed to search workers');
    } finally {
      setLoading(false);
    }
  }, [query, selectedSkills, instantOnly, minRating, userCoords, isDemo]);

  // Trigger search on filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchWorkers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchWorkers]);

  // Listen for real-time worker availability changes
  useEffect(() => {
    if (!socket) return;
    const handleAvailChange = (data) => {
      setWorkers(prev => prev.map(w =>
        w._id === data.workerId
          ? { ...w, workerProfile: { ...w.workerProfile, isInstantAvailable: data.isInstantAvailable } }
          : w
      ));
    };
    socket.on('workerAvailabilityChanged', handleAvailChange);
    return () => socket.off('workerAvailabilityChanged', handleAvailChange);
  }, [socket]);

  const toggleSkill = (skill) => {
    const lower = skill.toLowerCase();
    setSelectedSkills((prev) => prev.includes(lower) ? prev.filter((s) => s !== lower) : [...prev, lower]);
  };

  const toggleWorkerSelect = (worker) => {
    setSelectedWorkers((prev) =>
      prev.find((w) => w._id === worker._id)
        ? prev.filter((w) => w._id !== worker._id)
        : [...prev, worker]
    );
  };

  const handleHire = (worker) => {
    if (bulkMode) {
      toggleWorkerSelect(worker);
    } else {
      setHireTarget(worker);
    }
  };

  const handleHireSubmit = async (hireData) => {
    if (isDemo) return;
    const { hiresAPI } = await import('../../api/endpoints');
    await hiresAPI.send(hireData);
  };

  const handleBulkHire = async () => {
    if (isDemo) {
      toast.success(`Sent hire requests to ${selectedWorkers.length} workers!`, { icon: '🎉' });
      setSelectedWorkers([]);
      setBulkMode(false);
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      const jobId = activeJobs[0]?._id;
      if (!jobId) {
        toast.error('Please post a job first before bulk hiring');
        return;
      }
      await hiresAPI.bulkHire({
        workerIds: selectedWorkers.map(w => w._id),
        jobId,
        offeredPay: activeJobs[0]?.pay || 700,
      });
      toast.success(`Sent hire requests to ${selectedWorkers.length} workers!`, { icon: '🎉' });
      setSelectedWorkers([]);
      setBulkMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk hire failed');
    }
  };

  const loadMore = () => {
    searchWorkers(page + 1, true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Find Workers</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setBulkMode(!bulkMode); setSelectedWorkers([]); }}
            className={`text-sm font-medium px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
              bulkMode ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {bulkMode ? 'Cancel Bulk' : 'Bulk Hire'}
          </button>
        </div>
      </div>

      {/* Available Now Toggle — prominent, above search */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setInstantOnly(!instantOnly)}
        className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all border-2 ${
          instantOnly
            ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25'
            : 'bg-white border-surface-200 text-surface-600 hover:border-green-300 hover:bg-green-50'
        }`}
      >
        {instantOnly ? (
          <>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            ⚡ SHOWING AVAILABLE NOW WORKERS ONLY
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Show Only Available Now Workers
          </>
        )}
      </motion.button>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-12"
            id="worker-search-input"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition-colors ${
            showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-surface-200'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border border-surface-100 p-4 space-y-4 overflow-hidden"
          >
            {/* Skills Filter */}
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Filter by Skills</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedSkills.includes(skill.toLowerCase()) ? 'chip-active' : 'chip'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Min Rating */}
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Minimum Rating</p>
              <div className="flex gap-2">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      minRating === r ? 'chip-active' : 'chip'
                    }`}
                  >
                    {r === 0 ? 'Any' : `★ ${r}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Location */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <MapPin className="w-4 h-4 text-primary-500" />
                {userCoords ? (
                  <span>📍 Location detected — showing nearby workers first</span>
                ) : (
                  <span>Enable GPS for distance-based results</span>
                )}
              </div>
              {!userCoords && (
                <button
                  onClick={detectGPS}
                  disabled={gpsLoading}
                  className="text-xs font-bold text-primary-600 hover:text-primary-700"
                >
                  {gpsLoading ? 'Detecting...' : 'Detect Location'}
                </button>
              )}
            </div>

            {/* Clear Filters */}
            {(selectedSkills.length > 0 || minRating > 0) && (
              <button
                onClick={() => { setSelectedSkills([]); setMinRating(0); }}
                className="text-sm text-danger-600 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk hire bar */}
      <AnimatePresence>
        {bulkMode && selectedWorkers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-40 bg-primary-700 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between"
          >
            <span className="font-semibold">{selectedWorkers.length} workers selected</span>
            <button
              onClick={handleBulkHire}
              className="bg-white text-primary-700 font-bold py-2 px-5 rounded-xl text-sm hover:bg-primary-50 transition-colors"
            >
              Hire All ⚡
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="text-sm text-surface-500">
        {loading ? 'Searching...' : `${totalCount} worker${totalCount !== 1 ? 's' : ''} found`}
      </p>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-56 skeleton w-full rounded-2xl" />
          ))}
        </div>
      ) : workers.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workers.map((worker, i) => (
              <motion.div
                key={worker._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <WorkerCard
                  worker={worker}
                  onHire={handleHire}
                  selectable={bulkMode}
                  selected={selectedWorkers.some((w) => w._id === worker._id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={loadMore}
                className="px-6 py-3 bg-white border border-surface-200 text-surface-600 font-semibold rounded-xl hover:bg-surface-50 transition-colors text-sm"
              >
                Load More Workers
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Users} title="No workers found" message="Try adjusting your filters or expanding search area" />
      )}

      {/* Quick Hire Modal */}
      <AnimatePresence>
        {hireTarget && (
          <QuickHireModal
            worker={hireTarget}
            jobs={activeJobs}
            onClose={() => setHireTarget(null)}
            onHire={handleHireSubmit}
            isDemo={isDemo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchWorkers;
