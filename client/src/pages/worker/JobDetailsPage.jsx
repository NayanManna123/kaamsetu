import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Navigation,
  ShieldCheck,
  Zap,
  Phone,
  ArrowRight,
  MessageSquare,
  Loader2,
  Calendar,
  Briefcase
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getSkillColor, WORK_TYPE_LABELS } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Leaflet helper to fit boundaries to include both worker and job coordinates
const FitBoundsHelper = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const timer = setTimeout(() => {
        try {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (e) {
          console.error('Fit bounds error:', e);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [bounds, map]);
  return null;
};

// Haversine distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);

  const [workerCoords, setWorkerCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  const jobLat = job?.latitude || job?.location?.coordinates?.[1] || 19.076;
  const jobLng = job?.longitude || job?.location?.coordinates?.[0] || 72.8777;

  // Retrieve user current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setWorkerCoords([lat, lng]);
          setGpsLoading(false);
        },
        (error) => {
          console.warn('Geolocation access failed:', error);
          setGpsLoading(false);
        },
        { timeout: 8000 }
      );
    }
  }, []);

  // Calculate distance when coordinates are resolved
  useEffect(() => {
    if (workerCoords && job) {
      const dist = calculateDistance(workerCoords[0], workerCoords[1], jobLat, jobLng);
      setDistance(dist);
    }
  }, [workerCoords, job, jobLat, jobLng]);

  // Load Job and application status
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        if (isDemo) {
          // Demo fallback
          const demoJob = {
            _id: jobId,
            title: 'Construction Helpers — Phase 3',
            description: 'Looking for fit construction workers for BKC phase 2 site. Tasks include helper duties, load carrying, and cleaning. Lunch and protective gear will be provided on-site.',
            company: {
              _id: 'c1',
              name: 'BuildRight Construction',
              companyProfile: {
                companyName: 'BuildRight Construction Pvt Ltd',
                verified: true,
                trustScore: 98,
              },
              phone: '9876543210'
            },
            workType: 'daily',
            pay: 750,
            payType: 'per_day',
            workersNeeded: 5,
            workersHired: 1,
            skills: ['construction', 'helper', 'heavy loading'],
            location: {
              address: 'BKC Phase 2, behind Diamond Bourse',
              city: 'Mumbai'
            },
            latitude: 19.076,
            longitude: 72.8777,
            duration: '3 days',
            startDate: new Date().toISOString(),
            startTime: '08:30 AM',
            urgency: 'urgent'
          };
          setJob(demoJob);
          setLoading(false);
          return;
        }

        const { jobsAPI, applicationsAPI, chatAPI } = await import('../../api/endpoints');
        const [jobRes, appsRes] = await Promise.all([
          jobsAPI.getById(jobId),
          applicationsAPI.getMy()
        ]);

        const jobData = jobRes.data?.data;
        setJob(jobData);

        // Check if already applied
        const apps = appsRes.data?.data || [];
        const matchApp = apps.find(a => a.job?._id === jobId || a.job === jobId);
        if (matchApp) {
          setAlreadyApplied(true);
          setApplicationStatus(matchApp.status);

          // Get chat room if exists
          try {
            const chatRes = await chatAPI.getRooms();
            const rooms = chatRes.data?.data || [];
            const relatedRoom = rooms.find(r => r.job?._id === jobId || r.job === jobId);
            if (relatedRoom) {
              setChatRoomId(relatedRoom._id);
            }
          } catch (e) {
            console.warn('Failed to fetch rooms:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load job details:', err);
        toast.error('Failed to fetch job details');
        navigate('/worker/search');
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [jobId, isDemo, navigate]);

  const handleApply = async () => {
    setApplying(true);
    try {
      if (isDemo) {
        setAlreadyApplied(true);
        setApplicationStatus('pending');
        setChatRoomId('room1'); // Mock room id
        toast.success('Successfully applied! Mock chat room activated.', { icon: '🎉' });
        return;
      }

      const { applicationsAPI } = await import('../../api/endpoints');
      const res = await applicationsAPI.applyJob({ jobId });
      
      setAlreadyApplied(true);
      setApplicationStatus(res.data?.data?.status || 'pending');
      
      if (res.data?.chatRoomId) {
        setChatRoomId(res.data.chatRoomId);
      }

      toast.success(res.data?.message || 'Application submitted successfully!', { icon: '🎉' });
    } catch (err) {
      console.error('Job application error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleStartChat = async () => {
    if (isDemo) {
      navigate('/worker/chat', { state: { roomId: chatRoomId || 'room1' } });
      return;
    }

    try {
      if (chatRoomId) {
        navigate('/worker/chat', { state: { roomId: chatRoomId } });
        return;
      }

      const { chatAPI } = await import('../../api/endpoints');
      const res = await chatAPI.getOrCreateRoom({
        participantId: job.company?._id || job.company,
        jobId: job._id
      });

      const roomId = res.data?.data?._id;
      if (roomId) {
        navigate('/worker/chat', { state: { roomId } });
      } else {
        toast.error('Failed to initialize conversation');
      }
    } catch (err) {
      console.error('Start chat error:', err);
      toast.error(err.response?.data?.message || 'Could not start chat room.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
          <p className="text-sm text-surface-500 font-medium animate-pulse">Loading Job Details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-surface-150 max-w-xl mx-auto shadow-card">
        <h3 className="text-lg font-bold text-surface-800">Job Not Found</h3>
        <p className="text-sm text-surface-450 mt-1">The job you are looking for does not exist or has been closed.</p>
        <button onClick={() => navigate('/worker/search')} className="mt-4 btn-primary flex items-center gap-2 mx-auto text-xs py-2 px-4">
          <ArrowLeft className="w-4 h-4" /> Back to Search
        </button>
      </div>
    );
  }

  // DivIcons preventing Vite asset bundler issues
  const workerIcon = L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold border-2 border-white shadow-md animate-bounce-gentle">👷</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const jobIcon = L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-success-600 text-white font-bold border-2 border-white shadow-md">📍</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const mapBounds = [];
  if (workerCoords) mapBounds.push(workerCoords);
  mapBounds.push([jobLat, jobLng]);

  const isUrgent = job.urgency === 'urgent';
  const company = job.company || {};
  const compName = company.companyProfile?.companyName || company.name || job.companyName || 'Employer';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white hover:bg-surface-50 border border-surface-200 rounded-2xl transition-all shadow-sm active:scale-95 text-surface-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-surface-900 leading-none">Job Details</h1>
          <p className="text-xs text-surface-450 mt-1">View site map and submit application</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Job Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-surface-100 shadow-card p-6 space-y-6 relative overflow-hidden">
            {isUrgent && (
              <div className="absolute right-0 top-0 gradient-warm text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 fill-white" /> Urgent Shift
              </div>
            )}

            <div className="space-y-1">
              <span className="chip text-[11px] font-bold">
                {WORK_TYPE_LABELS[job.workType] || job.workType}
              </span>
              <h2 className="text-2xl font-extrabold text-surface-900 pt-1 leading-tight">{job.title}</h2>
              <div className="flex items-center gap-1.5 text-sm text-surface-500 font-medium mt-1">
                <span className="w-5 h-5 bg-primary-50 rounded-lg text-[10px] font-bold text-primary-650 flex items-center justify-center">
                  {compName[0]}
                </span>
                <span>{compName}</span>
                {company.companyProfile?.verified && (
                  <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-50 p-4 border border-surface-100 rounded-2xl">
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider block">Wages</span>
                <p className="text-lg font-extrabold text-primary-600 leading-none pt-0.5">{formatCurrency(job.pay)}</p>
                <p className="text-[10px] text-surface-450 capitalize mt-0.5">{job.payType?.replace('_', ' ')}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider block">Openings</span>
                <p className="text-lg font-extrabold text-surface-850 leading-none pt-0.5">
                  {job.workersHired || 0} / {job.workersNeeded || 1}
                </p>
                <p className="text-[10px] text-surface-450 mt-0.5">Hired</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider block">Duration</span>
                <p className="text-lg font-extrabold text-surface-850 truncate leading-none pt-0.5">{job.duration || '1 day'}</p>
                <p className="text-[10px] text-surface-450 mt-0.5">Estimated Duration</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-extrabold text-surface-400 uppercase tracking-wider block">Start Date</span>
                <p className="text-sm font-bold text-surface-850 pt-0.5">
                  {job.startDate ? new Date(job.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                </p>
                <p className="text-[10px] text-surface-450 mt-0.5">{job.startTime || '09:00 AM'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary-500" /> About the Job
              </h4>
              <p className="text-sm text-surface-650 leading-relaxed bg-surface-50/50 p-4 border border-surface-50 rounded-2xl whitespace-pre-wrap">
                {job.description || 'No description provided by the employer.'}
              </p>
            </div>

            {/* Skills Badges */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span key={skill} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getSkillColor(skill)}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Employer Card */}
          <div className="bg-white rounded-3xl border border-surface-100 p-5 shadow-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-white font-extrabold flex items-center justify-center text-lg shadow-md">
                {compName[0]}
              </div>
              <div>
                <h4 className="font-extrabold text-surface-900 text-base">{compName}</h4>
                <p className="text-xs text-surface-450">Trust Score: {company.companyProfile?.trustScore || 100}%</p>
              </div>
            </div>
            {company.phone && (
              <a 
                href={`tel:${company.phone}`}
                className="p-3 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-2xl transition-colors text-surface-600 flex items-center gap-1.5 text-xs font-bold shadow-sm"
              >
                <Phone className="w-4 h-4 text-green-500" /> Call Employer
              </a>
            )}
          </div>
        </div>

        {/* Right Column: Maps and Actions */}
        <div className="space-y-6">
          
          {/* Map Display Card */}
          <div className="bg-white rounded-3xl border border-surface-100 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-500" /> Job Location
              </h4>
              {distance !== null && (
                <span className="text-xs text-primary-650 font-extrabold bg-primary-50 border border-primary-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  {distance.toFixed(1)} km away
                </span>
              )}
            </div>

            <p className="text-xs text-surface-500 leading-normal italic bg-surface-50 p-3 rounded-2xl border border-surface-100">
              📍 {job.location?.address || job.location?.city || 'Location Address TBD'}
            </p>

            {/* Interactive Map */}
            <div className="h-64 w-full rounded-2xl overflow-hidden border border-surface-200 shadow-md relative z-10">
              <MapContainer 
                center={[jobLat, jobLng]} 
                zoom={14} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Job Location */}
                <Marker position={[jobLat, jobLng]} icon={jobIcon}>
                  <Popup>
                    <div className="p-1 space-y-1">
                      <p className="font-bold text-xs text-surface-900">{job.title}</p>
                      <p className="text-[10px] text-surface-500 leading-tight">{job.location?.address || 'Site Location'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Worker Current Location */}
                {workerCoords && (
                  <Marker position={workerCoords} icon={workerIcon}>
                    <Popup>
                      <span className="text-xs font-bold">Your Location</span>
                    </Popup>
                  </Marker>
                )}

                {/* Polyline Route Line */}
                {workerCoords && (
                  <Polyline 
                    positions={[workerCoords, [jobLat, jobLng]]} 
                    color="#4F46E5" 
                    weight={3.5} 
                    dashArray="6, 12" 
                  />
                )}

                {/* Bounds Fitter */}
                <FitBoundsHelper bounds={mapBounds} />
              </MapContainer>
            </div>
            
            <div className="flex justify-between text-[10px] text-surface-400 font-medium px-1">
              <span>Latitude: {jobLat.toFixed(6)}</span>
              <span>Longitude: {jobLng.toFixed(6)}</span>
            </div>
          </div>

          {/* Call to Actions Card */}
          <div className="bg-white rounded-3xl border border-surface-100 shadow-card p-5 space-y-3">
            {!alreadyApplied ? (
              <button
                onClick={handleApply}
                disabled={applying}
                className="w-full btn-primary py-4 text-base font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                {applying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Apply for this Job <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className={`text-center py-3.5 px-4 rounded-2xl text-sm font-extrabold border ${
                  applicationStatus === 'accepted'
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : applicationStatus === 'rejected'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-yellow-50 border-yellow-250 text-yellow-750'
                }`}>
                  {applicationStatus === 'accepted' && '🎉 Application Accepted (Auto-Hired!)'}
                  {applicationStatus === 'rejected' && '❌ Application Declined'}
                  {applicationStatus === 'pending' && '⏳ Applied (Application Pending)'}
                </div>

                {applicationStatus !== 'rejected' && (
                  <button
                    onClick={handleStartChat}
                    className="w-full py-4 bg-gradient-to-r from-primary-650 to-primary-750 text-white font-extrabold rounded-2xl text-base flex items-center justify-center gap-2 shadow-md hover:shadow-glow transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-5 h-5 fill-white/10" />
                    Start Chat with Employer
                  </button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetailsPage;
