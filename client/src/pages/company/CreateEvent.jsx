import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Calendar, MapPin, Clock, Users, Tag, DollarSign, Image, Video, Plus, Trash } from 'lucide-react';
import { eventsAPI } from '../../api/endpoints';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hiringType: [],
    locationAddress: '',
    locationCity: '',
    latitude: '19.0760', // Default Mumbai coordinates
    longitude: '72.8777',
    eventDate: '',
    startTime: '09:00',
    endTime: '17:00',
    positionsCount: '',
    salaryRange: '',
    registrationDeadline: '',
    eventMode: 'offline',
    virtualLink: '',
    bannerImage: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState([]);

  const hiringOptions = [
    'Daily Workers',
    'Contract Workers',
    'Internship',
    'Part-Time',
    'Full-Time',
    'Multiple Categories',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleHiringTypeChange = (option) => {
    setFormData((prev) => {
      const current = prev.hiringType;
      if (current.includes(option)) {
        return { ...prev, hiringType: current.filter((item) => item !== option) };
      } else {
        return { ...prev, hiringType: [...current, option] };
      }
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim().toLowerCase())) {
      setSkills((prev) => [...prev, skillInput.trim().toLowerCase()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.title) return toast.error('Event title is required');
    if (!formData.description) return toast.error('Event description is required');
    if (formData.hiringType.length === 0) return toast.error('Please select at least one Hiring Category');
    if (formData.eventMode !== 'online' && !formData.locationAddress) return toast.error('Venue address is required');
    if (!formData.eventDate) return toast.error('Event date is required');
    if (!formData.registrationDeadline) return toast.error('Registration deadline is required');
    if (new Date(formData.registrationDeadline) > new Date(formData.eventDate)) {
      return toast.error('Registration deadline must be before the event date');
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        hiringType: formData.hiringType,
        location: {
          address: formData.locationAddress || 'Virtual Event Room',
          city: formData.locationCity || 'Online',
          latitude: parseFloat(formData.latitude) || 0,
          longitude: parseFloat(formData.longitude) || 0,
        },
        eventDate: formData.eventDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        positionsCount: parseInt(formData.positionsCount) || 10,
        requiredSkills: skills,
        salaryRange: formData.salaryRange || 'Disclosed during interview',
        registrationDeadline: formData.registrationDeadline,
        eventMode: formData.eventMode,
        bannerImage: formData.bannerImage,
        virtualLink: formData.virtualLink,
        // Slots will auto-generate on backend
      };

      await eventsAPI.create(payload);
      toast.success('Hiring Event Created Successfully!');
      navigate('/company/events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Create Hiring Event</h1>
          <p className="text-sm text-surface-550">Organize recruitment fairs and drives for workers, students, and job seekers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Event Details */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Event Information</h2>
          
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. ABC Construction Recruitment Drive 2026"
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Event Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Provide event details, itinerary, registration instructions, and details about roles..."
              className="input-field py-2.5 h-auto resize-y"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Hiring Categories * (Select all that apply)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {hiringOptions.map((option) => {
                const selected = formData.hiringType.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleHiringTypeChange(option)}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl border text-center transition-all ${
                      selected
                        ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm'
                        : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Date, Time, Registration deadline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Schedule & Positions</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">Event Date *</label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">Reg. Deadline *</label>
                <input
                  type="date"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">Positions Count *</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="number"
                    name="positionsCount"
                    value={formData.positionsCount}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className="input-field pl-10"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-surface-700 mb-1">Salary Range *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    name="salaryRange"
                    value={formData.salaryRange}
                    onChange={handleInputChange}
                    placeholder="e.g. ₹500-800/day"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-card space-y-4">
            <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Required Skills</h2>
            
            <div>
              <label className="block text-sm font-semibold text-surface-700 mb-1">Add Required Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. electrician, driver"
                  className="input-field"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors font-semibold flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="chip pl-3 pr-2 py-1.5 flex items-center gap-1.5 capitalize text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center hover:bg-primary-200"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-xs text-surface-400 italic">No specific skills added yet. Everyone can register.</p>
              )}
            </div>
          </div>
        </div>

        {/* Venue, Location, Event mode */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Venue & Location</h2>
          
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">Event Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['offline', 'online', 'hybrid'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, eventMode: mode }))}
                  className={`py-2 px-4 rounded-xl border text-sm font-semibold text-center capitalize transition-all ${
                    formData.eventMode === mode
                      ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm'
                      : 'border-surface-200 text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {formData.eventMode !== 'online' && (
            <div className="space-y-4 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Venue Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      name="locationAddress"
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      placeholder="e.g. 5th Floor, Trade Center, BKC"
                      className="input-field pl-10"
                      required={formData.eventMode !== 'online'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">City *</label>
                  <input
                    type="text"
                    name="locationCity"
                    value={formData.locationCity}
                    onChange={handleInputChange}
                    placeholder="e.g. Mumbai"
                    className="input-field"
                    required={formData.eventMode !== 'online'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    placeholder="19.0760"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-surface-700 mb-1">Longitude</label>
                  <input
                    type="text"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    placeholder="72.8777"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.eventMode !== 'offline' && (
            <div className="space-y-2 animate-slide-down">
              <label className="block text-sm font-semibold text-surface-700 mb-1">Virtual Room Link / Video Meet URL *</label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="url"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleInputChange}
                  placeholder="e.g. https://meet.google.com/xyz-abcd-123"
                  className="input-field pl-10"
                  required={formData.eventMode !== 'offline'}
                />
              </div>
              <p className="text-xs text-surface-450">This link will only be visible to registered candidates once they sign up.</p>
            </div>
          )}
        </div>

        {/* Banner customization */}
        <div className="bg-white p-6 rounded-2xl border border-surface-200 shadow-card space-y-4">
          <h2 className="text-lg font-bold text-surface-800 border-b border-surface-100 pb-2">Banner Customization</h2>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1">Banner Image URL (Optional)</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={handleInputChange}
                placeholder="e.g. https://example.com/banner.jpg"
                className="input-field pl-10"
              />
            </div>
            <p className="text-xs text-surface-450 mt-1">Provide a custom banner URL, or leave blank to use a sleek tech-hiring default header.</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/company/events')}
            className="flex-1 border border-surface-300 text-surface-750 font-bold py-3.5 px-6 rounded-xl hover:bg-surface-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary"
          >
            {loading ? 'Creating event...' : 'Publish Hiring Event'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
