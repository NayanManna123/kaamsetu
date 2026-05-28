import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Star, Award, Edit3, Save, Briefcase, TrendingUp, ShieldCheck, AlertTriangle, CheckCircle2, BarChart3, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ALL_SKILLS, getSkillColor, formatCurrency } from '../../utils/helpers';
import StarRating from '../../components/StarRating';
import toast from 'react-hot-toast';

/**
 * Trust Indicator Progress Bar
 * Visual progress bar for worker metrics
 */
const TrustBar = ({ label, value, maxValue = 100, icon: Icon, color = 'primary', suffix = '%' }) => {
  const percent = Math.min((value / maxValue) * 100, 100);
  const colorMap = {
    primary: { bg: 'bg-primary-100', fill: 'bg-primary-500', text: 'text-primary-700' },
    success: { bg: 'bg-green-100', fill: 'bg-green-500', text: 'text-green-700' },
    warning: { bg: 'bg-amber-100', fill: 'bg-amber-500', text: 'text-amber-700' },
    danger: { bg: 'bg-red-100', fill: 'bg-red-500', text: 'text-red-700' },
  };
  const c = colorMap[color] || colorMap.primary;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-surface-700">
          {Icon && <Icon className="w-4 h-4 text-surface-400" />}
          {label}
        </span>
        <span className={`text-sm font-bold ${c.text}`}>
          {value}{suffix}
        </span>
      </div>
      <div className={`h-2 rounded-full ${c.bg} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${c.fill}`}
        />
      </div>
    </div>
  );
};

