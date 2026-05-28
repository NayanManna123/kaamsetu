import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, Check, Settings, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    // Check if consent has already been granted
    const consent = localStorage.getItem('kaamsetu_cookie_consent');
    if (!consent) {
      // Delay showing the banner slightly for a better visual entry
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      accepted: true,
      essential: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('kaamsetu_cookie_consent', JSON.stringify(consentData));
    setVisible(false);
    toast.success('Cookies accepted!');
  };

  const handleSavePreferences = () => {
    const consentData = {
      accepted: true,
      essential: true,
      analytics: analyticsEnabled,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('kaamsetu_cookie_consent', JSON.stringify(consentData));
    setVisible(false);
    toast.success('Cookie preferences updated!');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="bg-surface-900/95 backdrop-blur-md border border-surface-800 text-white rounded-3xl p-6 shadow-glow-success md:shadow-card-hover space-y-4">
            
            {/* Header / Intro */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-success-500/10 rounded-2xl flex items-center justify-center flex-shrink-0 text-success-400">
                <Cookie className="w-6 h-6 animate-pulse-slow" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold tracking-tight">We use cookies!</h4>
                <p className="text-xs text-surface-300 leading-relaxed">
                  We use cookies to improve your experience. By continuing, you accept our use of cookies for essentials and analytics.
                </p>
              </div>
            </div>

            {/* Custom Preferences Panel */}
            {showPreferences && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-3 border-t border-surface-800 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-surface-400 uppercase tracking-wider">Cookie Preferences</span>
                  <button 
                    type="button" 
                    onClick={() => setShowPreferences(false)}
                    className="text-surface-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Essential Cookies */}
                  <div className="flex items-center justify-between p-3 bg-surface-950/40 rounded-xl border border-surface-800/50">
                    <div>
                      <p className="text-xs font-bold text-surface-200 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-primary-400" />
                        Essential Cookies
                      </p>
                      <p className="text-[10px] text-surface-400">Required for secure login and app navigation.</p>
                    </div>
                    <span className="px-2 py-1 bg-surface-800 text-surface-400 rounded-lg text-[9px] font-bold">Always On</span>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 bg-surface-950/40 rounded-xl border border-surface-800/50">
                    <div>
                      <p className="text-xs font-bold text-surface-200 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-success-400" />
                        Analytics & Performance
                      </p>
                      <p className="text-[10px] text-surface-400">Helps us analyze app performance and usage.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center ${
                        analyticsEnabled ? 'bg-success-500 justify-end' : 'bg-surface-800 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-2.5 pt-2">
              {!showPreferences ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowPreferences(true)}
                    className="flex-1 px-4 py-3 rounded-xl border border-surface-700 hover:border-surface-600 hover:bg-surface-800 text-xs font-semibold active:scale-95 transition-all text-center flex items-center justify-center"
                    style={{ minHeight: '48px' }}
                  >
                    Preferences
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="flex-1 bg-success-500 hover:bg-success-600 active:scale-95 transition-all text-white text-xs font-bold rounded-xl text-center flex items-center justify-center shadow-md shadow-success-500/10"
                    style={{ minHeight: '48px' }}
                  >
                    Accept All
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePreferences}
                  className="w-full bg-primary-600 hover:bg-primary-700 active:scale-95 transition-all text-white text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2"
                  style={{ minHeight: '48px' }}
                >
                  <Check className="w-4 h-4" />
                  Save Preferences
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
