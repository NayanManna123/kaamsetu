import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Building2 } from 'lucide-react';
import { formatCurrency, timeAgo } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';
import toast, { Toaster } from 'react-hot-toast';

const Requests = () => {
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const isDemo = localStorage.getItem('kaamsetu_token') === 'demo_token';

  const loadRequests = async () => {
    if (isDemo) {
      setRequests([
        { _id: 'r1', companyName: 'BuildRight Construction', jobTitle: 'Site Work — Phase 3', offeredPay: 750, message: 'We need 3 experienced construction workers for our new residential project.', status: 'pending', createdAt: new Date(Date.now() - 3600000) },
        { _id: 'r2', companyName: 'CleanHome Services', jobTitle: 'Office Maintenance', offeredPay: 600, message: 'Weekly office maintenance work, Mon–Sat.', status: 'pending', createdAt: new Date(Date.now() - 7200000) },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      const res = await hiresAPI.getForWorker();
      
      // Map API fields if different
      const list = (res.data?.data || []).map(r => ({
        _id: r._id,
        companyName: r.company?.companyProfile?.companyName || r.company?.name || 'Company',
        jobTitle: r.job?.title || 'Daily Job Offer',
        offeredPay: r.offeredPay || r.job?.pay || 0,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      }));

      setRequests(list);
    } catch (err) {
      toast.error('Failed to load hire requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (req) => {
    if (isDemo) {
      setRequests((prev) => prev.map((r) => r._id === req._id ? { ...r, status: 'accepted' } : r));
      toast.success(`Accepted — ${req.jobTitle}`, { icon: '🎉' });
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      await hiresAPI.respond(req._id, { status: 'accepted' });
      toast.success(`Accepted offer!`, { icon: '🎉' });
      loadRequests();
    } catch (err) {
      toast.error('Could not accept hire request');
    }
  };

  const handleReject = async (req) => {
    if (isDemo) {
      setRequests((prev) => prev.map((r) => r._id === req._id ? { ...r, status: 'rejected' } : r));
      toast('Declined', { icon: '❌' });
      return;
    }

    try {
      const { hiresAPI } = await import('../../api/endpoints');
      await hiresAPI.respond(req._id, { status: 'rejected' });
      toast('Declined offer', { icon: '❌' });
      loadRequests();
    } catch (err) {
      toast.error('Could not decline hire request');
    }
  };

  const filtered = requests.filter((r) => r.status === tab);

  const tabs = [
    { key: 'pending', label: 'Pending', count: requests.filter((r) => r.status === 'pending').length },
    { key: 'accepted', label: 'Accepted', count: requests.filter((r) => r.status === 'accepted').length },
    { key: 'rejected', label: 'Rejected', count: requests.filter((r) => r.status === 'rejected').length },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold text-surface-900">Hire Offers</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-100 p-1 rounded-xl">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === key ? 'bg-primary-100 text-primary-600' : 'bg-surface-200 text-surface-500'
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request Cards */}
      <AnimatePresence mode="wait">
        {loading ? (
          [1, 2].map((i) => <div key={i} className="h-32 skeleton w-full" />)
        ) : filtered.length > 0 ? (
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filtered.map((req) => (
              <motion.div
                key={req._id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-900 text-base">{req.jobTitle}</h3>
                    <p className="text-sm text-surface-500">{req.companyName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary-600 text-lg">{formatCurrency(req.offeredPay)}</p>
                    <p className="text-[11px] text-surface-400">/day</p>
                  </div>
                </div>

                <p className="text-sm text-surface-600 mb-2">{req.message}</p>
                <p className="text-xs text-surface-400 flex items-center gap-1 mb-3">
                  <Clock className="w-3 h-3" />
                  {timeAgo(req.createdAt)}
                </p>

                {req.status === 'pending' && (
                  <div className="flex gap-3">
                    <button onClick={() => handleAccept(req)} className="flex-1 btn-success text-sm py-2.5 flex items-center justify-center gap-1">
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button onClick={() => handleReject(req)} className="flex-1 btn-danger text-sm py-2.5 flex items-center justify-center gap-1">
                      <X className="w-4 h-4" /> Decline
                    </button>
                  </div>
                )}

                {req.status === 'accepted' && (
                  <div className="py-2 px-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium text-center border border-green-200">
                    ✓ Accepted
                  </div>
                )}

                {req.status === 'rejected' && (
                  <div className="py-2 px-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                    Declined
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState title="No requests" message={`No ${tab} hire offers`} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Requests;
