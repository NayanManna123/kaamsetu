import WalletTransaction from '../models/WalletTransaction.js';
import User from '../models/User.js';
import { paginate, paginatedResponse } from '../utils/helpers.js';

/**
 * @desc    Get wallet balance
 * @route   GET /api/wallet/balance
 * @access  Private (Worker)
 */
export const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    res.json({
      success: true,
      balance: user.wallet?.balance || 0,
      currency: user.wallet?.currency || 'INR',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get wallet transactions
 * @route   GET /api/wallet/transactions
 * @access  Private (Worker)
 */
export const getTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const query = { user: req.user._id };

    const total = await WalletTransaction.countDocuments(query);
    const transactions = await WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json(paginatedResponse(transactions, total, page, limit));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Request fund withdrawal
 * @route   POST /api/wallet/withdraw
 * @access  Private (Worker)
 */
export const withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    const user = await User.findById(req.user._id);

    if ((user.wallet?.balance || 0) < withdrawAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Deduct balance
    user.wallet.balance = Math.max(0, user.wallet.balance - withdrawAmount);
    await user.save();

    // Create transaction log
    const transaction = await WalletTransaction.create({
      user: req.user._id,
      amount: -withdrawAmount,
      type: 'withdrawal',
      status: 'completed',
      description: `Withdrew funds to bank account`,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal completed successfully',
      balance: user.wallet.balance,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
