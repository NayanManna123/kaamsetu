import { motion } from 'framer-motion';
import { MapPin, Clock, Users, Zap, ChevronRight, ShieldCheck, Navigation } from 'lucide-react';
import { formatCurrency, getSkillColor, WORK_TYPE_LABELS } from '../utils/helpers';

/**
 * Job Card Component
 * Displays job information with apply button
 * 
 * Improvements:
 * - Distance display when available (e.g., "2.3 km away")
 * - Larger "APPLY NOW" button (48px touch target)
 * - Company trust badges (verified, payment reliability)
 * - Match score when available
 */
const JobCard = ({ job, onApply, onViewDetails, compact = false }) => {
  const isUrgent = job.urgency === 'urgent';
  const company = job.company || {};

  return (
    <motion.div
      onClick={() => onViewDetails?.(job)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border border-surface-100 overflow-hidden transition-all duration-300 cursor-pointer ${
        isUrgent ? 'ring-2 ring-danger-200' : ''
      }`}
    >
      {/* Urgent Banner */}
      {isUrgent && (
        <div className="gradient-warm px-4 py-1.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          <span className="text-white text-xs font-bold tracking-wide">URGENT — HIRING NOW</span>
        </div>
      )}

      <div className="p-4">
        {/* Match Score Badge */}
        {job.matchScore !== undefined && job.matchScore !== null && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, job.matchScore)}%`,
                  background: job.matchScore >= 70 ? '#10B981' : job.matchScore >= 40 ? '#F59E0B' : '#94A3B8',
                }}
              />
            </div>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
              job.matchScore >= 70 ? 'bg-green-100 text-green-700' :
              job.matchScore >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-surface-100 text-surface-600'
            }`}>
              {Math.round(job.matchScore)}% match
            </span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-surface-900 text-base leading-snug truncate">
              {job.title}
            </h3>
            <p className="text-sm text-surface-500 mt-0.5 flex items-center gap-1">
              <span className="w-5 h-5 rounded-lg bg-primary-100 inline-flex items-center justify-center text-[10px] font-bold text-primary-700">
                {company.name?.[0] || job.companyName?.[0] || 'C'}
              </span>
              <span className="truncate">
                {company.companyProfile?.companyName || company.name || job.companyName || 'Company'}
              </span>
              {company.companyProfile?.verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}
            </p>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className="text-lg font-bold text-primary-600">{formatCurrency(job.pay)}</p>
            <p className="text-[11px] text-surface-400">
              {job.payType === 'fixed' ? 'fixed' : '/day'}
            </p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-surface-500 mb-3">
          {/* Distance (if available) */}
          {job.distance !== undefined && job.distance !== null ? (
            <span className="flex items-center gap-1 text-primary-600 font-semibold">
              <Navigation className="w-3.5 h-3.5" />
              {job.distance} km away
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.location?.city || job.location?.address || 'Location TBD'}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {job.duration || '1 day'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {job.workersHired || 0}/{job.workersNeeded || 1} hired
          </span>
        </div>

        {/* Company Trust Score */}
        {company.companyProfile?.paymentHistoryRate !== undefined && 
         company.companyProfile.paymentHistoryRate < 100 && (
          <div className="text-[10px] text-surface-400 mb-2 flex items-center gap-1">
            💳 Payment reliability: {company.companyProfile.paymentHistoryRate}%
          </div>
        )}

        {/* Skills Tags */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getSkillColor(skill)}`}
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] text-surface-400 bg-surface-100">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Work Type Badge + Apply — larger button for touch */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-50">
          <span className="chip text-[11px]">
            {WORK_TYPE_LABELS[job.workType] || job.workType}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply?.(job);
            }}
            className="gradient-primary text-white text-sm font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.97] flex items-center gap-1"
          >
            APPLY NOW
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
