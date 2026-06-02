import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Calendar, MapPin, Users, CheckCircle, Search, Filter, MessageSquare,
  BarChart3, RefreshCw, QrCode, Send, ShieldAlert, Award, ArrowLeft, Download
} from 'lucide-react';
import { eventsAPI } from '../../api/endpoints';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/SkeletonLoader';

const EventDashboard = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('candidates');

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  
  // Selection & Filters
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // QR Check-in State
  const [checkinId, setCheckinId] = useState('');
  const [scanning, setScanning] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  // Live Chat State
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatBottomRef = useRef(null);

  const fetchData = async () => {
    try {
      // Fetch details + candidates list
      const detailsRes = await eventsAPI.getById(id);
      setEventData(detailsRes.data.data);
      setCandidates(detailsRes.data.data.candidates || []);

      // Fetch analytics
      const analyticsRes = await eventsAPI.getAnalytics(id);
      setAnalytics(analyticsRes.data.data);

      // Fetch chat messages
      const chatRes = await eventsAPI.getChat(id);
      setChatMessages(chatRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to Socket Event Room for Real-Time Q&A Chat
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
    if (activeTab === 'chat' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleCheckboxChange = (candId) => {
    setSelectedCandidates((prev) =>
      prev.includes(candId) ? prev.filter((item) => item !== candId) : [...prev, candId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(filteredCandidates.map((c) => c._id));
    }
  };

  // Bulk Status Updates
  const handleBulkStatusChange = async (newStatus) => {
    if (selectedCandidates.length === 0) return toast.error('No candidates selected');
    
    const loadingToast = toast.loading(`Updating ${selectedCandidates.length} candidate status...`);
    try {
      await eventsAPI.bulkUpdateCandidateStatus(id, {
        registrationIds: selectedCandidates,
        status: newStatus,
      });
      toast.success('Candidates status updated successfully!', { id: loadingToast });
      setSelectedCandidates([]);
      fetchData(); // reload
    } catch (error) {
      toast.error('Failed to update status', { id: loadingToast });
    }
  };

  // Individual Status Update
  const handleStatusChange = async (candRegId, newStatus) => {
    try {
      await eventsAPI.updateCandidateStatus(id, candRegId, { status: newStatus });
      toast.success(`Candidate status updated to ${newStatus}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // QR / Manual ID Check-in
  const handleCheckin = async (e) => {
    if (e) e.preventDefault();
    if (!checkinId.trim()) return toast.error('Please enter a Registration ID');

    setCheckinLoading(true);
    try {
      await eventsAPI.checkin({ registrationId: checkinId.trim(), eventId: id });
      toast.success(`Checked In Successfully! ID: ${checkinId}`);
      setCheckinId('');
      setScanning(false);
      fetchData(); // reload lists and counts
    } catch (error) {
      toast.error(error.response?.data?.message || 'Check-in failed. Try again.');
    } finally {
      setCheckinLoading(false);
    }
  };

  // Simulated Scanner Scan
  const simulateScan = (simId) => {
    setScanning(true);
    toast.loading('Simulating camera QR decode...', { duration: 1500 });
    setTimeout(() => {
      setCheckinId(simId);
      setScanning(false);
      toast.dismiss();
      toast.success('QR Code Decoded!');
    }, 1500);
  };

  // Send Chat Message
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

  // Candidate Filters
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <SkeletonLoader className="h-20 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
          <SkeletonLoader className="h-24 rounded-2xl" />
        </div>
        <SkeletonLoader className="h-96 rounded-2xl" />
      </div>
    );
  }

  const dateStr = new Date(eventData.eventDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-surface-200 p-5 rounded-2xl shadow-sm">
        <div className="flex gap-4 items-center">
          <Link
            to="/company/events"
            className="p-2.5 rounded-xl border border-surface-200 text-surface-600 hover:bg-surface-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-surface-900 line-clamp-1">{eventData.title}</h1>
            <p className="text-xs text-surface-500 font-medium flex items-center gap-2.5 mt-0.5">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-surface-400" />{dateStr}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-surface-400" />{eventData.location?.address}, {eventData.location?.city}</span>
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-4 py-2 border border-surface-200 text-xs font-semibold rounded-xl text-surface-700 hover:bg-surface-50 active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Analytics Mini Dashboard */}
      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-surface-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Total Registrations</p>
              <p className="text-2xl font-black text-surface-900 mt-1">{analytics.totalRegistrations}</p>
            </div>
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-surface-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Attendance Rate</p>
              <p className="text-2xl font-black text-success-600 mt-1">{analytics.attendanceRate}%</p>
              <span className="text-[9px] font-semibold text-surface-450">{analytics.attendanceCount} present</span>
            </div>
            <div className="w-10 h-10 bg-success-50 rounded-xl flex items-center justify-center text-success-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-surface-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Interview Rate</p>
              <p className="text-2xl font-black text-warning-600 mt-1">
                {analytics.totalRegistrations > 0 ? Math.round((analytics.interviewedCount / analytics.totalRegistrations) * 100) : 0}%
              </p>
              <span className="text-[9px] font-semibold text-surface-450">{analytics.interviewedCount} interviewed</span>
            </div>
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center text-warning-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white border border-surface-200 p-4 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Hiring Rate</p>
              <p className="text-2xl font-black text-accent-700 mt-1">{analytics.hiringRate}%</p>
              <span className="text-[9px] font-semibold text-surface-450">{analytics.selectedCount} selected</span>
            </div>
            <div className="w-10 h-10 bg-accent-50 rounded-xl flex items-center justify-center text-accent-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b border-surface-200 gap-6">
        {[
          { id: 'candidates', label: 'Candidates List', icon: Users },
          { id: 'checkin', label: 'Check-In Scanner', icon: QrCode },
          { id: 'chat', label: 'Live Q&A Chat', icon: MessageSquare },
          { id: 'analytics', label: 'Analytics Hub', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-1 border-b-2 font-bold text-sm transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="animate-fade-in">
        
        {/* Candidates Panel */}
        {activeTab === 'candidates' && (
          <div className="bg-white border border-surface-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Filters */}
            <div className="p-4 bg-surface-50/50 border-b border-surface-100 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex-1 flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidate name, ID, email..."
                    className="w-full pl-9 pr-4 py-2 border border-surface-200 rounded-xl bg-white text-xs placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-surface-200 rounded-xl bg-white text-xs font-semibold text-surface-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="registered">Registered</option>
                  <option value="checked_in">Checked In</option>
                  <option value="interviewed">Interviewed</option>
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Bulk operations bar */}
              {selectedCandidates.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 py-1 px-3 bg-primary-50 rounded-xl border border-primary-100 animate-slide-up">
                  <span className="text-xs font-bold text-primary-700">{selectedCandidates.length} selected</span>
                  <div className="h-4 w-[1px] bg-primary-200 mx-1" />
                  <button
                    onClick={() => handleBulkStatusChange('interviewed')}
                    className="px-2.5 py-1.5 bg-white text-[11px] font-bold text-warning-700 rounded-lg shadow-sm border border-warning-100 hover:bg-warning-50"
                  >
                    Mark Interviewed
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('selected')}
                    className="px-2.5 py-1.5 bg-success-500 text-[11px] font-bold text-white rounded-lg shadow-sm hover:bg-success-600"
                  >
                    Mark Selected
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('rejected')}
                    className="px-2.5 py-1.5 bg-white text-[11px] font-bold text-danger-600 rounded-lg shadow-sm border border-danger-100 hover:bg-danger-50"
                  >
                    Mark Rejected
                  </button>
                </div>
              )}
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50 text-[10px] font-bold text-surface-500 uppercase tracking-wider border-b border-surface-150">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredCandidates.length > 0 && selectedCandidates.length === filteredCandidates.length}
                        onChange={handleSelectAll}
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Candidate Details</th>
                    <th className="py-3 px-4 text-center">AI Ranking</th>
                    <th className="py-3 px-4">Skills Matching</th>
                    <th className="py-3 px-4">Interview Slot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 text-xs">
                  {filteredCandidates.map((cand) => {
                    const skillMatches = eventData.requiredSkills.filter(s => cand.skills.includes(s));
                    const isChecked = selectedCandidates.includes(cand._id);
                    
                    // AI Rank colors
                    let rankBg = 'bg-surface-50 text-surface-700';
                    if (cand.rankingScore >= 80) rankBg = 'bg-success-50 text-success-700 border-success-100';
                    else if (cand.rankingScore >= 50) rankBg = 'bg-warning-50 text-warning-700 border-warning-100';
                    else rankBg = 'bg-danger-50 text-danger-700 border-danger-100';

                    const statusBadges = {
                      registered: 'bg-primary-50 text-primary-700 border-primary-100',
                      checked_in: 'bg-success-50 text-success-700 border-success-100',
                      interviewed: 'bg-warning-50 text-warning-700 border-warning-100',
                      selected: 'bg-accent-50 text-accent-700 border-accent-100',
                      rejected: 'bg-danger-50 text-danger-700 border-danger-100',
                    };

                    return (
                      <tr key={cand._id} className={`hover:bg-surface-50/50 transition-colors ${isChecked ? 'bg-primary-50/10' : ''}`}>
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(cand._id)}
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 space-y-0.5">
                          <p className="font-bold text-surface-800 flex items-center gap-1.5">
                            {cand.name}
                            <span className="text-[9px] font-mono bg-surface-100 text-surface-500 px-1 rounded">
                              {cand.registrationId}
                            </span>
                          </p>
                          <p className="text-surface-450 font-medium">{cand.phone} • {cand.email}</p>
                          {cand.resume && (
                            <a
                              href={cand.resume}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-primary-600 hover:underline font-bold mt-1"
                            >
                              <Download className="w-3 h-3" />
                              View Resume Attachment
                            </a>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block font-extrabold px-2.5 py-1 rounded-full border text-[11px] shadow-sm ${rankBg}`}>
                            {cand.rankingScore} / 100
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {cand.skills.map((s) => {
                              const match = eventData.requiredSkills.includes(s);
                              return (
                                <span
                                  key={s}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                                    match ? 'bg-primary-100 text-primary-800' : 'bg-surface-150 text-surface-600'
                                  }`}
                                >
                                  {s}
                                </span>
                              );
                            })}
                            {cand.skills.length === 0 && <span className="text-[10px] text-surface-400 italic">None listed</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-surface-700">
                          {cand.interviewSlot || <span className="text-surface-400 italic font-normal">Not chosen</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadges[cand.status]}`}>
                            {cand.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <select
                            value={cand.status}
                            onChange={(e) => handleStatusChange(cand._id, e.target.value)}
                            className="bg-white border border-surface-200 rounded-lg px-2 py-1 text-xs font-semibold text-surface-700 cursor-pointer"
                          >
                            <option value="registered">Registered</option>
                            <option value="checked_in">Checked In</option>
                            <option value="interviewed">Interviewed</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-surface-400 italic">
                        No candidates found matching the filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Checkin Scanner Panel */}
        {activeTab === 'checkin' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-surface-800">QR Code Attendance Check-In</h3>
                <p className="text-xs text-surface-500">Scan candidate's registration card QR or enter their unique ID to mark them checked in.</p>
              </div>

              <form onSubmit={handleCheckin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-surface-700 mb-1">Registration ID / Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={checkinId}
                      onChange={(e) => setCheckinId(e.target.value.toUpperCase())}
                      placeholder="e.g. KS-EVT-123456"
                      className="input-field uppercase"
                      disabled={checkinLoading}
                    />
                    <button
                      type="submit"
                      disabled={checkinLoading}
                      className="px-6 bg-success-500 hover:bg-success-600 text-white font-bold rounded-xl transition-colors active:scale-95 flex items-center justify-center text-xs"
                    >
                      {checkinLoading ? 'Checking...' : 'Check-In'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Simulation Quick Check-in shortcuts */}
              <div className="pt-4 border-t border-surface-150">
                <p className="text-xs font-bold text-surface-600 mb-2">Simulate Quick Check-in (Registrants list):</p>
                <div className="space-y-2">
                  {candidates
                    .filter((c) => c.status === 'registered')
                    .slice(0, 4)
                    .map((c) => (
                      <div
                        key={c._id}
                        onClick={() => simulateScan(c.registrationId)}
                        className="flex justify-between items-center bg-surface-50 border border-surface-100 px-3.5 py-2.5 rounded-xl text-xs hover:border-success-400 cursor-pointer hover:bg-success-50/20 transition-all font-medium"
                      >
                        <span className="font-bold text-surface-750">{c.name}</span>
                        <span className="font-mono text-primary-600 font-bold bg-white px-2 py-0.5 rounded border border-surface-100">{c.registrationId}</span>
                      </div>
                    ))}
                  {candidates.filter((c) => c.status === 'registered').length === 0 && (
                    <p className="text-xs text-surface-400 italic">No pending checked-in candidates remaining.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Video mock scanner visual feedback */}
            <div className="bg-surface-900 border border-surface-850 p-8 rounded-3xl text-center space-y-4 shadow-inner min-h-[350px] flex flex-col items-center justify-center relative overflow-hidden">
              {scanning ? (
                <>
                  <div className="absolute inset-0 bg-green-500/5 animate-pulse" />
                  <div className="w-48 h-48 border-4 border-dashed border-success-400 rounded-2xl flex items-center justify-center animate-pulse relative">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-success-400 animate-bounce" />
                    <QrCode className="w-24 h-24 text-success-300" />
                  </div>
                  <p className="text-xs text-success-300 font-bold tracking-widest uppercase animate-pulse">Scanning Decoded QR Stream...</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-surface-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Interactive Camera Reader Simulation</h4>
                  <p className="text-xs text-surface-400 max-w-xs mx-auto">
                    Click any simulate shortcut on the left to trigger the camera visual scanner check-in feedback loop.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {activeTab === 'chat' && (
          <div className="bg-white border border-surface-200 rounded-2xl shadow-sm h-[500px] flex flex-col justify-between overflow-hidden">
            {/* Chat header */}
            <div className="px-5 py-4 border-b border-surface-150 bg-surface-50 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-surface-800">Real-Time Event Live Q&A Wall</h4>
                <p className="text-[10px] text-surface-450">Workers register questions live on their device page. Type replies below.</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-success-500 animate-pulse" />
            </div>

            {/* Chat wall scroll */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-surface-50/20">
              {chatMessages.map((msg) => {
                const isMe = msg.sender && msg.sender._id === user._id;
                return (
                  <div
                    key={msg._id || msg.timestamp}
                    className={`flex flex-col max-w-[70%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-surface-650">{msg.senderName}</span>
                      <span className="text-[8px] text-surface-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs font-medium ${
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
                  <MessageSquare className="w-8 h-8 text-surface-200 mb-2" />
                  <p className="text-xs">No questions asked yet. Encourage candidates to chat on their event detail page!</p>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-surface-150 bg-white flex gap-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your announcement or reply to candidates here..."
                className="flex-1 px-4 py-3 text-xs border border-surface-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center transition-colors shadow"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Analytics Hub Panel */}
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-base font-bold text-surface-800">Recruitment Funnel Overview</h3>
              
              <div className="space-y-4">
                {/* Registrations */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-surface-600">Total Registered</span>
                    <span className="text-surface-900">{analytics.totalRegistrations}</span>
                  </div>
                  <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Checked In */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-surface-600">Attended (Checked In)</span>
                    <span className="text-surface-900">{analytics.attendanceCount} ({analytics.attendanceRate}%)</span>
                  </div>
                  <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-success-500 h-full rounded-full" style={{ width: `${analytics.attendanceRate}%` }} />
                  </div>
                </div>

                {/* Interviewed */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-surface-600">Interviewed</span>
                    <span className="text-surface-900">
                      {analytics.interviewedCount} ({analytics.totalRegistrations > 0 ? Math.round((analytics.interviewedCount / analytics.totalRegistrations) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-warning-500 h-full rounded-full" style={{
                      width: `${analytics.totalRegistrations > 0 ? (analytics.interviewedCount / analytics.totalRegistrations) * 100 : 0}%`
                    }} />
                  </div>
                </div>

                {/* Selected */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-surface-600">Hired & Selected</span>
                    <span className="text-surface-900">{analytics.selectedCount} ({analytics.hiringRate}%)</span>
                  </div>
                  <div className="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-accent-600 h-full rounded-full" style={{ width: `${analytics.hiringRate}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Slots Occupancy */}
            <div className="bg-white p-6 border border-surface-200 rounded-2xl shadow-sm space-y-6">
              <h3 className="text-base font-bold text-surface-800">Interview Slot Bookings</h3>
              <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-1">
                {analytics.slots.map((s) => (
                  <div key={s.time} className="flex justify-between items-center text-xs border border-surface-100 p-3 rounded-xl bg-surface-50">
                    <span className="font-semibold text-surface-700">{s.time}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-surface-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-primary-600 h-full rounded-full" style={{ width: `${s.fillRate}%` }} />
                      </div>
                      <span className="font-bold text-surface-800">{s.booked} / {s.capacity}</span>
                    </div>
                  </div>
                ))}
                {analytics.slots.length === 0 && (
                  <p className="text-xs text-surface-400 italic text-center py-6">No interview slots set up.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventDashboard;
