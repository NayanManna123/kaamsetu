import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, Phone, MoreVertical, Loader2, MessageSquare, MapPin, Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getInitials, timeAgo } from '../../utils/helpers';
import toast from 'react-hot-toast';

// Demo fallback data
const DEMO_ROOMS = [
  { _id: 'room1', otherUser: { _id: 'u1', name: 'BuildRight Construction', role: 'company' }, lastMessage: { content: 'When can you start?', timestamp: new Date(Date.now() - 300000) }, unread: 2 },
  { _id: 'room2', otherUser: { _id: 'u2', name: 'CleanHome Services', role: 'company' }, lastMessage: { content: 'Job completed. Thank you!', timestamp: new Date(Date.now() - 86400000) }, unread: 0 },
  { _id: 'room3', otherUser: { _id: 'u3', name: 'Rajesh Kumar', role: 'worker' }, lastMessage: { content: 'I am available tomorrow', timestamp: new Date(Date.now() - 7200000) }, unread: 1 },
];

const DEMO_MESSAGES = [
  { _id: 'm1', sender: { _id: 'other', name: 'BuildRight Construction' }, content: 'Hello! We need construction workers for tomorrow.', createdAt: new Date(Date.now() - 7200000) },
  { _id: 'm2', sender: { _id: 'me', name: 'Me' }, content: 'Hi! I am available. What is the location?', createdAt: new Date(Date.now() - 7000000) },
  { _id: 'm3', sender: { _id: 'other', name: 'BuildRight Construction' }, content: 'BKC Phase 2, Mumbai. Start time 7 AM.', createdAt: new Date(Date.now() - 6800000) },
  { _id: 'm4', sender: { _id: 'me', name: 'Me' }, content: 'Great, I will be there. What is the pay?', createdAt: new Date(Date.now() - 6600000) },
  { _id: 'm5', sender: { _id: 'other', name: 'BuildRight Construction' }, content: '₹700/day. Lunch will be provided.', createdAt: new Date(Date.now() - 3600000) },
  { _id: 'm6', sender: { _id: 'other', name: 'BuildRight Construction' }, content: 'When can you start?', createdAt: new Date(Date.now() - 300000) },
];

