/**
 * Utility helper functions
 */

/** Format currency in Indian Rupees */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/** Format distance in km */
export const formatDistance = (km) => {
  if (!km) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
};

/** Time ago string */
export const timeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Truncate text */
export const truncateText = (text, maxLength = 80) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
};

/** Generate initials from name */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/** Skill badge colors */
export const SKILL_COLORS = {
  construction: 'bg-amber-100 text-amber-800',
  electrician: 'bg-yellow-100 text-yellow-800',
  plumber: 'bg-blue-100 text-blue-800',
  driver: 'bg-indigo-100 text-indigo-800',
  cleaner: 'bg-green-100 text-green-800',
  helper: 'bg-gray-100 text-gray-700',
  painter: 'bg-purple-100 text-purple-800',
  welder: 'bg-red-100 text-red-800',
  carpenter: 'bg-orange-100 text-orange-800',
  cook: 'bg-pink-100 text-pink-800',
};

export const getSkillColor = (skill) =>
  SKILL_COLORS[skill?.toLowerCase()] || 'bg-surface-100 text-surface-700';

/** All available skills */
export const ALL_SKILLS = [
  'Construction', 'Electrician', 'Plumber', 'Driver', 'Cleaner',
  'Helper', 'Painter', 'Welder', 'Carpenter', 'Cook',
  'Mason', 'Gardener', 'Security', 'Tailor', 'Mechanic',
];

/** Work type labels */
export const WORK_TYPE_LABELS = {
  daily: 'Daily',
  contract: 'Contract',
  instant: 'Instant',
  both: 'Any',
};

/** Status badge styles */
export const STATUS_STYLES = {
  open: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-600',
};