const WorkerProfile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const profile = user?.workerProfile || {};

  const [form, setForm] = useState({
    name: user?.name || '',
    bio: profile.bio || '',
    expectedWage: profile.expectedWage || 0,
    experience: profile.experience || 0,
    preferredWorkType: profile.preferredWorkType || 'both',
    availability: profile.availability || 'available',
    skills: profile.skills || [],
  });

  const toggleSkill = (skill) => {
    const lower = skill.toLowerCase();
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(lower)
        ? prev.skills.filter((s) => s !== lower)
        : [...prev.skills, lower],
    }));
  };

  const handleSave = () => {
    updateUser({
      name: form.name,
      workerProfile: {
        ...profile,
        bio: form.bio,
        expectedWage: form.expectedWage,
        experience: form.experience,
        preferredWorkType: form.preferredWorkType,
        availability: form.availability,
        skills: form.skills,
      },
    });
    setEditing(false);
    toast.success('Profile updated!');
  };

  // Compute trust level
  const reliabilityScore = profile.reliabilityScore ?? 100;
  const completionRate = profile.completionRate ?? (profile.attendanceRate || 0);
  const cancellationRate = profile.cancellationRate ?? 0;
  const trustLevel = reliabilityScore >= 90 ? 'Excellent' : reliabilityScore >= 75 ? 'Good' : reliabilityScore >= 50 ? 'Average' : 'Needs Improvement';
  const trustColor = reliabilityScore >= 90 ? 'success' : reliabilityScore >= 75 ? 'primary' : reliabilityScore >= 50 ? 'warning' : 'danger';

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-surface-100 p-6 shadow-card text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg">
            {user?.name?.[0] || 'W'}
          </div>

          {user?.isVerified && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600">Verified Worker</span>
            </div>
          )}

          <h2 className="text-xl font-bold text-surface-900">{user?.name}</h2>
          <p className="text-sm text-surface-500">{user?.phone}</p>

          <div className="flex items-center justify-center gap-1 mt-2">
            <StarRating rating={user?.rating || 0} size="md" />
            <span className="text-sm font-semibold text-surface-700 ml-1">{user?.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs text-surface-400">({user?.ratingCount || 0} reviews)</span>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-surface-50 rounded-xl py-2">
              <p className="text-lg font-bold text-primary-600">{profile.completedJobs || 0}</p>
              <p className="text-[10px] text-surface-400">Jobs Done</p>
            </div>
            <div className="bg-surface-50 rounded-xl py-2">
              <p className="text-lg font-bold text-success-500">{formatCurrency(profile.expectedWage || 0)}</p>
              <p className="text-[10px] text-surface-400">Daily Wage</p>
            </div>
            <div className="bg-surface-50 rounded-xl py-2">
              <p className="text-lg font-bold text-accent-600">{profile.experience || 0}yr</p>
              <p className="text-[10px] text-surface-400">Experience</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trust Indicators Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-surface-100 p-5 shadow-card space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-surface-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-500" />
            Trust Score
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            trustColor === 'success' ? 'bg-green-100 text-green-700' :
            trustColor === 'primary' ? 'bg-primary-100 text-primary-700' :
            trustColor === 'warning' ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>
            {trustLevel}
          </span>
        </div>

        <TrustBar
          label="Reliability Score"
          value={reliabilityScore}
          icon={ShieldCheck}
          color={reliabilityScore >= 85 ? 'success' : reliabilityScore >= 60 ? 'warning' : 'danger'}
        />
        <TrustBar
          label="Completion Rate"
          value={completionRate}
          icon={CheckCircle2}
          color={completionRate >= 90 ? 'success' : completionRate >= 70 ? 'warning' : 'danger'}
        />
        <TrustBar
          label="Attendance Rate"
          value={profile.attendanceRate || 0}
          icon={Target}
          color={(profile.attendanceRate || 0) >= 90 ? 'success' : 'warning'}
        />
        <TrustBar
          label="Cancellation Rate"
          value={cancellationRate}
          icon={AlertTriangle}
          color={cancellationRate <= 5 ? 'success' : cancellationRate <= 15 ? 'warning' : 'danger'}
          suffix="%"
        />
      </motion.div>

      {/* Edit Toggle */}
      <div className="flex justify-end">
        {editing ? (
          <button onClick={handleSave} className="btn-primary text-sm py-2 px-4 flex items-center gap-1">
            <Save className="w-4 h-4" /> Save Changes
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-outline text-sm py-2 px-4 flex items-center gap-1">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {/* Skills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card"
      >
        <h3 className="font-semibold text-surface-900 mb-3">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            ALL_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  form.skills.includes(skill.toLowerCase()) ? 'bg-primary-600 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {skill}
              </button>
            ))
          ) : (
            (profile.skills || []).map((skill) => (
              <span key={skill} className={`px-3 py-1.5 rounded-full text-xs font-medium ${getSkillColor(skill)}`}>
                {skill}
              </span>
            ))
          )}
          {!editing && (!profile.skills || profile.skills.length === 0) && (
            <p className="text-sm text-surface-400">No skills added yet</p>
          )}
        </div>
      </motion.div>

      {/* Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-4"
      >
        <h3 className="font-semibold text-surface-900">Details</h3>

        {editing ? (
          <>
            <div>
              <label className="text-sm font-medium text-surface-600 mb-1 block">Expected Daily Wage (₹)</label>
              <input type="number" value={form.expectedWage} onChange={(e) => setForm({ ...form, expectedWage: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-600 mb-1 block">Experience (years)</label>
              <input type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: parseInt(e.target.value) || 0 })} className="input-field" />
            </div>
            <div>
              <label className="text-sm font-medium text-surface-600 mb-1 block">Preferred Work Type</label>
              <div className="flex gap-2">
                {['daily', 'contract', 'both'].map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, preferredWorkType: t })} className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize ${form.preferredWorkType === t ? 'bg-primary-600 text-white' : 'bg-surface-50 text-surface-600'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-surface-600 mb-1 block">Bio</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input-field resize-none" />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-sm text-surface-500">Expected Wage</span>
              <span className="text-sm font-semibold text-surface-900">{formatCurrency(profile.expectedWage)}/day</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-sm text-surface-500">Work Type</span>
              <span className="text-sm font-semibold text-surface-900 capitalize">{profile.preferredWorkType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-sm text-surface-500">Availability</span>
              <span className="text-sm font-semibold text-green-600 capitalize">{profile.availability?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-surface-50">
              <span className="text-sm text-surface-500">Location</span>
              <span className="text-sm font-semibold text-surface-900">{user?.location?.city || 'Not set'}</span>
            </div>
            {profile.bio && <p className="text-sm text-surface-600 pt-2">{profile.bio}</p>}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default WorkerProfile;
