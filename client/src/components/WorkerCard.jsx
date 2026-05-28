import { motion } from 'framer-motion';
import { MapPin, Star, Award, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import { formatCurrency, getSkillColor, getInitials } from '../utils/helpers';

/**
 * Worker Card Component
 * Displays worker profile info with hire button
 * 
 * Improvements:
 * - Distance display (e.g., "📍 2.3 km away")
 * - Trust indicators: completion rate, reliability score
 * - "⚡ Available Now" live indicator (green pulsing dot)
 * - Match score percentage when available
 * - Larger, more prominent "Hire Now" button
 * - Verified badge more visible
 */
const WorkerCard = ({ worker, onHire, selected = false, selectable = false }) => {
  const profile = worker.workerProfile || {};
  const isInstant = profile.isInstantAvailable;

  const availabilityConfig = {
    today: { label: 'Available Today', icon: '🟢', classes: 'bg-green-100 text-green-700 border-green-200' },
    this_week: { label: 'This Week', icon: '📅', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
    available: { label: 'Available', icon: '✅', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    unavailable: { label: 'Unavailable', icon: '⛔', classes: 'bg-gray-100 text-gray-500 border-gray-200' },
  };

  const avail = availabilityConfig[profile.availability] || availabilityConfig.available;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        selected
          ? 'border-primary-400 ring-2 ring-primary-100 shadow-glow'
          : 'border-surface-100 hover:shadow-card-hover'
      }`}
    >
      <div className="p-4">
        {/* Instant Available Banner */}
        {isInstant && (
          <div className="flex items-center gap-1.5 mb-3 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xl">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-green-700 text-xs font-bold tracking-wide">⚡ AVAILABLE NOW</span>
          </div>
        )}

        {/* Top: Avatar + Name + Rating */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg">
              {worker.avatar ? (
                <img src={worker.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                getInitials(worker.name)
              )}
            </div>
            {worker.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                <Award className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-surface-900 text-base truncate">
                {worker.name}
              </h3>
              {worker.isVerified && (
                <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-warning-500" fill="#F59E0B" />
                <span className="text-sm font-semibold text-surface-800">
                  {worker.rating?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-surface-400">
                  ({worker.ratingCount || 0})
                </span>
              </div>
              {profile.experience > 0 && (
                <span className="text-xs text-surface-400">
                  • {profile.experience}yr exp
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary-600">
              {formatCurrency(profile.expectedWage)}
            </p>
            <p className="text-[11px] text-surface-400">/day</p>
          </div>
        </div>

        {/* Match Score Badge */}
        {worker.matchScore !== undefined && worker.matchScore !== null && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, worker.matchScore)}%`,
                  background: worker.matchScore >= 70 ? '#10B981' : worker.matchScore >= 40 ? '#F59E0B' : '#94A3B8',
                }}
              />
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              worker.matchScore >= 70 ? 'bg-green-100 text-green-700' :
              worker.matchScore >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-surface-100 text-surface-600'
            }`}>
              {Math.round(worker.matchScore)}% match
            </span>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${getSkillColor(skill)}`}
              >
                {skill}
              </span>
            ))}
            {profile.skills.length > 4 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] text-surface-400 bg-surface-100">
                +{profile.skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Trust Indicators Row */}
        <div className="flex items-center gap-3 mb-3 text-[11px]">
          {profile.completionRate !== undefined && (
            <div className="flex items-center gap-1 text-surface-500">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span>{profile.completionRate || 100}% done</span>
            </div>
          )}
          {profile.reliabilityScore !== undefined && profile.reliabilityScore < 100 && (
            <div className="flex items-center gap-1 text-surface-500">
              <ShieldCheck className="w-3 h-3 text-primary-500" />
              <span>{profile.reliabilityScore}% reliable</span>
            </div>
          )}
          {profile.completedJobs > 0 && (
            <span className="text-surface-400">{profile.completedJobs} jobs</span>
          )}
        </div>

        {/* Distance + Availability */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${avail.classes}`}>
              {avail.icon} {avail.label}
            </span>
          </div>
          {/* Distance */}
          {worker.distance !== undefined && worker.distance !== null && (
            <span className="text-xs text-primary-600 font-semibold flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {worker.distance} km away
            </span>
          )}
          {!worker.distance && worker.location?.city && (
            <span className="text-xs text-surface-400 flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {worker.location.city}
            </span>
          )}
        </div>

        {/* Action buttons — larger for touch targets */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-50">
          {selectable ? (
            <button
              onClick={() => onHire?.(worker)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                selected
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
              }`}
            >
              {selected ? '✓ Selected' : 'Select Worker'}
            </button>
          ) : (
            <button
              onClick={() => onHire?.(worker)}
              className="flex-1 gradient-primary text-white text-sm font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-1.5"
            >
              <Zap className="w-4 h-4" fill="white" />
              HIRE NOW
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WorkerCard;
