import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle2, Briefcase } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

/**
 * Quick Hire Modal
 * Minimal 2-field modal for instant one-click hiring
 * 
 * Features:
 * - Pre-fills pay from worker's expected wage or selected job
 * - One-click send with loading state
 * - Success state shows "Waiting for worker response"
 * - Auto-selects job if only one active job exists
 */
const QuickHireModal = ({ worker, jobs = [], onClose, onHire, isDemo = false }) => {
  const [offeredPay, setOfferedPay] = useState(
    worker?.workerProfile?.expectedWage || jobs[0]?.pay || 700
  );
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?._id || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    if (isDemo) {
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
      toast.success(`Hire request sent to ${worker.name}!`, { icon: '📩' });
      setTimeout(() => onClose(), 1500);
      return;
    }

    try {
      await onHire({
        workerId: worker._id,
        jobId: selectedJobId || undefined,
        offeredPay: parseFloat(offeredPay),
        message: message || `Hi ${worker.name}, we'd like to hire you!`,
        startDate: new Date(),
      });
      setSent(true);
      toast.success(`Hire request sent to ${worker.name}!`, { icon: '📩' });
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send hire request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden"
      >
        {/* Success State */}
        {sent ? (
          <div className="p-8 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            </motion.div>
            <h3 className="text-xl font-bold text-surface-900">Request Sent!</h3>
            <p className="text-sm text-surface-500">
              Waiting for <span className="font-semibold">{worker.name}</span> to respond...
            </p>
            <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, ease: 'linear' }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="gradient-primary px-6 py-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">Hire Now ⚡</h3>
                  <p className="text-blue-100 text-sm mt-0.5">
                    Send offer to <span className="font-semibold">{worker.name}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Worker quick info */}
              <div className="flex items-center gap-3 mt-4 bg-white/10 rounded-2xl p-3">
                <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {worker.name?.[0] || 'W'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{worker.name}</p>
                  <p className="text-blue-100 text-xs">
                    ★{worker.rating?.toFixed(1) || '0.0'}
                    {worker.distance !== null && worker.distance !== undefined
                      ? ` • ${worker.distance} km away`
                      : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Job Selection (if multiple jobs) */}
              {jobs.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-surface-600 block mb-1.5 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    For Job
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => {
                      setSelectedJobId(e.target.value);
                      const job = jobs.find((j) => j._id === e.target.value);
                      if (job) setOfferedPay(job.pay);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="">Quick Hire (no specific job)</option>
                    {jobs.map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title} — {formatCurrency(j.pay)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pay Amount */}
              <div>
                <label className="text-xs font-bold text-surface-600 block mb-1.5">
                  💰 Offered Pay (₹/day)
                </label>
                <input
                  type="number"
                  value={offeredPay}
                  onChange={(e) => setOfferedPay(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-surface-200 text-lg font-bold text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="700"
                  min="100"
                  required
                />
              </div>

              {/* Optional Message */}
              <div>
                <label className="text-xs font-bold text-surface-600 block mb-1.5">
                  💬 Message (optional)
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Looking forward to working with you!"
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  maxLength={200}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending || !offeredPay}
                className="w-full py-4 gradient-primary text-white font-bold rounded-2xl text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    SEND HIRE REQUEST
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default QuickHireModal;
