import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Users, 
  Clock, 
  Zap, 
  Plus, 
  Minus, 
  CheckCircle,
  Navigation,
  Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../../context/AuthContext';
import { ALL_SKILLS } from '../../utils/helpers';
import toast, { Toaster } from 'react-hot-toast';

/**
 * Leaflet helper to dynamically re-center map when GPS location changes
 */
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 0 && coords[1] !== 0) {
      map.setView(coords, 14);
    }
  }, [coords, map]);
  return null;
};

/**
 * Leaflet helper to capture map clicks and update coordinates
 */
const MapEventsHelper = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const PostJob = () => {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    workType: 'daily',
    pay: '',
    payType: 'per_day',
    workersNeeded: 1,
    skills: [],
    city: '',
    address: '',
    latitude: 19.076, // Default Mumbai lat
    longitude: 72.8777, // Default Mumbai lng
    startDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    duration: '8 hours',
    urgency: 'normal',
  });

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  const toggleSkill = (skill) => {
    const lower = skill.toLowerCase();
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(lower) 
        ? prev.skills.filter((s) => s !== lower) 
        : [...prev.skills, lower],
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGpsLoading(false);
        toast.success('Location captured successfully!', { icon: '📍' });
      },
      (error) => {
        console.error('GPS access error:', error);
        setGpsLoading(false);
        toast.error('Permission denied or GPS signal weak. Using default location.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.pay) {
      toast.error('Please fill in job title and pay');
      return;
    }
    
    setLoading(true);
    try {
      if (isDemo) {
        setSubmitted(true);
        toast.success('Job posted successfully (Demo Mode)!', { icon: '🎉', duration: 3000 });
      } else {
        const { jobsAPI } = await import('../../api/endpoints');
        const payload = {
          ...form,
          pay: parseFloat(form.pay),
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        };
        await jobsAPI.create(payload);
        setSubmitted(true);
        toast.success('Job posted successfully!', { icon: '🎉', duration: 3000 });
      }
    } catch (err) {
      console.error('Post job error:', err);
      toast.error(err.response?.data?.message || 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 gradient-success rounded-3xl flex items-center justify-center mb-4 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 mb-2">Job Posted! 🎉</h2>
        <p className="text-surface-500 mb-6">Your job "{form.title}" is now live. Workers will start applying soon.</p>
        <button 
          onClick={() => { 
            setSubmitted(false); 
            setForm({ 
              title: '', 
              description: '', 
              workType: 'daily',
              pay: '', 
              payType: 'per_day',
              workersNeeded: 1,
              skills: [],
              city: '',
              address: '',
              latitude: 19.076,
              longitude: 72.8777,
              startDate: new Date().toISOString().split('T')[0],
              startTime: '09:00',
              duration: '8 hours',
              urgency: 'normal'
            }); 
          }} 
          className="btn-primary"
        >
          Post Another Job
        </button>
      </motion.div>
    );
  }

  // DivIcon avoiding Vite asset bundler issues
  const pinIcon = L.divIcon({
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold border-2 border-white shadow-md animate-bounce-gentle">📍</div>`,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-surface-900">Post a New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Job Title */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-4">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary-500" /> Job Details
          </h3>
          <div>
            <label className="text-sm font-medium text-surface-600 mb-1 block">Job Title *</label>
            <input type="text" placeholder="e.g. Construction Workers Needed" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 mb-1 block">Description</label>
            <textarea placeholder="Describe the work, requirements..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" />
          </div>
        </div>

        {/* Work Type */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-3">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-500" /> Work Type
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {['daily', 'contract', 'instant'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, workType: type })}
                className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                  form.workType === type
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                }`}
              >
                {type === 'instant' && '⚡ '}{type}
              </button>
            ))}
          </div>

          {/* Urgency Toggle */}
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm font-medium text-surface-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-warning-500" /> Mark as Urgent
            </span>
            <button
              type="button"
              onClick={() => setForm({ ...form, urgency: form.urgency === 'urgent' ? 'normal' : 'urgent' })}
              className={`w-12 h-7 rounded-full transition-all ${
                form.urgency === 'urgent' ? 'bg-danger-500' : 'bg-surface-200'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                form.urgency === 'urgent' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>

        {/* Pay */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-3">
          <h3 className="font-semibold text-surface-800 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-500" /> Payment
          </h3>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-surface-400">₹</span>
            <input type="number" placeholder="500" value={form.pay} onChange={(e) => setForm({ ...form, pay: e.target.value })} className="input-field pl-10 text-xl font-semibold" />
          </div>
          <div className="flex gap-2">
            {['per_day', 'fixed', 'per_hour'].map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setForm({ ...form, payType: pt })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  form.payType === pt ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-surface-50 text-surface-500'
                }`}
              >
                {pt.replace('_', '/')}
              </button>
            ))}
          </div>
        </div>

        {/* Workers Needed */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card">
          <h3 className="font-semibold text-surface-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-500" /> Workers Needed
          </h3>
          <div className="flex items-center justify-center gap-6">
            <button type="button" onClick={() => setForm({ ...form, workersNeeded: Math.max(1, form.workersNeeded - 1) })} className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600 hover:bg-surface-200 transition-colors">
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-4xl font-bold text-surface-900 w-16 text-center">{form.workersNeeded}</span>
            <button type="button" onClick={() => setForm({ ...form, workersNeeded: form.workersNeeded + 1 })} className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 hover:bg-primary-200 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card">
          <h3 className="font-semibold text-surface-800 mb-3">Required Skills</h3>
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  form.skills.includes(skill.toLowerCase()) ? 'bg-primary-600 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Location Section with Map Selector */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-500" /> Job Location
            </h3>
            
            {/* GPS Capture Button */}
            <button
              type="button"
              disabled={gpsLoading}
              onClick={handleGetLocation}
              className="px-3.5 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 border border-primary-100"
            >
              {gpsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5" />
              )}
              {gpsLoading ? 'Getting GPS...' : 'Get Current Location'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-surface-500 mb-1 block">City</label>
              <input type="text" placeholder="City Name" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-surface-500 mb-1 block">Full Address</label>
              <input type="text" placeholder="e.g. Phase 2 BKC" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
            </div>
          </div>

          {/* Interactive Map Selector */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-semibold text-surface-600 block">
              Adjust Location on Map (Click map to drop marker)
            </label>
            <div className="h-60 w-full rounded-2xl overflow-hidden border border-surface-200 shadow-inner relative z-10">
              <MapContainer 
                center={[form.latitude, form.longitude]} 
                zoom={13} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker 
                  position={[form.latitude, form.longitude]} 
                  icon={pinIcon}
                />
                <ChangeMapView coords={[form.latitude, form.longitude]} />
                <MapEventsHelper 
                  onMapClick={(lat, lng) => setForm(prev => ({ ...prev, latitude: lat, longitude: lng }))} 
                />
              </MapContainer>
            </div>
            <div className="flex justify-between text-[9px] text-surface-400 px-1 pt-1 font-medium">
              <span>Lat: {form.latitude.toFixed(6)}</span>
              <span>Lng: {form.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-surface-600 mb-1 block">Start Date</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="text-sm font-medium text-surface-600 mb-1 block">Start Time</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
          </div>
        </div>

        {/* Submit */}
        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            '🚀 Post Job'
          )}
        </button>
      </form>
    </div>
  );
};

export default PostJob;
