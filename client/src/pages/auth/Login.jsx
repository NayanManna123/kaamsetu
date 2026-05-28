import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  Lock, 
  Briefcase, 
  ArrowRight, 
  Zap, 
  User, 
  UserPlus, 
  LogIn, 
  Mail,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const Login = () => {
  const { login, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('worker');

  // Verification Screen States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState('');
  const [verifyingPhone, setVerifyingPhone] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Cooldown countdown timers
  useEffect(() => {
    let timer;
    if (emailCooldown > 0) {
      timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCooldown]);

  useEffect(() => {
    let timer;
    if (phoneCooldown > 0) {
      timer = setTimeout(() => setCooldownPhone(phoneCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCooldown]);

  const setCooldownEmail = (seconds) => setEmailCooldown(seconds);
  const setCooldownPhone = (seconds) => setPhoneCooldown(seconds);

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setPassword('');
    setName('');
    setRole('worker');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const { authAPI } = await import('../../api/endpoints');
      const res = await authAPI.login({ email, password });
      login(res.data.data, res.data.data.token);
      toast.success('Welcome back!');
    } catch (err) {
      const errorData = err?.response?.data;
      // Check if user is blocked due to unverified email/phone
      if (err?.response?.status === 400 && errorData && errorData.email && errorData.phone) {
        toast.error(errorData.message || 'Please verify your account.');
        setVerifyingEmail(errorData.email);
        setVerifyingPhone(errorData.phone);
        setEmailVerified(errorData.isEmailVerified);
        setPhoneVerified(errorData.isPhoneVerified);
        setIsVerifying(true);
        // Reset inputs
        setEmailOtp('');
        setPhoneOtp('');
      } else {
        toast.error(err?.response?.data?.message || 'Invalid credentials. Try demo accounts.');
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { authAPI } = await import('../../api/endpoints');
      const res = await authAPI.register({ name, email, phone, password, role });
      
      // Successfully registered. Switch to OTP screen.
      toast.success('OTPs sent successfully!');
      setVerifyingEmail(email);
      setVerifyingPhone(phone);
      setEmailVerified(false);
      setPhoneVerified(false);
      setIsVerifying(true);
      
      // Auto-fill OTPs in development mode
      if (res.data?.devOtp) {
        setEmailOtp(res.data.devOtp.emailOtp || '');
        setPhoneOtp(res.data.devOtp.phoneOtp || '');
        toast('Sandbox Dev Tip: OTPs auto-filled!', { icon: '🔑' });
      } else {
        setEmailOtp('');
        setPhoneOtp('');
      }

      setCooldownEmail(60);
      setCooldownPhone(60);
    } catch (err) {
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
    setLoading(false);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (emailOtp.length !== 6) {
      toast.error('Please enter 6-digit email OTP');
      return;
    }
    setLoading(true);
    try {
      const { authAPI } = await import('../../api/endpoints');
      const res = await authAPI.verifyEmail({ email: verifyingEmail, otp: emailOtp });
      
      if (res.data?.success) {
        setEmailVerified(true);
        toast.success('Email verified successfully!');
        // If both verified, logging user in
        if (res.data.verified && res.data.data) {
          login(res.data.data, res.data.data.token);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to verify email. Try again.');
    }
    setLoading(false);
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (phoneOtp.length !== 6) {
      toast.error('Please enter 6-digit mobile OTP');
      return;
    }
    setLoading(true);
    try {
      const { authAPI } = await import('../../api/endpoints');
      const res = await authAPI.verifyPhone({ phone: verifyingPhone, otp: phoneOtp });
      
      if (res.data?.success) {
        setPhoneVerified(true);
        toast.success('Phone verified successfully!');
        // If both verified, logging user in
        if (res.data.verified && res.data.data) {
          login(res.data.data, res.data.data.token);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to verify mobile OTP. Try again.');
    }
    setLoading(false);
  };

  const handleResend = async (type) => {
    const target = type === 'email' ? verifyingEmail : verifyingPhone;
    try {
      const { authAPI } = await import('../../api/endpoints');
      const res = await authAPI.resendOtp({ target, type });
      toast.success(`New OTP sent to your ${type === 'email' ? 'email' : 'phone'}!`);
      
      if (res.data?.devOtp) {
        if (type === 'email') {
          setEmailOtp(res.data.devOtp);
        } else {
          setPhoneOtp(res.data.devOtp);
        }
        toast('Sandbox Dev Tip: New OTP auto-filled!', { icon: '🔑' });
      }

      if (type === 'email') {
        setCooldownEmail(60);
      } else {
        setCooldownPhone(60);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to resend OTP. Try again.');
    }
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    resetForm();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster position="top-center" />
      
      {/* Hero Section */}
      <div className="gradient-hero flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-white/5 rounded-full" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[200px] h-[200px] bg-white/5 rounded-full" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 relative z-10"
        >
          <div className="w-20 h-20 mx-auto mb-4 bg-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-md">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Kaam<span className="text-blue-200">Setu</span>
          </h1>
          <p className="text-blue-100 text-lg font-medium">
            Find Work. Hire Workers. Instantly.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Zap className="w-4 h-4 text-yellow-300 animate-pulse" fill="#FDE047" />
            <span className="text-blue-200 text-sm">Secure Dual Verification System</span>
          </div>
        </motion.div>

        {/* Form / Verification View Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            
            <AnimatePresence mode="wait">
              {isVerifying ? (
                /* ========== MULTI-STAGE OTP VERIFICATION VIEW ========== */
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setIsVerifying(false)}
                      className="p-1.5 hover:bg-surface-100 rounded-lg text-surface-500 transition-colors"
                      title="Back to login"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-surface-900">Verify Account</h2>
                      <p className="text-xs text-surface-450">Please complete the steps below</p>
                    </div>
                  </div>

                  {/* STEP 1: EMAIL VERIFICATION */}
                  <div className={`p-4 border rounded-2xl space-y-3 transition-colors ${
                    emailVerified ? 'border-success-200 bg-success-50/10' : 'border-surface-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Step 1</span>
                        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-primary-500" />
                          Verify Email Address
                        </h3>
                        <p className="text-xs text-surface-500 max-w-[220px] truncate">{verifyingEmail}</p>
                      </div>
                      
                      {emailVerified ? (
                        <span className="flex items-center gap-1 text-success-600 bg-success-50 px-2.5 py-1 rounded-full text-xs font-bold border border-success-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning-600 bg-warning-50 px-2.5 py-1 rounded-full text-xs font-bold border border-warning-200">
                          <ShieldAlert className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>

                    {!emailVerified && (
                      <form onSubmit={handleVerifyEmail} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            className="input-field text-center font-bold tracking-[8px] text-lg py-2 flex-grow"
                            maxLength={6}
                          />
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-4"
                          >
                            Verify
                          </button>
                        </div>
                        <div className="flex justify-end">
                          {emailCooldown > 0 ? (
                            <span className="text-[10px] text-surface-400 font-medium">Resend OTP in {emailCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResend('email')}
                              className="text-[10px] text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Resend OTP
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>

                  {/* STEP 2: MOBILE VERIFICATION */}
                  <div className={`p-4 border rounded-2xl space-y-3 transition-colors ${
                    phoneVerified ? 'border-success-200 bg-success-50/10' : 'border-surface-200 bg-white'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Step 2</span>
                        <h3 className="text-sm font-bold text-surface-900 flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-primary-500" />
                          Verify Phone Number
                        </h3>
                        <p className="text-xs text-surface-500">{verifyingPhone}</p>
                      </div>
                      
                      {phoneVerified ? (
                        <span className="flex items-center gap-1 text-success-600 bg-success-50 px-2.5 py-1 rounded-full text-xs font-bold border border-success-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-warning-600 bg-warning-50 px-2.5 py-1 rounded-full text-xs font-bold border border-warning-200">
                          <ShieldAlert className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </div>

                    {!phoneVerified && (
                      <form onSubmit={handleVerifyPhone} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                            className="input-field text-center font-bold tracking-[8px] text-lg py-2 flex-grow"
                            maxLength={6}
                          />
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-4"
                          >
                            Verify
                          </button>
                        </div>
                        <div className="flex justify-end">
                          {phoneCooldown > 0 ? (
                            <span className="text-[10px] text-surface-400 font-medium">Resend OTP in {phoneCooldown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResend('phone')}
                              className="text-[10px] text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Resend OTP
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>
                  
                  <p className="text-[10px] text-surface-400 text-center">
                    💡 <b>Sandbox Dev Tip</b>: Look inside the console log or the file <code>server/src/utils/otp_debug_logs.txt</code> to copy the OTP codes during local testing!
                  </p>
                </motion.div>
              ) : (
                /* ========== LOGIN / REGISTER FORM ========== */
                <motion.div
                  key="forms"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Toggle Tabs */}
                  <div className="flex bg-surface-100 rounded-2xl p-1 mb-2">
                    <button
                      type="button"
                      onClick={() => { if (isRegister) toggleMode(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        !isRegister
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-surface-400 hover:text-surface-600'
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { if (!isRegister) toggleMode(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isRegister
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-surface-400 hover:text-surface-600'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      Sign Up
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {!isRegister ? (
                      /* ========== SIGN IN VIEW ========== */
                      <motion.div
                        key="signin"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-surface-900 mb-1">Welcome Back</h2>
                          <p className="text-sm text-surface-450">Sign in with your email address</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="input-field pl-12 text-md"
                            />
                          </div>

                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="password"
                              placeholder="Password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="input-field pl-12 text-md"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full text-md py-3.5 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                Sign In
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </form>

                        {/* Demo login options */}
                        <div className="flex items-center gap-3 my-5">
                          <div className="flex-1 h-px bg-surface-150" />
                          <span className="text-[10px] text-surface-400 font-bold tracking-wider">OR TRY DEMO (VERIFIED)</span>
                          <div className="flex-1 h-px bg-surface-150" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => demoLogin('worker')}
                            className="py-3 px-4 rounded-xl border border-primary-200 bg-primary-50/50 text-primary-700 font-bold text-xs hover:bg-primary-100/50 transition-all active:scale-95 text-center"
                          >
                            👷 Worker Demo
                          </button>
                          <button
                            onClick={() => demoLogin('company')}
                            className="py-3 px-4 rounded-xl border border-accent-100 bg-accent-50/50 text-accent-700 font-bold text-xs hover:bg-accent-100/50 transition-all active:scale-95 text-center"
                          >
                            🏢 Company Demo
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* ========== SIGN UP VIEW ========== */
                      <motion.div
                        key="signup"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-surface-900 mb-1">Create Account</h2>
                          <p className="text-sm text-surface-450">Join today to get hired or recruit talent</p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                          {/* Name */}
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="input-field pl-12 text-md"
                              maxLength={100}
                            />
                          </div>

                          {/* Email */}
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="input-field pl-12 text-md"
                            />
                          </div>

                          {/* Phone */}
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="tel"
                              placeholder="Phone Number (10 digits)"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="input-field pl-12 text-md"
                              maxLength={10}
                            />
                          </div>

                          {/* Password */}
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                            <input
                              type="password"
                              placeholder="Password (min 6 chars)"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="input-field pl-12 text-md"
                              minLength={6}
                            />
                          </div>

                          {/* Role Selection */}
                          <div>
                            <p className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">I want to:</p>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setRole('worker')}
                                className={`py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${
                                  role === 'worker'
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                    : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300'
                                }`}
                              >
                                👷 Find Work
                              </button>
                              <button
                                type="button"
                                onClick={() => setRole('company')}
                                className={`py-3 px-4 rounded-xl border-2 font-bold text-xs transition-all active:scale-95 ${
                                  role === 'company'
                                    ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                                    : 'border-surface-200 bg-white text-surface-500 hover:border-surface-300'
                                }`}
                              >
                                🏢 Hire Workers
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full text-md py-3.5 flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                Create Account & Send OTPs
                                <ArrowRight className="w-5 h-5" />
                              </>
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            
          </div>

          <p className="text-center text-blue-200 text-[11px] mt-4">
            {isVerifying 
              ? 'Verification is required to active your account.' 
              : (isRegister 
                  ? 'Already have an account? Tap Sign In above' 
                  : 'Demo: Worker 9876543210 (or Login Rajesh Kumar email) / Company BuildRight email (pwd: 123456)')}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
