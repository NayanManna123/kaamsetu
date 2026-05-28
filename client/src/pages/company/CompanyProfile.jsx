import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Building2, MapPin, Award, Star, Edit3, Briefcase, Users } from 'lucide-react';
import StarRating from '../../components/StarRating';

const CompanyProfile = () => {
  const { user } = useAuth();
  const company = user?.companyProfile || {};

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-surface-100 p-6 shadow-card text-center relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative z-10">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white text-3xl mb-3 shadow-lg">
            <Building2 className="w-12 h-12" />
          </div>

          {company.verified && (
            <div className="flex items-center justify-center gap-1 mb-2">
              <Award className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600">Verified Company</span>
            </div>
          )}

          <h2 className="text-xl font-bold text-surface-900">{company.companyName || user?.name}</h2>
          <p className="text-sm text-surface-500">{company.businessType || 'Business'}</p>

          <div className="flex items-center justify-center gap-1 mt-2">
            <StarRating rating={user?.rating || 0} size="md" />
            <span className="text-sm font-semibold text-surface-700 ml-1">{user?.rating?.toFixed(1) || '0.0'}</span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-surface-50 rounded-xl py-3">
              <Briefcase className="w-5 h-5 text-primary-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-surface-900">{company.totalJobsPosted || 0}</p>
              <p className="text-[10px] text-surface-400">Jobs Posted</p>
            </div>
            <div className="bg-surface-50 rounded-xl py-3">
              <Users className="w-5 h-5 text-success-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-surface-900">{company.totalWorkersHired || 0}</p>
              <p className="text-[10px] text-surface-400">Workers Hired</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-surface-100 p-4 shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-surface-900">Company Details</h3>
          <button className="text-sm text-primary-600 font-medium flex items-center gap-1">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-surface-50">
            <span className="text-sm text-surface-500">Business Type</span>
            <span className="text-sm font-semibold text-surface-900">{company.businessType || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-50">
            <span className="text-sm text-surface-500">Phone</span>
            <span className="text-sm font-semibold text-surface-900">{user?.phone}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-surface-50">
            <span className="text-sm text-surface-500">Location</span>
            <span className="text-sm font-semibold text-surface-900 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {user?.location?.city || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-surface-500">Verification</span>
            <span className={`text-sm font-semibold ${company.verified ? 'text-green-600' : 'text-yellow-600'}`}>
              {company.verified ? '✅ Verified' : '⏳ Pending'}
            </span>
          </div>
        </div>
        {company.description && (
          <div className="pt-2 border-t border-surface-50">
            <p className="text-sm text-surface-600">{company.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfile;
