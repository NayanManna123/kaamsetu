import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Wallet, 
  CreditCard, 
  Building, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { walletAPI, settingsAPI } from '../../api/endpoints';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const WithdrawPage = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', bankDetails: null });
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      console.log('Loading withdrawal page data...');
      try {
        // Fetch wallet balance
        const resBalance = await walletAPI.getBalance();
        if (resBalance.data?.success) {
          setBalance(resBalance.data.balance);
          setCurrency(resBalance.data.currency || 'INR');
          console.log('Successfully loaded balance:', resBalance.data.balance);
        }

        // Fetch user payment settings
        const resSettings = await settingsAPI.getUserSettings();
        if (resSettings.data?.success && resSettings.data?.data?.settings) {
          const settings = resSettings.data.data.settings;
          setPaymentDetails({
            upiId: settings.upiId || '',
            bankDetails: settings.bankDetails?.accountNumber ? settings.bankDetails : null
          });
          console.log('Successfully loaded payment settings.');
        }
      } catch (err) {
        console.error('Failed to load withdrawal data:', err);
        toast.error('Failed to load wallet details. Try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');

    const withdrawVal = parseFloat(amount);
    if (isNaN(withdrawVal) || withdrawVal <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (withdrawVal > balance) {
      setError('Amount exceeds your current wallet balance');
      return;
    }

    // Ensure at least one payment method is configured
    if (!paymentDetails.upiId && !paymentDetails.bankDetails) {
      setError('Please add a UPI ID or Bank Account in settings before withdrawing.');
      return;
    }

    setSubmitting(true);
    console.log(`Submitting withdrawal request of ${withdrawVal} ${currency}...`);
    try {
      const res = await walletAPI.withdraw({ amount: withdrawVal });
      if (res.data?.success) {
        toast.success(res.data.message || 'Withdrawal completed successfully!');
        console.log('Withdrawal successful! Navigating back to home...');
        navigate('/worker/home');
      }
    } catch (err) {
      console.error('Withdrawal failed:', err);
      toast.error(err.response?.data?.message || 'Withdrawal failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-surface-500">Loading wallet details...</p>
        </div>
      </div>
    );
  }

  const hasPaymentMethod = paymentDetails.upiId || paymentDetails.bankDetails;

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            console.log('Cancel withdrawal. Navigating to /worker/home');
            navigate('/worker/home');
          }}
          className="p-2 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-surface-655" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-surface-900">Withdraw Funds</h2>
          <p className="text-xs text-surface-500">Transfer your earnings directly to your bank account or UPI.</p>
        </div>
      </div>

      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-white border border-surface-100 rounded-3xl shadow-card flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-xs font-bold text-surface-450 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-primary-500" />
            AVAILABLE BALANCE
          </span>
          <h3 className="text-3xl font-extrabold text-surface-900">{formatCurrency(balance)}</h3>
        </div>
        <span className="px-3.5 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 rounded-full text-xs font-black">
          {currency}
        </span>
      </motion.div>

      {/* Payment Destination Panel */}
      <div className="bg-white border border-surface-100 rounded-3xl p-5 shadow-card space-y-4">
        <h4 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Withdrawal Destination</h4>
        
        {hasPaymentMethod ? (
          <div className="space-y-3">
            {paymentDetails.upiId && (
              <div className="flex items-center justify-between p-3.5 bg-surface-50 rounded-2xl border border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-850">UPI ID</p>
                    <p className="text-xs font-medium text-surface-500">{paymentDetails.upiId}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
            )}

            {paymentDetails.bankDetails && (
              <div className="flex items-center justify-between p-3.5 bg-surface-50 rounded-2xl border border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success-100 text-success-600 rounded-xl">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-surface-850">{paymentDetails.bankDetails.bankName || 'Bank Account'}</p>
                    <p className="text-xs font-medium text-surface-500">
                      IFSC: {paymentDetails.bankDetails.ifscCode} | A/C: ****{paymentDetails.bankDetails.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">ACTIVE</span>
              </div>
            )}
            
            <p className="text-[10px] text-surface-450 italic text-center">
              * To modify these, go to <span onClick={() => navigate('/settings')} className="text-primary-600 font-bold underline cursor-pointer">Settings &gt; Payment Details</span>.
            </p>
          </div>
        ) : (
          <div className="p-5 border border-dashed border-warning-300 bg-warning-50/20 rounded-2xl text-center space-y-3">
            <div className="w-10 h-10 bg-warning-100 text-warning-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-surface-850">No Payment Details Configured</p>
              <p className="text-xs text-surface-500">You must set up a UPI ID or Bank account details to withdraw funds.</p>
            </div>
            <button
              onClick={() => {
                console.log('Navigating to settings to configure payment details');
                navigate('/settings');
              }}
              className="px-4 py-2 bg-warning-600 hover:bg-warning-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all shadow-sm"
            >
              Configure Payments in Settings
            </button>
          </div>
        )}
      </div>

      {/* Withdrawal Form */}
      {hasPaymentMethod && (
        <form onSubmit={handleWithdraw} className="bg-white border border-surface-100 rounded-3xl p-6 shadow-card space-y-4">
          <h4 className="text-sm font-bold text-surface-800 uppercase tracking-wider">Enter Amount</h4>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-surface-500">Withdrawal Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-surface-400 font-bold text-lg">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="input-field pl-8 font-bold text-lg"
                placeholder="0"
                min="1"
                max={balance}
                step="any"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-danger-50 border border-danger-200 text-danger-700 rounded-2xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Transfer Info */}
          <div className="flex items-start gap-3 bg-surface-50 p-4 border border-surface-100 rounded-2xl">
            <Clock className="w-5 h-5 text-surface-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-surface-900">Settlement Speed</p>
              <p className="text-[10px] text-surface-500 leading-normal">
                Transfers are usually processed instantly but can take up to 24 hours depending on your bank's clearance cycles.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Confirm & Withdraw
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
};

export default WithdrawPage;
