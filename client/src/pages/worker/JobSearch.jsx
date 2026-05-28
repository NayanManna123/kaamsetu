import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, X, MapPin, SlidersHorizontal, Loader2, Navigation, Zap } from 'lucide-react';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';
import JobDetailsModal from '../../components/JobDetailsModal';
import { ALL_SKILLS, WORK_TYPE_LABELS, formatDistance } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Demo fallback data
const DEMO_JOBS = [
  { _id: '1', title: 'Construction Workers — Site A', company: { name: 'BuildRight Construction', companyProfile: { verified: true }, rating: 4.3 }, workType: 'daily', pay: 700, payType: 'per_day', workersNeeded: 5, workersHired: 2, skills: ['construction', 'helper'], location: { city: 'Mumbai', address: 'BKC Phase 2' }, duration: '10 hours', urgency: 'urgent', distance: 1.2, matchScore: 92 },
  { _id: '2', title: 'Delivery Drivers', company: { name: 'FastLogistics', companyProfile: { verified: true }, rating: 4.5 }, workType: 'instant', pay: 500, payType: 'per_day', workersNeeded: 10, workersHired: 4, skills: ['driver'], location: { city: 'Bangalore' }, duration: '12 hours', urgency: 'urgent', distance: 3.5, matchScore: 85 },
  { _id: '3', title: 'Office Deep Cleaning', company: { name: 'CleanHome Services', companyProfile: { verified: true }, rating: 4.1 }, workType: 'daily', pay: 600, payType: 'per_day', workersNeeded: 4, skills: ['cleaner', 'helper'], location: { city: 'Delhi' }, duration: '8 hours', urgency: 'normal', distance: 5.0, matchScore: 78 },
  { _id: '4', title: 'House Painter — Interior', company: { name: 'BuildRight', rating: 4.3 }, workType: 'contract', pay: 15000, payType: 'fixed', workersNeeded: 2, skills: ['painter'], location: { city: 'Mumbai' }, duration: '5 days', urgency: 'normal', distance: 8.3, matchScore: 70 },
  { _id: '5', title: 'Electrician for Office', company: { name: 'CleanHome', rating: 4.1 }, workType: 'contract', pay: 25000, payType: 'fixed', workersNeeded: 1, skills: ['electrician'], location: { city: 'Delhi' }, duration: '7 days', urgency: 'normal', distance: 12.1, matchScore: 65 },
  { _id: '6', title: 'Warehouse Helpers', company: { name: 'FastLogistics', companyProfile: { verified: true }, rating: 4.5 }, workType: 'daily', pay: 550, payType: 'per_day', workersNeeded: 8, skills: ['helper'], location: { city: 'Bangalore' }, duration: '10 hours', urgency: 'normal', distance: 4.2, matchScore: 80 },
  { _id: '7', title: 'Plumber Emergency', company: { name: 'BuildRight', rating: 4.3 }, workType: 'instant', pay: 1200, payType: 'per_day', workersNeeded: 1, skills: ['plumber'], location: { city: 'Mumbai' }, duration: '4 hours', urgency: 'urgent', distance: 2.0, matchScore: 88 },
  { _id: '8', title: 'Welding Work', company: { name: 'FastLogistics', rating: 4.5 }, workType: 'contract', pay: 18000, payType: 'fixed', workersNeeded: 2, skills: ['welder', 'carpenter'], location: { city: 'Ahmedabad' }, duration: '4 days', urgency: 'normal', distance: 15.0, matchScore: 60 },
];

const JobSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [maxDistance, setMaxDistance] = useState(25);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token';

  // Auto-detect GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsLoading(false);
        },
        () => {
          // Default to Mumbai if GPS fails
          setUserCoords({ lat: 19.076, lng: 72.8777 });
          setGpsLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      setUserCoords({ lat: 19.076, lng: 72.8777 });
    }
  }, []);

  // Fetch jobs from API or use demo data
  const fetchJobs = useCallback(async (pageNum = 1, append = false) => {
    if (isDemo) {
      let filtered = [...DEMO_JOBS];
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.skills.some(s => s.includes(q)));
      }
      if (selectedSkills.length > 0) {
        filtered = filtered.filter(j => j.skills.some(s => selectedSkills.includes(s)));
      }
      if (selectedType) {
        filtered = filtered.filter(j => j.workType === selectedType);
      }
      if (urgentOnly) {
        filtered = filtered.filter(j => j.urgency === 'urgent');
      }
      filtered = filtered.filter(j => (j.distance || 0) <= maxDistance);
      
      setJobs(filtered);
      setTotalResults(filtered.length);
      setHasMore(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(pageNum === 1);
      const { jobsAPI } = await import('../../api/endpoints');
      
      const params = {
        page: pageNum,
        limit: 12,
      };
      
      if (query) params.q = query;
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
      if (selectedType) params.workType = selectedType;
      if (userCoords) {
        params.lat = userCoords.lat;
        params.lng = userCoords.lng;
        params.maxDistance = maxDistance * 1000; // Convert km to meters
      }

      const res = await jobsAPI.search(params);
      const data = res.data?.data || [];
      
      if (append) {
        setJobs(prev => [...prev, ...data]);
      } else {
        setJobs(data);
      }
      setTotalResults(res.data?.total || data.length);
      setHasMore(res.data?.page < res.data?.pages);
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to demo
      setJobs(DEMO_JOBS);
      setTotalResults(DEMO_JOBS.length);
    } finally {
      setLoading(false);
    }
  }, [query, selectedSkills, selectedType, maxDistance, urgentOnly, userCoords, isDemo]);

  // Fetch when filters or coords change
  useEffect(() => {
    if (userCoords || isDemo) {
      setPage(1);
      fetchJobs(1);
    }
  }, [query, selectedSkills, selectedType, maxDistance, urgentOnly, userCoords, isDemo]);

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill.toLowerCase())
        ? prev.filter((s) => s !== skill.toLowerCase())
        : [...prev, skill.toLowerCase()]
    );
  };

  const handleApply = (job) => {
    toast.success(`Applied to "${job.title}"`, {
      icon: '🎉',
      style: { borderRadius: '16px', padding: '14px 20px', fontSize: '14px' },
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs(nextPage, true);
  };

  const activeFilterCount = selectedSkills.length + (selectedType ? 1 : 0) + (urgentOnly ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header with GPS indicator */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Search Jobs</h1>
        {gpsLoading ? (
          <span className="flex items-center gap-1 text-xs text-surface-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Detecting location...
          </span>
        ) : userCoords ? (
          <span className="flex items-center gap-1 text-xs text-success-600 bg-success-500/10 px-2 py-1 rounded-full">
            <Navigation className="w-3 h-3" /> GPS Active
          </span>
        ) : null}
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search jobs, skills, companies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field pl-12"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-3 rounded-xl border transition-colors relative ${
            showFilters || activeFilterCount > 0
              ? 'bg-primary-50 border-primary-200 text-primary-600'
              : 'bg-white border-surface-200 text-surface-600'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Quick Filters Row */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setUrgentOnly(!urgentOnly)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            urgentOnly
              ? 'bg-danger-500 text-white shadow-md'
              : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
          }`}
        >
          <Zap className="w-4 h-4" /> Urgent Only
        </button>
        <button
          onClick={() => setMaxDistance(maxDistance === 5 ? 25 : 5)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            maxDistance === 5
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
          }`}
        >
          <MapPin className="w-4 h-4" /> Within 5 km
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
            {/* Work Type */}
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Work Type</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(WORK_TYPE_LABELS).filter(([k]) => k !== 'both').map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(selectedType === key ? '' : key)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedType === key
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-semibold text-surface-700">Max Distance</p>
                <span className="text-sm font-bold text-primary-600">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-[10px] text-surface-400 mt-1">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-sm font-semibold text-surface-700 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                      selectedSkills.includes(skill.toLowerCase())
                        ? 'chip-active'
                        : 'chip'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear */}
            {(selectedSkills.length > 0 || selectedType || urgentOnly) && (
              <button
                onClick={() => { setSelectedSkills([]); setSelectedType(''); setUrgentOnly(false); setMaxDistance(25); }}
                className="text-sm text-danger-600 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results count */}
      <p className="text-sm text-surface-500">
        {loading ? 'Searching...' : `${totalResults} jobs found`}
      </p>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-surface-100 p-5 space-y-3 animate-pulse">
              <div className="h-5 bg-surface-200 rounded w-3/4" />
              <div className="h-4 bg-surface-100 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-surface-100 rounded-full w-20" />
                <div className="h-6 bg-surface-100 rounded-full w-16" />
              </div>
              <div className="h-10 bg-surface-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <JobCard 
                  job={job} 
                  onApply={(j) => navigate(`/job/${j._id}`)} 
                  onViewDetails={(j) => navigate(`/job/${j._id}`)} 
                  showDistance={true} 
                />
              </motion.div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                className="btn-outline text-sm py-2.5 px-8"
              >
                Load More Jobs
              </button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="No jobs found"
          message="Try adjusting your filters or search query"
        />
      )}
    </div>
  );
};

export default JobSearch;
