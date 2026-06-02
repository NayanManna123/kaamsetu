import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Calendar, MapPin, Users, Clock, MessageSquare, Send, Tag, Share2,
  Bookmark, CheckCircle, Video, Award, Download, ArrowLeft, X, Sparkles, Printer
} from 'lucide-react';
import { eventsAPI } from '../../api/endpoints';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/SkeletonLoader';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    skills: user?.workerProfile?.skills?.join(', ') || '',
    resume: '',
    slotTime: '',
  });
  const [regLoading, setRegLoading] = useState(false);

  // Live Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatBottomRef = useRef(null);

  // Certificate State
  const [certificateData, setCertificateData] = useState(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const certificateRef = useRef(null);

  const fetchDetails = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEventData(response.data.data);
      if (response.data.data.registration) {
        setIsRegistered(true);
        setUserRegistration(response.data.data.registration);
        
        // Pre-select registration slot if registered
        setRegForm((prev) => ({
          ...prev,
          slotTime: response.data.data.registration.interviewSlot,
        }));
      }
      
      // Load Chat Messages
      const chatRes = await eventsAPI.getChat(id);
      setChatMessages(chatRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    if (socket) {
      socket.emit('joinEventChat', id);

      socket.on('newEventChatMessage', (data) => {
        if (data.eventId === id) {
          setChatMessages((prev) => [...prev, data.message]);
        }
      });
    }

    return () => {
      if (socket) {
        socket.emit('leaveEventChat', id);
        socket.off('newEventChatMessage');
      }
    };
  }, [id, socket]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleInputChange = (e) => {
    setRegForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone || !regForm.email) {
      return toast.error('Please enter all required fields');
    }
    if (!regForm.slotTime) {
      return toast.error('Please select an interview time slot');
    }

    setRegLoading(true);
    try {
      const payload = {
        eventId: id,
        name: regForm.name,
        phone: regForm.phone,
        email: regForm.email,
        skills: regForm.skills.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
        resume: regForm.resume,
        slotTime: regForm.slotTime,
      };

      const res = await eventsAPI.register(payload);
      toast.success('Registration Confirmed!');
      setShowRegModal(false);
      fetchDetails(); // Reload page context
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegLoading(false);
    }
  };

  const handleBookSlot = async (slotTime) => {
    try {
      await eventsAPI.bookSlot(id, { slotTime });
      toast.success(`Slot successfully changed to ${slotTime}`);
      fetchDetails();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Slot change failed');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await eventsAPI.sendChatMessage(id, { message: messageInput });
      setMessageInput('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFetchCertificate = async () => {
    try {
      const res = await eventsAPI.getCertificate(id);
      setCertificateData(res.data.data);
      setShowCertModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load certificate');
    }
  };

  const printCertificate = () => {
    const printContent = certificateRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Open a simple window to print certificate specifically
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>KaamSetu Certificate Verification</title>
          <style>
            body { font-family: 'Inter', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fafafa; }
            .certificate-container { border: 15px double #1E3A8A; padding: 40px; width: 700px; text-align: center; background-color: white; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); position: relative; }
            .badge-gold { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; box-shadow: 0 0 20px rgba(245,158,11,0.3); }
            h1 { color: #1E3A8A; font-size: 28px; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
            h2 { color: #4B5563; font-size: 16px; font-weight: 500; margin-top: 0; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 30px; }
            .recipient { font-size: 24px; font-weight: 800; color: #111827; text-decoration: underline; margin: 20px 0; font-family: 'Inter', serif; }
            .text-main { color: #4B5563; font-size: 14px; line-height: 1.6; max-width: 500px; margin: 0 auto 30px; }
            .event-name { font-weight: bold; color: #1E3A8A; }
            .meta-grid { display: flex; justify-content: space-between; border-top: 1px solid #E5E7EB; pt: 20px; margin-top: 40px; padding-top: 20px; font-size: 12px; color: #6B7280; }
            .verify-code { font-family: monospace; font-weight: bold; color: #9CA3AF; }
          </style>
        </head>
        <body onload="window.print();window.close()">
          <div class="certificate-container">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <SkeletonLoader className="h-48 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <SkeletonLoader className="h-40 rounded-2xl" />
            <SkeletonLoader className="h-40 rounded-2xl" />
          </div>
          <SkeletonLoader className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const dateStr = new Date(eventData.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 pb-20">
      
      {/* Back button */}
      <Link
        to="/worker/events"
        className="inline-flex items-center gap-2 text-xs font-bold text-surface-550 hover:text-surface-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Discover Events
      </Link>

      {/* Hero Header */}
      <div className="relative h-60 md:h-72 rounded-3xl overflow-hidden shadow-md">
        <img
          src={eventData.bannerImage}
          alt={eventData.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/80 via-surface-900/35 to-transparent" />
        
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4 text-white">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-primary-600 border border-primary-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {eventData.eventMode} hiring drive
            </span>
            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight leading-tight max-w-2xl">{eventData.title}</h1>
            <p className="text-xs md:text-sm font-bold text-primary-200">{eventData.companyName}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10 transition-all"
              title="Share Event"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>
            <button
              className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10 transition-all"
              title="Bookmark Event"
            >
              <Bookmark className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Details, description, skills */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white border border-surface-200 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary-550" />
              <div>
                <p className="text-[9px] font-bold text-surface-400 uppercase">Date</p>
                <p className="text-xs font-bold text-surface-800 line-clamp-1">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-550" />
              <div>
                <p className="text-[9px] font-bold text-surface-400 uppercase">Schedule</p>
                <p className="text-xs font-bold text-surface-800">{eventData.startTime} - {eventData.endTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-550" />
              <div>
                <p className="text-[9px] font-bold text-surface-400 uppercase">Vacancies</p>
                <p className="text-xs font-bold text-surface-800">{eventData.positionsCount} Openings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-primary-550" />
              <div>
                <p className="text-[9px] font-bold text-surface-400 uppercase">Hiring Mode</p>
                <p className="text-xs font-bold text-surface-800 capitalize">{eventData.eventMode}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-base font-bold text-surface-800 border-b border-surface-100 pb-2">Event Description</h3>
            <p className="text-xs text-surface-650 leading-relaxed whitespace-pre-wrap">{eventData.description}</p>
          </div>

          {/* Salary & Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-base font-bold text-surface-800 border-b border-surface-100 pb-2">Salary Information</h3>
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-150 flex items-center justify-center text-green-600">
                  <span className="font-extrabold text-lg">₹</span>
                </div>
                <div>
                  <p className="text-sm font-extrabold text-surface-800">{eventData.salaryRange}</p>
                  <p className="text-[10px] text-surface-450 font-medium">Provided by organizer</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-3">
              <h3 className="text-base font-bold text-surface-800 border-b border-surface-100 pb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {eventData.requiredSkills.map((s) => (
                  <span key={s} className="chip capitalize text-xs font-semibold px-3 py-1">
                    {s}
                  </span>
                ))}
                {eventData.requiredSkills.length === 0 && (
                  <span className="text-xs text-surface-450 italic">No specific skills required. Open to everyone.</span>
                )}
              </div>
            </div>
          </div>

          {/* Live Q&A Wall Chat */}
          <div className="bg-white border border-surface-200 rounded-2xl shadow-sm h-[400px] flex flex-col justify-between overflow-hidden">
            <div className="px-5 py-3.5 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-surface-800">Event Live Q&A Room</h4>
                <p className="text-[10px] text-surface-450">Ask organizers questions about timing, salary, or eligibility.</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            </div>

            {/* Chat list */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-surface-50/15">
              {chatMessages.map((msg) => {
                const isMe = msg.sender && msg.sender._id === user?._id;
                return (
                  <div
                    key={msg._id || msg.timestamp}
                    className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <span className="text-[9px] text-surface-450 font-bold mb-0.5 px-1">{msg.senderName}</span>
                    <div className={`p-2.5 rounded-2xl text-xs font-medium ${
                      isMe
                        ? 'bg-primary-600 text-white rounded-tr-none'
                        : 'bg-white text-surface-800 rounded-tl-none border border-surface-150'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-surface-400 italic">
                  <MessageSquare className="w-8 h-8 text-surface-200 mb-1" />
                  <p className="text-xs">No questions posted. Be the first to ask!</p>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-surface-100 bg-white flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Ask organizing team a question..."
                className="flex-1 px-4 py-2.5 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>

        {/* Right Column: Registration Card / Slots Booking */}
        <div className="space-y-6">
          
          {/* Registration Status Panel */}
          {isRegistered ? (
            <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm text-center space-y-5">
              <div className="flex justify-between items-center border-b border-surface-100 pb-3">
                <span className="text-xs font-bold text-surface-500">Hiring Card</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-success-600 bg-success-50 border border-success-100 px-3 py-1 rounded-full uppercase">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {userRegistration.status.replace('_', ' ')}
                </span>
              </div>

              {/* QR Image render via qrserver */}
              <div className="bg-surface-50 p-4 border border-surface-150 rounded-2xl max-w-[200px] mx-auto shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${userRegistration.registrationId}`}
                  alt="Registration QR Code"
                  className="w-full h-auto"
                />
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-surface-400 uppercase">Registration ID</p>
                <p className="text-lg font-black text-surface-850 font-mono tracking-wider">{userRegistration.registrationId}</p>
              </div>

              {/* Slot indicator */}
              <div className="bg-surface-50 rounded-xl p-3 border border-surface-150 text-left text-xs font-medium text-surface-650 space-y-1">
                <p className="text-[9px] font-bold text-surface-400 uppercase">Interview Time Slot</p>
                <p className="font-bold text-surface-800">{userRegistration.interviewSlot}</p>
              </div>

              {/* Virtual Join link */}
              {eventData.eventMode !== 'offline' && eventData.virtualLink && (
                <a
                  href={eventData.virtualLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-accent-600 hover:bg-accent-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-xs"
                >
                  <Video className="w-4 h-4" />
                  Join Virtual Fair Room
                </a>
              )}

              {/* Certificate Download indicator */}
              {['checked_in', 'interviewed', 'selected'].includes(userRegistration.status) && (
                <button
                  onClick={handleFetchCertificate}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-surface-50 border border-primary-600 text-primary-700 font-bold rounded-xl transition-all shadow-sm text-xs active:scale-95"
                >
                  <Award className="w-4.5 h-4.5 text-primary-650" />
                  Download Participation Certificate
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm text-center space-y-4">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-surface-800">Registration Status: Not Registered</h3>
              <p className="text-xs text-surface-500 leading-relaxed">
                Sign up for this hiring event to book an interview slot, receive real-time schedule alerts, and obtain a participation certificate.
              </p>
              
              <button
                onClick={() => setShowRegModal(true)}
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 text-xs"
              >
                Register For Event
              </button>
            </div>
          )}

          {/* Location Map Mock Visual */}
          <div className="bg-white p-5 border border-surface-200 rounded-2xl shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-surface-800">Venue Map Location</h4>
            <div className="h-40 bg-surface-150 border border-surface-200 rounded-xl relative overflow-hidden flex items-center justify-center text-center">
              {/* Map mockup visual */}
              <div className="absolute inset-0 bg-sky-100 opacity-60 flex items-center justify-center">
                {/* Simulated streets lines visual */}
                <div className="absolute w-[2px] h-full bg-white left-1/3" />
                <div className="absolute w-[2px] h-full bg-white left-2/3" />
                <div className="absolute h-[2px] w-full bg-white top-1/2" />
              </div>
              <div className="relative z-10 flex flex-col items-center gap-1.5 p-3">
                <MapPin className="w-8 h-8 text-danger-550 animate-float" />
                <p className="text-[10px] font-bold text-surface-800">{eventData.location?.city}</p>
                <p className="text-[8px] text-surface-500 font-mono">[{eventData.location?.coordinates[1]}, {eventData.location?.coordinates[0]}]</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* REGISTRATION FORM MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-surface-200 w-full max-w-xl overflow-hidden shadow-card-hover animate-slide-up">
            
            <div className="px-6 py-4 border-b border-surface-150 bg-surface-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-surface-800">Sign Up for Hiring Drive</h3>
              <button
                onClick={() => setShowRegModal(false)}
                className="p-1 rounded-full text-surface-400 hover:bg-surface-150 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={regForm.name}
                    onChange={handleInputChange}
                    className="input-field py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    value={regForm.phone}
                    onChange={handleInputChange}
                    className="input-field py-2 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={regForm.email}
                  onChange={handleInputChange}
                  className="input-field py-2 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Your Skills (Comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={regForm.skills}
                  onChange={handleInputChange}
                  placeholder="e.g. painter, helper, clean-up"
                  className="input-field py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Resume Link URL (Optional)</label>
                <input
                  type="url"
                  name="resume"
                  value={regForm.resume}
                  onChange={handleInputChange}
                  placeholder="e.g. https://drive.google.com/myfile"
                  className="input-field py-2 text-xs"
                />
              </div>

              {/* Slot Picker */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-surface-700 uppercase mb-1">Select Interview Time Slot *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[140px] overflow-y-auto border border-surface-150 p-2 rounded-xl">
                  {eventData.slots.map((s) => {
                    const isFull = s.bookedCount >= s.maxCapacity;
                    const isSelected = regForm.slotTime === s.time;
                    return (
                      <button
                        key={s.time}
                        type="button"
                        disabled={isFull && !isSelected}
                        onClick={() => setRegForm((prev) => ({ ...prev, slotTime: s.time }))}
                        className={`py-2 px-1 text-[10px] font-bold border rounded-lg transition-all ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                            : isFull
                            ? 'bg-surface-50 border-surface-100 text-surface-300 cursor-not-allowed'
                            : 'border-surface-200 text-surface-700 hover:bg-surface-50'
                        }`}
                      >
                        {s.time}
                        <span className="block text-[8px] font-normal mt-0.5 opacity-80">
                          {isFull ? 'FULL' : `${s.bookedCount}/${s.maxCapacity} booked`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className="w-full btn-primary text-xs py-3.5 font-bold"
              >
                {regLoading ? 'Registering...' : 'Confirm Registration & Book Slot'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {showCertModal && certificateData && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-surface-200 max-w-2xl w-full p-6 space-y-6 shadow-2xl relative animate-slide-up">
            
            <button
              onClick={() => setShowCertModal(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-surface-450 hover:bg-surface-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Certificate Frame */}
            <div ref={certificateRef} className="border-8 double border-primary-900 p-8 text-center bg-white border-double">
              <div className="w-16 h-16 bg-gradient-to-br from-warning-400 to-warning-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-primary-900 uppercase tracking-widest">Certificate of Participation</h2>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-1">This digital certificate verifies that</p>
              
              <p className="recipient font-extrabold text-2xl text-surface-900 my-4 underline decoration-primary-600 decoration-2 underline-offset-4 capitalize">
                {certificateData.candidateName}
              </p>
              
              <p className="text-xs text-surface-650 max-w-md mx-auto leading-relaxed">
                has successfully registered, checked-in, and participated in the <span className="font-bold text-primary-800">{certificateData.eventTitle}</span> hiring and placement fair hosted by <span className="font-bold text-primary-800">{certificateData.companyName}</span>.
              </p>

              <div className="flex justify-between items-center border-t border-surface-100 pt-6 mt-8 text-[9px] font-bold text-surface-450 uppercase">
                <div>
                  <p>Hiring Event Date</p>
                  <p className="text-surface-700 font-extrabold mt-0.5">{certificateData.date}</p>
                </div>
                <div>
                  <p>Verification Code</p>
                  <p className="font-mono text-surface-700 font-extrabold mt-0.5">{certificateData.certificateCode}</p>
                </div>
                <div>
                  <p>Issue Date</p>
                  <p className="text-surface-700 font-extrabold mt-0.5">{certificateData.issueDate}</p>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowCertModal(false)}
                className="flex-1 py-3 border border-surface-300 rounded-xl hover:bg-surface-50 transition-colors font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={printCertificate}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default EventDetails;
