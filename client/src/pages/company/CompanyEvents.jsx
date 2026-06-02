import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, Users, MapPin, Plus, ArrowRight, Trash2, Tag, Eye } from 'lucide-react';
import { eventsAPI } from '../../api/endpoints';
import SkeletonLoader from '../../components/SkeletonLoader';

const CompanyEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getCompanyEvents();
      setEvents(response.data.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (eventId, e) => {
    e.stopPropagation(); // Avoid card click navigation
    if (!window.confirm('Are you sure you want to delete this event? This will erase all registrations and attendance records.')) {
      return;
    }

    try {
      await eventsAPI.delete(eventId);
      toast.success('Hiring Event Deleted Successfully');
      setEvents((prev) => prev.filter((ev) => ev._id !== eventId));
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Manage Hiring Events</h1>
          <p className="text-sm text-surface-550">Create, monitor, and check-in candidates for recruitment campaigns</p>
        </div>
        <Link
          to="/company/events/create"
          className="flex items-center gap-2 px-5 py-3 gradient-primary hover:opacity-95 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5" />
          Create Hiring Event
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonLoader className="h-48 rounded-2xl" />
          <SkeletonLoader className="h-48 rounded-2xl" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-surface-200 rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-600">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-surface-800 mb-2">No Hiring Events Yet</h2>
          <p className="text-surface-500 mb-6 text-sm">
            Launch your first hiring drive to attract and connect with local workers, student interns, or contract staff directly.
          </p>
          <Link
            to="/company/events/create"
            className="inline-flex items-center gap-2 px-6 py-3 btn-primary text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Host an Event Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onClick={() => navigate(`/company/events/${event._id}/dashboard`)}
                className="bg-white rounded-2xl border border-surface-200 hover:border-primary-300 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
              >
                {/* Banner & Header */}
                <div className="relative h-28 bg-surface-100">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-900/60 via-surface-900/20 to-transparent" />
                  <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full border shadow-sm ${modeColors[event.eventMode]}`}>
                    {event.eventMode}
                  </span>
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-base font-bold text-white line-clamp-1">{event.title}</h3>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center bg-surface-50 rounded-xl p-3 border border-surface-100">
                    <div>
                      <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Vacancies</p>
                      <p className="text-base font-extrabold text-surface-800">{event.positionsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Registrations</p>
                      <p className="text-base font-extrabold text-primary-600">{event.registrationsCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Checked-In</p>
                      <p className="text-base font-extrabold text-success-600">{event.attendanceCount}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-medium text-surface-650">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-surface-400" />
                      <span>{dateStr} ({event.startTime} - {event.endTime})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-surface-400" />
                      <span className="line-clamp-1">{event.location?.address}, {event.location?.city}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-5 py-4 border-t border-surface-100 bg-surface-50/50 flex items-center justify-between">
                  <button
                    onClick={(e) => handleDelete(event._id, e)}
                    className="p-2 rounded-lg text-danger-550 hover:bg-danger-50 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
                      View Dashboard
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyEvents;
