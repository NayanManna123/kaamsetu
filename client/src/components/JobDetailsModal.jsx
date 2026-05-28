import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  Navigation,
  ShieldCheck,
  Zap,
  ExternalLink,
  Phone,
  ArrowRight
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatCurrency, getSkillColor, WORK_TYPE_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Leaflet helper to fit the map bounds to include both the worker and job coordinates
 */
const FitBoundsHelper = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      // Small delay to ensure container size is resolved in modal animation
      const timer = setTimeout(() => {
        try {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        } catch (e) {
          console.error('Fit bounds error:', e);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bounds, map]);
  return null;
};

/**
 * Helper to calculate haversine distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of earth in km
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

const JobDetailsModal = ({ job, onClose, onApply }) => {
  const [workerCoords, setWorkerCoords] = useState(null);
  const [distance, setDistance] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Job coordinates
  const jobLat = job.latitude || job.location?.coordinates?.[1] || 19.076;
  const jobLng = job.longitude || job.location?.coordinates?.[0] || 72.8777;

  // Retrieve user current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setWorkerCoords([lat, lng]);
          
          // Calculate distance
          const dist = calculateDistance(lat, lng, jobLat, jobLng);
          setDistance(dist);
          setGpsLoading(false);
          console.log(`GPS Location captured. Distance to job: ${dist.toFixed(2)} km`);
        },
        (error) => {
          console.warn('Geolocation permission denied or timed out:', error);
          setGpsLoading(false);
          // If denied, we do not draw polyline or worker marker, only show job marker
        },
        { timeout: 5000 }
      );
    }
  }, [jobLat, jobLng]);

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

  // Calculate Bounds to fit in Map View
  const mapBounds = [];
  if (workerCoords) mapBounds.push(workerCoords);
  mapBounds.push([jobLat, jobLng]);

  const handleApplyClick = () => {
    onApply?.(job);
    onClose();
  };

  const isUrgent = job.urgency === 'urgent';
  const company = job.company || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-surface-100 flex flex-col max-h-[90vh]"
      >
        
        {/* Header Banner */}
        <div className={`p-5 flex items-center justify-between text-white ${
          isUrgent ? 'gradient-warm' : 'gradient-primary'
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {WORK_TYPE_LABELS[job.workType] || job.workType} Job Details
            </span>
            <h3 className="text-lg font-bold truncate max-w-[400px]">{job.title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Job Details Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-50 p-4 border border-surface-100 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Wages</span>
              <p className="text-base font-extrabold text-primary-650">{formatCurrency(job.pay)}</p>
              <p className="text-[9px] text-surface-450 capitalize">{job.payType?.replace('_', ' ')}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Workers</span>
              <p className="text-base font-extrabold text-surface-850">
                {job.workersHired || 0} / {job.workersNeeded || 1}
              </p>
              <p className="text-[9px] text-surface-450">Hired</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Duration</span>
              <p className="text-base font-extrabold text-surface-850 truncate">{job.duration || '1 day'}</p>
              <p className="text-[9px] text-surface-450">Estimated Time</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] font-bold text-surface-400 uppercase tracking-wider">Schedule</span>
              <p className="text-xs font-bold text-surface-850">
                {job.startDate ? new Date(job.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
              </p>
              <p className="text-[9px] text-surface-450">{job.startTime || '09:00 AM'}</p>
            </div>
          </div>

          {/* Employer Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">About the Job</h4>
            <p className="text-sm text-surface-650 leading-relaxed bg-surface-50/50 p-4 border border-surface-50 rounded-2xl">
              {job.description || 'No description provided by the employer.'}
            </p>
          </div>

          {/* Skills Required */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider">Required Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span key={skill} className={`px-3 py-1 rounded-full text-xs font-semibold ${getSkillColor(skill)}`}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map Display Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-500" />
                Job Site Location
              </h4>
              {distance !== null && (
                <span className="text-xs text-primary-650 font-extrabold bg-primary-50 border border-primary-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" />
                  {distance.toFixed(1)} km away
                </span>
              )}
            </div>
            
            <p className="text-xs text-surface-500 italic">
              📍 {job.location?.address || job.location?.city || 'Location Details TBD'}
            </p>

            {/* Map Container */}
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
                
                {/* Job Marker */}
                <Marker position={[jobLat, jobLng]} icon={jobIcon}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-surface-900">{job.title}</p>
                      <p className="text-[10px] text-surface-500">{job.location?.address || 'Site Location'}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* Worker Marker */}
                {workerCoords && (
                  <Marker position={workerCoords} icon={workerIcon}>
                    <Popup>
                      <span className="text-xs font-bold">Your Location</span>
                    </Popup>
                  </Marker>
                )}

                {/* Draw Route Line */}
                {workerCoords && (
                  <Polyline 
                    positions={[workerCoords, [jobLat, jobLng]]} 
                    color="#4F46E5" 
                    weight={3} 
                    dashArray="5, 10" 
                  />
                )}

                {/* Fit View bounds helper */}
                <FitBoundsHelper bounds={mapBounds} />
              </MapContainer>
            </div>
          </div>

          {/* Employer Contact details */}
          <div className="p-4 border border-surface-100 bg-surface-50/50 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center">
                {company.name?.[0] || job.companyName?.[0] || 'E'}
              </div>
              <div>
                <p className="text-xs font-bold text-surface-900">
                  {company.companyProfile?.companyName || company.name || job.companyName || 'Employer'}
                </p>
                <p className="text-[10px] text-surface-450">Trust Score: {company.companyProfile?.trustScore || 100}%</p>
              </div>
            </div>
            {company.phone && (
              <a 
                href={`tel:${company.phone}`}
                className="p-2 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors shadow-sm text-surface-600 flex items-center gap-1.5 text-xs font-bold"
              >
                <Phone className="w-4 h-4 text-success-500" /> Call Employer
              </a>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-surface-100 bg-surface-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white hover:bg-surface-100 text-surface-700 border border-surface-200 font-bold rounded-2xl text-xs active:scale-[0.98] transition-all"
            style={{ minHeight: '48px' }}
          >
            Close Details
          </button>
          <button
            onClick={handleApplyClick}
            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-xs active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-1.5"
            style={{ minHeight: '48px' }}
          >
            APPLY NOW
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>
    </div>
  );
};

export default JobDetailsModal;
