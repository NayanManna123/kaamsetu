import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Lock, 
  Shield, 
  Wallet, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Briefcase, 
  Building2, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  AlertCircle,
  Plus,
  X,
  CreditCard,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { settingsAPI } from '../../api/endpoints';
import { ALL_SKILLS, getSkillColor, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AVATAR_PRESETS = [
  { name: 'Worker Boy 1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Rajesh' },
  { name: 'Worker Girl 1', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Pooja' },
  { name: 'Worker Boy 2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Amit' },
  { name: 'Worker Girl 2', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Neha' },
  { name: 'Employer 1', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BuildRight' },
  { name: 'Employer 2', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Company' },
];

const LANGUAGES = [
  { code: 'en', label: 'English', subLabel: 'English' },
  { code: 'hi', label: 'हिन्दी', subLabel: 'Hindi' },
  { code: 'gu', label: 'ગુજરાતી', subLabel: 'Gujarati' },
];

const FAQS = [
  {
    q: 'How do I find daily work?',
    a: 'Go to the "Search Jobs" section on the menu. You can view open daily jobs and apply instantly. Employers will view your profile and contact you directly.'
  },
  {
    q: 'How do payments work in KaamSetu?',
    a: 'Payments are settled directly between you and the employer. They can pay you via cash, UPI, or bank transfer. You can add your payment details in the settings to share them with employers.'
  },
  {
    q: 'What is the "Available Now" toggle?',
    a: 'Turning on "Available Now" alerts employers in your city that you are looking for work immediately today. This increases your chances of getting hired for urgent jobs.'
  },
  {
    q: 'What is the Trust Score and reliability?',
    a: 'The trust score is a rating based on your attendance and job completions. Arriving on time and completing work successfully keeps your score high.'
  }
];

const SettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  
  // Responsive design: activeSection can be null on mobile (showing list of links)
  const [activeSection, setActiveSection] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form values
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    avatar: '',
    workerProfile: {
      skills: [],
      experience: 0,
      availability: 'available',
      isInstantAvailable: false,
      expectedWage: 0,
      bio: '',
    },
    companyProfile: {
      companyName: '',
      businessType: '',
      description: '',
    }
  });

  const [notificationForm, setNotificationForm] = useState({
    push: true,
    sms: false,
    jobAlerts: true,
    hireRequests: true,
  });

  const [language, setLanguage] = useState('en');

  const [paymentForm, setPaymentForm] = useState({
    upiId: '',
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    }
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [reportForm, setReportForm] = useState({
    subject: '',
    message: '',
  });

  // Track screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, auto-select 'profile' if none is active
      if (!mobile && !activeSection) {
        setActiveSection('profile');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // trigger initial layout

    return () => window.removeEventListener('resize', handleResize);
  }, [activeSection]);

  // Fetch settings from DB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await settingsAPI.getUserSettings();
        if (response.data?.success) {
          const { user: dbUser, settings } = response.data.data;
          
          // Map user profile details
          setProfileForm({
            name: dbUser.name || '',
            phone: dbUser.phone || '',
            avatar: dbUser.avatar || '',
            workerProfile: {
              skills: dbUser.workerProfile?.skills || [],
              experience: dbUser.workerProfile?.experience || 0,
              availability: dbUser.workerProfile?.availability || 'available',
              isInstantAvailable: dbUser.workerProfile?.isInstantAvailable || false,
              expectedWage: dbUser.workerProfile?.expectedWage || 0,
              bio: dbUser.workerProfile?.bio || '',
            },
            companyProfile: {
              companyName: dbUser.companyProfile?.companyName || '',
              businessType: dbUser.companyProfile?.businessType || '',
              description: dbUser.companyProfile?.description || '',
            }
          });

          // Map settings preferences
          if (settings) {
            setNotificationForm({
              push: settings.notifications?.push ?? true,
              sms: settings.notifications?.sms ?? false,
              jobAlerts: settings.notifications?.jobAlerts ?? true,
              hireRequests: settings.notifications?.hireRequests ?? true,
            });
            setLanguage(settings.language || 'en');
            setPaymentForm({
              upiId: settings.upiId || '',
              bankDetails: {
                accountNumber: settings.bankDetails?.accountNumber || '',
                ifscCode: settings.bankDetails?.ifscCode || '',
                bankName: settings.bankDetails?.bankName || '',
              }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Update Settings handler
  const handleSave = async (section) => {
    setSaving(true);
    let payload = {};

    if (section === 'profile') {
      payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        avatar: profileForm.avatar,
        workerProfile: user.role === 'worker' ? profileForm.workerProfile : undefined,
        companyProfile: user.role === 'company' ? profileForm.companyProfile : undefined,
      };
    } else if (section === 'notifications') {
      payload = { notifications: notificationForm };
    } else if (section === 'language') {
      payload = { language };
    } else if (section === 'payments') {
      payload = {
        upiId: paymentForm.upiId,
        bankDetails: paymentForm.bankDetails,
      };
    } else if (section === 'security') {
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        toast.error('New passwords do not match');
        setSaving(false);
        return;
      }
      payload = {
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      };
    }

    try {
      const response = await settingsAPI.updateUserSettings(payload);
      if (response.data?.success) {
        toast.success('Settings saved successfully!');
        
        // Update user context with the returned user profile details
        if (response.data.data?.user) {
          updateUser(response.data.data.user);
        }

        // Clear security fields if updated
        if (section === 'security') {
          setSecurityForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      }
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!reportForm.subject || !reportForm.message) {
      toast.error('Please fill out all fields');
      return;
    }
    toast.success('Support team notified! We will contact you soon.');
    setReportForm({ subject: '', message: '' });
  };

  // Toggle skills in worker profile
  const handleToggleSkill = (skill) => {
    const lowerSkill = skill.toLowerCase();
    setProfileForm(prev => {
      const currentSkills = prev.workerProfile.skills;
      const updatedSkills = currentSkills.includes(lowerSkill)
        ? currentSkills.filter(s => s !== lowerSkill)
        : [...currentSkills, lowerSkill];
      
      return {
        ...prev,
        workerProfile: {
          ...prev.workerProfile,
          skills: updatedSkills
        }
      };
    });
  };

  // Menu Options configuration
  const menuOptions = [
    { id: 'profile', label: 'Profile Settings', icon: User, desc: 'Manage your name, phone, skills & business details' },
    ...(user?.role === 'worker' ? [{ id: 'availability', label: 'Availability & Wages', icon: Briefcase, desc: 'Set availability and expected daily pay' }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Manage SMS alerts, push updates and hire alerts' },
    { id: 'payments', label: 'Payment Details', icon: Wallet, desc: 'UPI ID, bank account information, wallet balance' },
    { id: 'language', label: 'App Language', icon: Globe, desc: 'Switch app language (English, हिन्दी, ગુજરાતી)' },
    { id: 'security', label: 'Privacy & Security', icon: Shield, desc: 'Change password and account verification status' },
    { id: 'support', label: 'Help & Support', icon: HelpCircle, desc: 'FAQs, contact support, raise support tickets' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-surface-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDERING COMPONENT PANELS ====================

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="border-b border-surface-100 pb-4">
        <h3 className="text-lg font-bold text-surface-900">Profile Settings</h3>
        <p className="text-xs text-surface-500">Update your basic profile details below.</p>
      </div>

      {/* Avatar Presets Selection */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Choose Profile Avatar</label>
        <div className="flex items-center gap-4 flex-wrap bg-surface-50 p-4 rounded-2xl border border-surface-100">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 border border-primary-200 overflow-hidden flex items-center justify-center flex-shrink-0">
            {profileForm.avatar ? (
              <img src={profileForm.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary-600">?</span>
            )}
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <p className="text-xs font-medium text-surface-500">Select a friendly avatar preset:</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, avatar: preset.url })}
                  className={`w-9 h-9 rounded-xl border-2 transition-all overflow-hidden bg-white ${
                    profileForm.avatar === preset.url ? 'border-primary-500 scale-105' : 'border-surface-200 hover:border-surface-300'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Profile Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            className="input-field"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            className="input-field"
            placeholder="Enter phone number"
          />
        </div>
      </div>

      {/* Worker Details Edit */}
      {user.role === 'worker' && (
        <div className="space-y-4 pt-4 border-t border-surface-100">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Bio / Description</label>
            <textarea
              value={profileForm.workerProfile.bio}
              onChange={(e) => setProfileForm({
                ...profileForm,
                workerProfile: { ...profileForm.workerProfile, bio: e.target.value }
              })}
              className="input-field h-24 resize-none"
              placeholder="Tell companies about your experience and skills..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-2">My Work Skills</label>
            <div className="flex flex-wrap gap-2 p-4 bg-surface-50 border border-surface-100 rounded-2xl">
              {ALL_SKILLS.map((skill) => {
                const isSelected = profileForm.workerProfile.skills.includes(skill.toLowerCase());
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-95 ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-surface-600 border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5 text-surface-400" />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Company Details Edit */}
      {user.role === 'company' && (
        <div className="space-y-4 pt-4 border-t border-surface-100">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Company Name</label>
            <input
              type="text"
              value={profileForm.companyProfile.companyName}
              onChange={(e) => setProfileForm({
                ...profileForm,
                companyProfile: { ...profileForm.companyProfile, companyName: e.target.value }
              })}
              className="input-field"
              placeholder="Enter official company name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Business Type</label>
            <input
              type="text"
              value={profileForm.companyProfile.businessType}
              onChange={(e) => setProfileForm({
                ...profileForm,
                companyProfile: { ...profileForm.companyProfile, businessType: e.target.value }
              })}
              className="input-field"
              placeholder="e.g. Construction, Agriculture, Catering"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Company Description</label>
            <textarea
              value={profileForm.companyProfile.description}
              onChange={(e) => setProfileForm({
                ...profileForm,
                companyProfile: { ...profileForm.companyProfile, description: e.target.value }
              })}
              className="input-field h-24 resize-none"
              placeholder="Describe your company and hiring requirements..."
            />
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave('profile')}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {saving ? 'Saving...' : 'Save Profile Settings'}
      </button>
    </div>
  );

  const renderAvailabilitySettings = () => (
    <div className="space-y-6">
      <div className="border-b border-surface-100 pb-4">
        <h3 className="text-lg font-bold text-surface-900">Availability & Wages</h3>
        <p className="text-xs text-surface-500">Configure your work availability status and daily wage expectations.</p>
      </div>

      {/* Available Now Glow Banner Toggle */}
      <div className="p-5 bg-white border border-surface-200 rounded-3xl shadow-sm flex items-center justify-between gap-4 relative overflow-hidden">
        {profileForm.workerProfile.isInstantAvailable && (
          <div className="absolute inset-0 bg-green-500/5 available-now-glow pointer-events-none" />
        )}
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h4 className="text-md font-bold text-surface-900">Available Now Mode</h4>
          </div>
          <p className="text-xs text-surface-500">Shows a green light to employers for immediate hiring requests today.</p>
        </div>
        <button
          type="button"
          onClick={() => setProfileForm({
            ...profileForm,
            workerProfile: {
              ...profileForm.workerProfile,
              isInstantAvailable: !profileForm.workerProfile.isInstantAvailable
            }
          })}
          className={`w-14 h-8 rounded-full p-1 transition-all duration-300 z-10 flex items-center ${
            profileForm.workerProfile.isInstantAvailable ? 'bg-green-500 justify-end' : 'bg-surface-300 justify-start'
          }`}
        >
          <motion.div layout className="w-6 h-6 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Expected Daily Wage */}
      <div>
        <label className="block text-sm font-semibold text-surface-700 mb-1.5">Expected Daily Wage (₹)</label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-surface-400 font-semibold">₹</span>
          <input
            type="number"
            value={profileForm.workerProfile.expectedWage || ''}
            onChange={(e) => setProfileForm({
              ...profileForm,
              workerProfile: { ...profileForm.workerProfile, expectedWage: parseInt(e.target.value) || 0 }
            })}
            className="input-field pl-8"
            placeholder="e.g. 500"
          />
        </div>
        <p className="text-[10px] text-surface-400 mt-1">Average wages range between ₹400 - ₹900 per day.</p>
      </div>

      {/* General Availability Period */}
      <div>
        <label className="block text-sm font-semibold text-surface-700 mb-2">Availability Duration</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { key: 'available', label: 'Generally Available' },
            { key: 'today', label: 'Only Today' },
            { key: 'this_week', label: 'This Week' },
            { key: 'unavailable', label: 'Unavailable' }
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setProfileForm({
                ...profileForm,
                workerProfile: { ...profileForm.workerProfile, availability: key }
              })}
              className={`p-3.5 rounded-2xl text-xs font-bold border capitalize transition-all text-center flex items-center justify-center active:scale-95 ${
                profileForm.workerProfile.availability === key
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-surface-50 text-surface-600 border-surface-200 hover:border-surface-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave('profile')}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {saving ? 'Saving...' : 'Save Availability settings'}
      </button>
    </div>
  );

  const renderNotificationSettings = () => {
    const toggleField = (field) => {
      setNotificationForm({ ...notificationForm, [field]: !notificationForm[field] });
    };

    const notificationToggles = [
      { key: 'push', label: 'Push Notifications', desc: 'Receive instant notifications in the browser' },
      { key: 'sms', label: 'SMS Alerts', desc: 'Receive daily job and verification updates via text SMS' },
      { key: 'jobAlerts', label: 'New Job Recommendations', desc: 'Alerts matching your profile skills and location' },
      { key: 'hireRequests', label: 'Employer Hire Requests', desc: 'Get notified immediately when a company requests to hire you' }
    ];

    return (
      <div className="space-y-6">
        <div className="border-b border-surface-100 pb-4">
          <h3 className="text-lg font-bold text-surface-900">Notification Settings</h3>
          <p className="text-xs text-surface-500">Configure how you would like to be alerted about jobs, requests, and news.</p>
        </div>

        <div className="space-y-4">
          {notificationToggles.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-surface-50 border border-surface-100 rounded-2xl gap-4">
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-surface-900">{label}</h4>
                <p className="text-xs text-surface-500 max-w-sm">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleField(key)}
                className={`w-12 h-7 rounded-full p-0.5 transition-all duration-200 flex items-center flex-shrink-0 ${
                  notificationForm[key] ? 'bg-primary-600 justify-end' : 'bg-surface-300 justify-start'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave('notifications')}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    );
  };

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="border-b border-surface-100 pb-4">
        <h3 className="text-lg font-bold text-surface-900">Payment Details</h3>
        <p className="text-xs text-surface-500">Enter UPI or bank account info so employers can transfer wages smoothly.</p>
      </div>

      {/* Wallet Balance Display */}
      <div className="p-6 gradient-primary rounded-3xl text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[120px]">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
          <Wallet className="w-40 h-40 transform translate-x-10 translate-y-10" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">Current Wallet Balance</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold">{formatCurrency(user.wallet?.balance || 0)}</span>
          <span className="text-xs font-medium text-primary-100">{user.wallet?.currency || 'INR'}</span>
        </div>
        <p className="text-[10px] text-primary-100 mt-4">Earnings will settle directly to your configured bank details.</p>
      </div>

      {/* UPI Details */}
      <div className="space-y-4">
        <h4 className="font-bold text-sm text-surface-850 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary-500" />
          UPI Settings
        </h4>
        <div>
          <label className="block text-sm font-semibold text-surface-700 mb-1.5">UPI ID (VPA)</label>
          <input
            type="text"
            value={paymentForm.upiId}
            onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
            className="input-field"
            placeholder="e.g. mobile@upi, name@okaxis"
          />
        </div>
      </div>

      {/* Bank Account Details */}
      <div className="space-y-4 pt-4 border-t border-surface-100">
        <h4 className="font-bold text-sm text-surface-850 flex items-center gap-2">
          <Building className="w-4 h-4 text-primary-500" />
          Bank Account Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Bank Name</label>
            <input
              type="text"
              value={paymentForm.bankDetails.bankName}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                bankDetails: { ...paymentForm.bankDetails, bankName: e.target.value }
              })}
              className="input-field"
              placeholder="e.g. State Bank of India"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">IFSC Code</label>
            <input
              type="text"
              value={paymentForm.bankDetails.ifscCode}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                bankDetails: { ...paymentForm.bankDetails, ifscCode: e.target.value.toUpperCase() }
              })}
              className="input-field"
              placeholder="e.g. SBIN0001234"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Account Number</label>
            <input
              type="text"
              value={paymentForm.bankDetails.accountNumber}
              onChange={(e) => setPaymentForm({
                ...paymentForm,
                bankDetails: { ...paymentForm.bankDetails, accountNumber: e.target.value }
              })}
              className="input-field"
              placeholder="Enter bank account number"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave('payments')}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {saving ? 'Saving...' : 'Save Bank Details'}
      </button>
    </div>
  );

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div className="border-b border-surface-100 pb-4">
        <h3 className="text-lg font-bold text-surface-900">App Language</h3>
        <p className="text-xs text-surface-500">Choose your preferred language for the application interface.</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`p-5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 active:scale-[0.99] ${
              language === lang.code
                ? 'border-primary-500 bg-primary-50/50 text-primary-900 ring-2 ring-primary-500/20'
                : 'border-surface-200 hover:border-surface-300 text-surface-700'
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-md font-bold">{lang.label}</p>
              <p className="text-xs text-surface-500">{lang.subLabel}</p>
            </div>
            {language === lang.code && (
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center shadow-sm">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave('language')}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {saving ? 'Saving...' : 'Save Language Setting'}
      </button>
    </div>
  );

  const renderPrivacySecurity = () => (
    <div className="space-y-6">
      <div className="border-b border-surface-100 pb-4">
        <h3 className="text-lg font-bold text-surface-900">Privacy & Security</h3>
        <p className="text-xs text-surface-500">Configure your account security and verify your verification status.</p>
      </div>

      {/* Account Verification Status */}
      <div className="p-4 bg-surface-50 border border-surface-100 rounded-2xl flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-surface-900">Verification Status</h4>
          <p className="text-xs text-surface-500">Verified status helps you get hired faster and gain trust.</p>
        </div>
        <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
          user.isVerified 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-amber-100 text-amber-700 border border-amber-200'
        }`}>
          {user.isVerified ? '✅ Verified Profile' : '⏳ Verification Pending'}
        </span>
      </div>

      {/* Change Password Form */}
      <div className="space-y-4 pt-4 border-t border-surface-100">
        <h4 className="font-bold text-sm text-surface-850 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-500" />
          Change Password
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={securityForm.currentPassword}
              onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={securityForm.newPassword}
              onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={securityForm.confirmPassword}
              onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
              className="input-field"
              placeholder="Re-type new password"
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave('security')}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        {saving ? 'Updating...' : 'Change Password'}
      </button>

      {/* Session management */}
      <div className="pt-6 border-t border-surface-100 space-y-3">
        <h4 className="font-bold text-sm text-surface-850 flex items-center gap-2 text-danger-600">
          <AlertCircle className="w-4 h-4" />
          Danger Zone
        </h4>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-danger-200 bg-danger-50/20 rounded-2xl">
          <div className="space-y-0.5">
            <h5 className="text-sm font-semibold text-surface-900">Logout from other devices</h5>
            <p className="text-xs text-surface-500">Sign out of all other computers or phones you use KaamSetu on.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              toast.success('Logged out from all other sessions!');
            }}
            className="px-4 py-2 border border-danger-300 hover:bg-danger-50 text-danger-600 font-bold text-xs rounded-xl active:scale-95 transition-all"
          >
            Logout Other Devices
          </button>
        </div>
      </div>
    </div>
  );

  const renderHelpSupport = () => {
    return (
      <div className="space-y-6">
        <div className="border-b border-surface-100 pb-4">
          <h3 className="text-lg font-bold text-surface-900">Help & Support</h3>
          <p className="text-xs text-surface-500">Find answers or report an issue directly to our customer care team.</p>
        </div>

        {/* FAQs */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Frequently Asked Questions</h4>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <details key={i} className="group bg-surface-50 border border-surface-100 rounded-2xl p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h5 className="text-sm font-semibold text-surface-900">{faq.q}</h5>
                  <span className="text-surface-400 group-open:rotate-180 transition-transform duration-200">
                    <ChevronRight className="w-4 h-4 transform rotate-90" />
                  </span>
                </summary>
                <p className="mt-2.5 text-xs text-surface-600 leading-relaxed border-t border-surface-100 pt-2.5">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>

        {/* Contact details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-surface-100 bg-surface-50/50 rounded-2xl">
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Customer Support Phone</h5>
            <p className="text-md font-bold text-primary-600">+91 98765 43210</p>
            <p className="text-[10px] text-surface-400">Available 9:00 AM - 6:00 PM</p>
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Support Email</h5>
            <p className="text-md font-bold text-primary-600">help@kaamsetu.org</p>
            <p className="text-[10px] text-surface-400">Response within 24 hours</p>
          </div>
        </div>

        {/* Report an Issue Form */}
        <form onSubmit={handleReportSubmit} className="space-y-4 pt-4 border-t border-surface-100">
          <h4 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Report an Issue</h4>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={reportForm.subject}
              onChange={(e) => setReportForm({ ...reportForm, subject: e.target.value })}
              className="input-field"
              placeholder="e.g. Payment Issue, App Bug, Profile Error"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-surface-700 mb-1.5">Explain Issue</label>
            <textarea
              value={reportForm.message}
              onChange={(e) => setReportForm({ ...reportForm, message: e.target.value })}
              className="input-field h-28 resize-none"
              placeholder="Provide details about the problem you are experiencing..."
            />
          </div>
          <button type="submit" className="w-full btn-primary">
            Send Support Request
          </button>
        </form>
      </div>
    );
  };

  const renderActivePanel = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSettings();
      case 'availability':
        return renderAvailabilitySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'payments':
        return renderPaymentSettings();
      case 'language':
        return renderLanguageSettings();
      case 'security':
        return renderPrivacySecurity();
      case 'support':
        return renderHelpSupport();
      default:
        return null;
    }
  };

  // ==================== MAIN COMPONENT RENDER ====================

  return (
    <div className="space-y-4 max-w-5xl mx-auto min-h-[500px]">
      {/* Title Header */}
      <div className="flex items-center gap-3">
        {isMobile && activeSection && (
          <button
            onClick={() => setActiveSection(null)}
            className="p-2 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-surface-600" />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Settings</h2>
          <p className="text-xs text-surface-500">Configure your KaamSetu app preferences and details.</p>
        </div>
      </div>

      {/* Main Dual Layout Container */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: Categories Menu */}
        {/* On mobile: Hide if activeSection is set, show if null. On desktop: always show */}
        {(!isMobile || !activeSection) && (
          <div className="w-full lg:w-1/3 space-y-4 flex-shrink-0">
            <div className="bg-white border border-surface-100 rounded-3xl p-4 shadow-card space-y-1">
              {menuOptions.map((opt) => {
                const Icon = opt.icon;
                const isActive = activeSection === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveSection(opt.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all text-left ${
                      isActive && !isMobile
                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                        : 'text-surface-700 hover:bg-surface-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                        isActive && !isMobile ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-500'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-surface-900">{opt.label}</p>
                        <p className="text-[10px] text-surface-400 max-w-[200px] truncate">{opt.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-400" />
                  </button>
                );
              })}

              {/* Log out option */}
              <div className="border-t border-surface-100 pt-3 mt-3">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-danger-600 hover:bg-danger-50 transition-colors text-left"
                >
                  <div className="p-2.5 rounded-xl bg-danger-50 text-danger-600 flex items-center justify-center">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900">Sign Out</p>
                    <p className="text-[10px] text-surface-400">Log out of your KaamSetu account</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: Edit Panel */}
        {/* On mobile: Hide if activeSection is null, show if set. On desktop: always show */}
        {(!isMobile || activeSection) && (
          <div className="w-full lg:w-2/3">
            <AnimatePresence mode="wait">
              {activeSection ? (
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: isMobile ? 20 : 0, y: isMobile ? 0 : 5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: isMobile ? -20 : 0, y: isMobile ? 0 : -5 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-surface-100 rounded-3xl p-6 md:p-8 shadow-card"
                >
                  {renderActivePanel()}
                </motion.div>
              ) : (
                <div className="hidden lg:flex items-center justify-center h-full bg-white/50 border border-dashed border-surface-200 rounded-3xl p-12 text-center">
                  <div className="space-y-2">
                    <User className="w-12 h-12 text-surface-300 mx-auto" />
                    <h3 className="font-bold text-surface-900">Select a section</h3>
                    <p className="text-sm text-surface-400">Choose a settings category from the left menu to view or edit details.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