const ChatRoom = () => {
  const { user } = useAuth();
  const { socket, emitTyping, onlineCount } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token' || !user?._id;

  // Fetch chat rooms
  const fetchRooms = useCallback(async () => {
    if (isDemo) {
      setRooms(DEMO_ROOMS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { chatAPI } = await import('../../api/endpoints');
      const res = await chatAPI.getRooms();
      const fetchedRooms = (res.data?.data || []).map(room => {
        // Find the other participant
        const otherUser = room.participants?.find(p => p._id !== user._id) || room.participants?.[0];
        return { ...room, otherUser };
      });
      setRooms(fetchedRooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms(DEMO_ROOMS);
    } finally {
      setLoading(false);
    }
  }, [isDemo, user]);

  // Fetch messages for a room
  const fetchMessages = useCallback(async (roomId) => {
    if (isDemo) {
      setMessages(DEMO_MESSAGES);
      return;
    }

    try {
      const { chatAPI } = await import('../../api/endpoints');
      const res = await chatAPI.getMessages(roomId);
      setMessages(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages(DEMO_MESSAGES);
    }
  }, [isDemo]);

  // Load rooms on mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Deep link select room
  useEffect(() => {
    if (rooms.length > 0 && location.state?.roomId) {
      const room = rooms.find(r => r._id === location.state.roomId);
      if (room) {
        openRoom(room);
        // Clear location state to prevent re-opening on manual clicks later
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [rooms, location.state, navigate, location.pathname]);

  // Fetch online status when selectedRoom changes
  useEffect(() => {
    if (!selectedRoom || isDemo) {
      setOtherUserOnline(selectedRoom?.otherUser?._id === 'u1');
      return;
    }

    const checkOnlineStatus = async () => {
      try {
        const { authAPI } = await import('../../api/endpoints');
        const res = await authAPI.getOnlineStatus(selectedRoom.otherUser._id);
        setOtherUserOnline(res.data?.isOnline || false);
      } catch (err) {
        console.warn('Failed to check online status:', err);
        setOtherUserOnline(false);
      }
    };

    checkOnlineStatus();
  }, [selectedRoom, isDemo]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  // Socket: listen for new messages, typing and status updates
  useEffect(() => {
    if (!socket || isDemo) return;

    const handleNewMessage = (msg) => {
      setMessages(prev => [...prev, msg]);
      // Update last message in room list
      setRooms(prev => prev.map(r => {
        if (r._id === msg.room || r._id === selectedRoom?._id) {
          return { ...r, lastMessage: { content: msg.content, sender: msg.sender._id || msg.sender, timestamp: new Date() } };
        }
        return r;
      }));
    };

    const handleTyping = (data) => {
      if (data.isTyping) {
        setTypingUser(data.name);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    };

    const handleUserStatus = (data) => {
      if (selectedRoom && selectedRoom.otherUser?._id === data.userId) {
        setOtherUserOnline(data.status === 'online');
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);
    socket.on('userStatus', handleUserStatus);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
      socket.off('userStatus', handleUserStatus);
    };
  }, [socket, isDemo, selectedRoom]);

  // Join/leave chat room via socket
  useEffect(() => {
    if (!socket || !selectedRoom || isDemo) return;

    socket.emit('joinChat', selectedRoom._id);
    return () => {
      socket.emit('leaveChat', selectedRoom._id);
    };
  }, [socket, selectedRoom, isDemo]);

  // Open a room
  const openRoom = (room) => {
    setSelectedRoom(room);
    fetchMessages(room._id);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const content = newMessage.trim();
    setNewMessage('');

    if (isDemo) {
      setMessages(prev => [...prev, {
        _id: `m${Date.now()}`,
        sender: { _id: 'me', name: user?.name || 'Me' },
        content,
        createdAt: new Date(),
      }]);
      return;
    }

    try {
      setSendingMessage(true);
      const { chatAPI } = await import('../../api/endpoints');
      await chatAPI.sendMessage(selectedRoom._id, { content });
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => [...prev, {
        _id: `m${Date.now()}`,
        sender: { _id: user._id, name: user.name },
        content,
        createdAt: new Date(),
      }]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Share Geolocation
  const shareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setSharingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        const content = `📍 Current Location: ${mapsUrl}`;

        if (isDemo) {
          setMessages(prev => [...prev, {
            _id: `m${Date.now()}`,
            sender: { _id: 'me', name: user?.name || 'Me' },
            content,
            createdAt: new Date(),
          }]);
          setSharingLocation(false);
          return;
        }

        try {
          const { chatAPI } = await import('../../api/endpoints');
          await chatAPI.sendMessage(selectedRoom._id, { content });
        } catch (err) {
          console.error('Failed to share location:', err);
          setMessages(prev => [...prev, {
            _id: `m${Date.now()}`,
            sender: { _id: user._id, name: user.name },
            content,
            createdAt: new Date(),
          }]);
        } finally {
          setSharingLocation(false);
        }
      },
      (error) => {
        console.error('Location error:', error);
        setSharingLocation(false);
        toast.error('Unable to fetch your location');
      },
      { timeout: 8000 }
    );
  };

  // Typing indicator
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (selectedRoom && !isDemo) {
      emitTyping(selectedRoom._id, true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(selectedRoom._id, false);
      }, 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMine = (msg) => {
    if (isDemo) return msg.sender?._id === 'me';
    return msg.sender?._id === user?._id || msg.sender === user?._id;
  };

  // Render location preview card
  const renderMessageContent = (msg) => {
    const isLocation = msg.content?.startsWith('📍 Current Location: https://www.google.com/maps?q=');
    if (isLocation) {
      const url = msg.content.substring(21).trim();
      const mine = isMine(msg);
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <MapPin className={`w-4 h-4 ${mine ? 'text-blue-200 fill-blue-200/20' : 'text-primary-650'}`} />
            <span>Shared Location</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all shadow-sm active:scale-95 border ${
              mine
                ? 'bg-white text-primary-750 border-white hover:bg-surface-50'
                : 'bg-primary-50 hover:bg-primary-100 text-primary-755 border-primary-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            View on Google Maps
          </a>
        </div>
      );
    }
    return <p className="whitespace-pre-wrap">{msg.content}</p>;
  };

  return (
    <div className="h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] flex bg-white rounded-3xl border border-surface-150 overflow-hidden shadow-card">
      {/* LEFT PANEL: Rooms List */}
      <div className={`w-full lg:w-80 border-r border-surface-150 flex flex-col h-full shrink-0 ${
        selectedRoom ? 'hidden lg:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <h1 className="text-xl font-black text-surface-900 flex items-center gap-1.5">
            <MessageSquare className="w-5 h-5 text-primary-500 fill-primary-500/10" /> Conversations
          </h1>
          {onlineCount > 0 && (
            <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
              ● {onlineCount} online
            </span>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-2xl bg-surface-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-200 rounded w-1/3" />
                    <div className="h-3 bg-surface-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto bg-surface-100 rounded-2xl flex items-center justify-center mb-4 border border-surface-150">
                <MessageSquare className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-sm font-semibold text-surface-700">No conversations yet</h3>
              <p className="text-xs text-surface-500 mt-1 max-w-[200px] mx-auto">Messages will appear here when you apply for a job or get hired.</p>
            </div>
          ) : (
            rooms.map((room) => (
              <motion.button
                key={room._id}
                whileHover={{ x: 2 }}
                onClick={() => openRoom(room)}
                className={`w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all ${
                  selectedRoom?._id === room._id
                    ? 'bg-primary-50/50 border-primary-200/65 shadow-sm'
                    : 'bg-white border-surface-100 hover:shadow-sm'
                }`}
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 text-white flex items-center justify-center font-bold text-base shrink-0">
                  {getInitials(room.otherUser?.name || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-surface-900 text-sm truncate">{room.otherUser?.name || 'User'}</h3>
                    <span className="text-[10px] text-surface-400 shrink-0">
                      {timeAgo(room.lastMessage?.timestamp || room.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500 truncate mt-0.5">
                    {room.lastMessage?.content || 'Start chatting...'}
                  </p>
                </div>
                {room.unread > 0 && (
                  <span className="w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0">
                    {room.unread}
                  </span>
                )}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Conversation */}
      <div className={`flex-1 flex flex-col h-full bg-surface-50/30 ${
        selectedRoom ? 'flex' : 'hidden lg:flex items-center justify-center'
      }`}>
        {selectedRoom ? (
          <div className="flex flex-col h-full w-full p-4 relative">
            {/* Chat Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-surface-100 mb-3 shrink-0">
              <button 
                onClick={() => setSelectedRoom(null)} 
                className="p-2 rounded-xl hover:bg-surface-100 transition-colors lg:hidden"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 text-white flex items-center justify-center font-bold shrink-0">
                {getInitials(selectedRoom.otherUser?.name || 'U')}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-surface-900 text-sm">{selectedRoom.otherUser?.name || 'User'}</h3>
                {typingUser ? (
                  <p className="text-xs text-primary-500 animate-pulse">typing...</p>
                ) : otherUserOnline ? (
                  <p className="text-xs text-green-500 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" /> Online
                  </p>
                ) : (
                  <p className="text-xs text-surface-400">Offline</p>
                )}
              </div>
              <button className="p-2 rounded-xl hover:bg-surface-100 text-surface-500"><Phone className="w-5 h-5" /></button>
              <button className="p-2 rounded-xl hover:bg-surface-100 text-surface-500"><MoreVertical className="w-5 h-5" /></button>
            </div>

            {/* Job Details Card */}
            {selectedRoom.job && (
              <div className="bg-primary-50 border border-primary-100/60 rounded-2xl p-3.5 mb-3 text-xs shrink-0 flex items-center justify-between">
                <div>
                  <p className="font-bold text-primary-850">📋 {selectedRoom.job.title || 'Job Details'}</p>
                  {selectedRoom.job.pay && (
                    <p className="text-primary-650 font-bold mt-0.5">💰 ₹{selectedRoom.job.pay} ({selectedRoom.job.payType === 'fixed' ? 'fixed' : 'day'})</p>
                  )}
                </div>
                <button 
                  onClick={() => navigate(`/job/${selectedRoom.job._id || selectedRoom.job}`)}
                  className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold rounded-xl transition-colors shadow-sm active:scale-95"
                >
                  View Details
                </button>
              </div>
            )}

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto space-y-3 px-1 no-scrollbar pb-2">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine(msg)
                      ? 'bg-primary-600 text-white rounded-br-md shadow-sm'
                      : 'bg-white text-surface-800 rounded-bl-md border border-surface-100 shadow-sm'
                  }`}>
                    {!isMine(msg) && msg.sender?.name && (
                      <p className="text-[10px] font-bold text-primary-650 mb-0.5">{msg.sender.name}</p>
                    )}
                    {renderMessageContent(msg)}
                    <p className={`text-[9px] mt-1 text-right ${isMine(msg) ? 'text-blue-105' : 'text-surface-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {typingUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-surface-100 shadow-sm text-surface-500 rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-surface-400">{typingUser} is typing</span>
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Action Bar */}
            <div className="pt-3 border-t border-surface-100 mt-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                />
                
                {/* Geolocation Sharing */}
                <button
                  onClick={shareLocation}
                  disabled={sharingLocation}
                  type="button"
                  className="w-12 h-12 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-xl flex items-center justify-center text-surface-600 transition-colors active:scale-95 shrink-0"
                  title="Share Location"
                >
                  {sharingLocation ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary-650" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary-600" />
                  )}
                </button>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8 text-surface-400 max-w-sm">
            <div className="w-20 h-20 bg-surface-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-surface-100">
              <MessageSquare className="w-10 h-10 text-primary-500 fill-primary-500/10" />
            </div>
            <h3 className="text-lg font-bold text-surface-800">Your Conversations</h3>
            <p className="text-sm text-surface-500 mt-1.5 leading-relaxed">
              Select a conversation from the sidebar list to view job applications details and chat with employers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatRoom;
