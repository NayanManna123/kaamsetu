import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, Users, Clock, Search, MapPinCheck, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import { eventsAPI } from '../../api/endpoints';
import SkeletonLoader from '../../components/SkeletonLoader';

const EventsList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [coords, setCoords] = useState({ lat: '19.0760', lng: '72.8777' }); // Default center

  useEffect(() => {
    // Get geolocation for nearby events
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
        },
        () => {
          console.log('Using default Mumbai coordinates for geolocation lookup');
        }
      );
    }
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (activeTab === 'nearby') {
        params.lat = coords.lat;
        params.lng = coords.lng;
        params.radius = 100; // 100km radius
      } else if (activeTab === 'trending') {
        params.category = 'trending';
      } else if (activeTab === 'student') {
        params.category = 'student';
      } else if (activeTab === 'daily') {
        params.category = 'daily';
      }

      const response = await eventsAPI.getAll(params);
      setEvents(response.data.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeTab, coords]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  // Helper to compute countdown text
  const getCountdownText = (eventDate) => {
    const diffTime = new Date(eventDate) - new Date();
    if (diffTime < 0) {
      return 'Event Started';
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Starts Tomorrow';
    return `Starts in ${diffDays} days`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 pb-20">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Discover Hiring Events</h1>
          <p className="text-sm text-surface-550">Find nearby placement drives, daily worker recruitment, and virtual fairs</p>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, cities, skills..."
              className="input-field pl-10"
              style={{ minHeight: '44px' }}
            />
          </div>
          <button
            type="submit"
            className="px-5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors text-xs active:scale-95"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar border-b border-surface-200 pb-1 pt-1">
        {[
          { id: 'upcoming', label: 'Upcoming', icon: Calendar },
          { id: 'nearby', label: 'Nearby', icon: MapPinCheck },
          { id: 'trending', label: 'Trending', icon: Sparkles },
          { id: 'student', label: 'Student Hiring', icon: GraduationCap },
          { id: 'daily', label: 'Daily Worker', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                  : 'bg-white border-surface-200 text-surface-650 hover:bg-surface-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonLoader className="h-72 rounded-2xl" />
          <SkeletonLoader className="h-72 rounded-2xl" />
          <SkeletonLoader className="h-72 rounded-2xl" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-surface-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-surface-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-surface-400">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-surface-800 mb-2">No Events Found</h2>
          <p className="text-surface-500 text-sm">
            We couldn't find any hiring events under this category right now. Adjust your filters or check back later!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const dateStr = new Date(event.eventDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const modeColors = {
              online: 'bg-accent-50 text-accent-700 border-accent-100',
              offline: 'bg-primary-50 text-primary-700 border-primary-100',
              hybrid: 'bg-warning-50 text-warning-700 border-warning-100',
            };

            return (
              <div
                key={event._id}
                onClick={() => navigate(`/worker/events/${event._id}`)}
                className="bg-white rounded-2xl border border-surface-200 hover:border-primary-300 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Banner & Countdown */}
                <div className="relative h-36 bg-surface-100">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-surface-900/10 to-transparent" />
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${modeColors[event.eventMode]}`}>
                    {event.eventMode}
                  </span>
                  
                  {/* Countdown pill */}
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/65 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold">
                    <Clock className="w-3.5 h-3.5 text-warning-400" />
                    {getCountdownText(event.eventDate)}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-surface-850 line-clamp-2 leading-snug">{event.title}</h3>
                    <p className="text-xs text-primary-600 font-bold mt-1.5 capitalize">{event.companyName}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-surface-550 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-surface-400" />
                      <span>{dateStr} ({event.startTime} - {event.endTime})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-surface-400" />
                      <span className="line-clamp-1">{event.location?.address}, {event.location?.city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-surface-400" />
                      <span className="font-bold text-surface-700">{event.vacancies} vacancies</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-surface-100 bg-surface-50/50 flex gap-2">
                  <button
                    onClick={() => navigate(`/worker/events/${event._id}`)}
                    className="flex-1 py-2.5 border border-primary-600 text-primary-650 hover:bg-primary-50 rounded-xl transition-colors font-bold text-xs"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => navigate(`/worker/events/${event._id}`)}
                    className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-bold text-xs shadow-sm"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsList;
