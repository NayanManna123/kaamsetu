import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Clock, CheckCircle2, MapPin } from 'lucide-react';
import { formatCurrency, timeAgo } from '../../utils/helpers';
import EmptyState from '../../components/EmptyState';

const DEMO_MY_JOBS = {
  applied: [
    { _id: '1', title: 'Construction Workers — Site A', companyName: 'BuildRight Construction', pay: 700, payType: 'per_day', location: { city: 'Mumbai' }, appliedAt: new Date(Date.now() - 3600000), status: 'pending' },
    { _id: '2', title: 'Electrician for Office Wiring', companyName: 'CleanHome Services', pay: 25000, payType: 'fixed', location: { city: 'Delhi' }, appliedAt: new Date(Date.now() - 86400000), status: 'pending' },
  ],
  ongoing: [
    { _id: '3', title: 'Delivery Partner — Bangalore', companyName: 'FastLogistics India', pay: 500, payType: 'per_day', location: { city: 'Bangalore' }, startDate: new Date(), status: 'in_progress' },
  ],
  completed: [
    { _id: '4', title: 'House Painting', companyName: 'BuildRight', pay: 12000, payType: 'fixed', location: { city: 'Mumbai' }, completedAt: new Date(Date.now() - 604800000), status: 'completed', rating: 5 },
    { _id: '5', title: 'Office Cleaning', companyName: 'CleanHome', pay: 600, payType: 'per_day', location: { city: 'Delhi' }, completedAt: new Date(Date.now() - 1209600000), status: 'completed', rating: 4 },
  ],
};

const STATUS_ICONS = {
  applied: Clock,
  ongoing: Briefcase,
  completed: CheckCircle2,
};

const STATUS_COLORS = {
  applied: 'text-yellow-600 bg-yellow-50',
  ongoing: 'text-blue-600 bg-blue-50',
  completed: 'text-green-600 bg-green-50',
};

const MyJobs = () => {
  const [tab, setTab] = useState('applied');

  const jobs = DEMO_MY_JOBS[tab] || [];
  const Icon = STATUS_ICONS[tab];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-surface-900">My Jobs</h1>

      {/* Tabs */}
      <div className="flex gap-2 bg-surface-100 p-1 rounded-xl">
        {[
          { key: 'applied', label: 'Applied', count: DEMO_MY_JOBS.applied.length },
          { key: 'ongoing', label: 'Ongoing', count: DEMO_MY_JOBS.ongoing.length },
          { key: 'completed', label: 'Completed', count: DEMO_MY_JOBS.completed.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Job list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {jobs.length > 0 ? (
            jobs.map((job, i) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${STATUS_COLORS[tab]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-surface-900">{job.title}</h3>
                    <p className="text-sm text-surface-500">{job.companyName}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-400">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {job.location?.city}
                      </span>
                      <span>
                        {tab === 'applied' && `Applied ${timeAgo(job.appliedAt)}`}
                        {tab === 'ongoing' && 'In progress'}
                        {tab === 'completed' && `Completed ${timeAgo(job.completedAt)}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-primary-600">{formatCurrency(job.pay)}</p>
                    <p className="text-[10px] text-surface-400">{job.payType === 'fixed' ? 'fixed' : '/day'}</p>
                  </div>
                </div>

                {tab === 'completed' && job.rating && (
                  <div className="mt-3 pt-2 border-t border-surface-50 flex items-center gap-1">
                    <span className="text-xs text-surface-500">Your rating:</span>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-sm ${i < job.rating ? 'text-warning-500' : 'text-surface-200'}`}>★</span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <EmptyState title={`No ${tab} jobs`} message={`You don't have any ${tab} jobs yet`} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MyJobs;
