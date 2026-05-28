import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, Star, Phone, MessageCircle, CreditCard, Clock, Calendar } from 'lucide-react';
import { formatCurrency, timeAgo, getSkillColor } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';
import StarRating from '../../components/StarRating';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const Hires = () => {
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [hiresList, setHiresList] = useState({ active: [], pending: [], completed: [] });
  const [escrows, setEscrows] = useState({}); // maps hire request / job ID to escrow details
  const [ratingModal, setRatingModal] = useState(null);
  const [ratingScore, setRatingScore] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token';

  const loadHiresData = async () => {
    if (isDemo) {
      setHiresList({
        active: [
          { _id: 'h1', worker: { name: 'Rajesh Kumar', rating: 4.5, phone: '9876543210' }, job: { _id: 'j1', title: 'Construction — Site A', pay: 700 }, offeredPay: 700, skills: ['construction'], startDate: new Date(), status: 'accepted' }
        ],
        pending: [
          { _id: 'h3', worker: { name: 'Suresh Yadav', rating: 4.2 }, job: { title: 'Plumbing Repair' }, offeredPay: 900, skills: ['plumber'], createdAt: new Date(Date.now() - 3600000), status: 'pending' }
        ],
        completed: [
          { _id: 'h5', worker: { name: 'Priya Devi', rating: 4.6 }, job: { _id: 'j5', title: 'Office Cleaning', pay: 600 }, offeredPay: 600, skills: ['cleaner'], completedAt: new Date(Date.now() - 604800000), status: 'completed' }
        ]
      });
      setLoading(false);
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      const res = await hiresAPI.getByCompany();
      const allHires = res.data?.data || [];

      // Categorize hires
      const pending = allHires.filter(h => h.status === 'pending');
      
      // Let's check completed vs active based on escrow status or job status
      const active = allHires.filter(h => h.status === 'accepted');
      
      // Let's query completed from rated workers or jobs marked completed
      const completed = allHires.filter(h => h.status === 'completed' || h.job?.status === 'completed');

      setHiresList({ active, pending, completed });

      // Fetch escrow details for all active hires
      const escMap = {};
      for (const hire of active) {
        if (hire.job?._id) {
          try {
            const escRes = await axios.get(`/api/escrow/job/${hire.job._id}`);
            if (escRes.data?.data) {
              escMap[hire._id] = escRes.data.data;
            }
          } catch (e) { /* ignore no escrow errors */ }
        }
      }
      setEscrows(escMap);

    } catch (err) {
      toast.error('Failed to load hires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHiresData();
  }, []);

  // Handle escrow release
  const handleReleaseEscrow = async (hireId) => {
    const escrow = escrows[hireId];
    if (!escrow) {
      toast.error('No held escrow found for this work contract');
      return;
    }

    if (isDemo) {
      toast.success('Funds released from escrow (Demo Mode)!', { icon: '💰' });
      return;
    }

    try {
      await axios.put(`/api/escrow/${escrow._id}/release`);
      toast.success('Escrow released! Worker has been credited.', { icon: '🎉' });
      loadHiresData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release escrow');
    }
  };

  const submitRating = async () => {
    if (!ratingModal) return;

    if (isDemo) {
      toast.success(`Rated ${ratingModal.worker?.name} — ${ratingScore} stars!`, { icon: '⭐' });
      setRatingModal(null);
      setRatingScore(0);
      setReviewText('');
      return;
    }

    try {
      const { ratingsAPI } = await import('../../api/endpoints');
      await ratingsAPI.create({
        toUserId: ratingModal.worker?._id,
        jobId: ratingModal.job?._id,
        score: ratingScore,
        review: reviewText,
      });

      toast.success('Rating submitted successfully!', { icon: '⭐' });
      setRatingModal(null);
      setRatingScore(0);
      setReviewText('');
      loadHiresData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting rating');
    }
  };

  const currentTabHires = hiresList[tab] || [];

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-10">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-surface-900">My Hires</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-100 p-1 rounded-xl">
        {[
          { key: 'active', label: 'Active', count: hiresList.active.length },
          { key: 'pending', label: 'Pending', count: hiresList.pending.length },
          { key: 'completed', label: 'Completed', count: hiresList.completed.length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === key 
                ? 'bg-white text-primary-700 shadow-sm' 
                : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {loading ? (
            [1, 2].map((i) => <div key={i} className="h-28 skeleton w-full" />)
          ) : currentTabHires.length > 0 ? (
            currentTabHires.map((hire) => {
              const escrow = escrows[hire._id];
              
              return (
                <motion.div
                  key={hire._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {hire.worker?.name?.[0] || 'W'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-surface-900 truncate">{hire.worker?.name}</h3>
                          <span className="text-xs text-warning-500 font-semibold shrink-0">★{hire.worker?.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <p className="text-xs text-surface-500 font-semibold truncate mt-0.5">{hire.job?.title || 'Daily wage service'}</p>
                        {hire.worker?.workerProfile?.skills && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {hire.worker.workerProfile.skills.slice(0, 2).map((s) => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-surface-100 text-surface-600 uppercase">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-primary-600 text-lg">
                        {formatCurrency(hire.offeredPay || hire.job?.pay || 0)}
                      </span>
                      <p className="text-[10px] text-surface-400">/day</p>
                    </div>
                  </div>

                  {/* Actions & Escrow release */}
                  <div className="mt-4 pt-3 border-t border-surface-50 flex flex-col gap-2">
                    {tab === 'active' && (
                      <div className="space-y-2">
                        {escrow && escrow.status === 'held' && (
                          <button
                            onClick={() => handleReleaseEscrow(hire._id)}
                            className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CreditCard className="w-4 h-4" /> RELEASE ESCROW PAYMENT (₹{escrow.amount})
                          </button>
                        )}
                        {escrow && escrow.status === 'released' && (
                          <div className="py-2 text-center bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-xl">
                            ✓ Payment Released to Wallet
                          </div>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={`tel:${hire.worker?.phone || '9876543210'}`}
                            className="flex-1 py-2 bg-surface-50 hover:bg-surface-100 text-surface-600 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1 border border-surface-100"
                          >
                            Call: {hire.worker?.phone || 'Call'}
                          </a>
                          <button
                            onClick={() => toast.success('Starting chat room...')}
                            className="flex-1 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1"
                          >
                            <MessageCircle className="w-4.5 h-4.5" /> Chat
                          </button>
                        </div>
                      </div>
                    )}

                    {tab === 'pending' && (
                      <div className="flex justify-between items-center bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-100">
                        <span className="text-xs text-yellow-800 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-yellow-600 animate-spin" />
                          Waiting for worker to accept offer...
                        </span>
                        <span className="text-[10px] text-surface-400">Sent {timeAgo(hire.createdAt)}</span>
                      </div>
                    )}

                    {tab === 'completed' && (
                      <button
                        onClick={() => setRatingModal(hire)}
                        className="w-full py-2 bg-warning-500 hover:bg-warning-600 text-white font-extrabold rounded-xl text-xs tracking-wider transition-all flex items-center justify-center gap-1.5"
                      >
                        Rate Worker & Complete Contract
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          ) : (
            <EmptyState title={`No ${tab} hires`} message={`You don't have any ${tab} work placements`} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
          >
            <div>
              <h3 className="text-lg font-bold text-surface-900">Rate {ratingModal.worker?.name}</h3>
              <p className="text-xs text-surface-500">For job: {ratingModal.job?.title}</p>
            </div>
            
            <div className="flex justify-center py-2">
              <StarRating rating={ratingScore} size="lg" interactive onChange={setRatingScore} />
            </div>

            <div>
              <label className="text-xs font-bold text-surface-600 block mb-1">Feedback/Review</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="How was the worker's attendance and quality of work?"
                className="w-full px-3 py-2 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRatingModal(null)}
                className="flex-1 py-3 border-2 border-surface-200 text-surface-500 font-bold rounded-2xl text-xs hover:bg-surface-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                disabled={!ratingScore}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl text-xs disabled:opacity-50 active:scale-95 transition-all"
              >
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Hires;
