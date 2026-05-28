import User from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { generateOTP, sendEmailOTP, sendSMSOTP } from '../utils/otpService.js';

/**
 * @desc    Register a new user (with email & phone verification OTPs)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, password, and role',
      });
    }

    // Check if user already exists by phone
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists',
      });
    }

    // Check if user already exists by email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email address already exists',
      });
    }

    // Generate verification OTPs
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      isEmailVerified: false,
      isPhoneVerified: false,
      emailVerificationOtp: emailOtp,
      emailVerificationOtpExpires: otpExpiry,
      phoneVerificationOtp: phoneOtp,
      phoneVerificationOtpExpires: otpExpiry,
      otpAttempts: 0,
    });

    // Send OTPs
    await sendEmailOTP(email, emailOtp);
    await sendSMSOTP(phone, phoneOtp);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Verification OTPs sent.',
      devOtp: process.env.NODE_ENV === 'development' ? { emailOtp, phoneOtp } : undefined,
      data: {
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: false,
        isPhoneVerified: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Login user (checks verification status)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if email and phone are verified
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email and phone number to complete login',
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        email: user.email,
        phone: user.phone,
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify email address OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ 
        success: true, 
        message: 'Email is already verified',
        isEmailVerified: true,
        isPhoneVerified: user.isPhoneVerified
      });
    }

    // Increment and limit OTP attempts to prevent brute forcing
    user.otpAttempts += 1;
    if (user.otpAttempts > 5) {
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed verification attempts. Please request a new OTP.',
      });
    }

    // Verify expiry
    if (!user.emailVerificationOtpExpires || user.emailVerificationOtpExpires < new Date()) {
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please resend.' });
    }

    // Match OTP
    if (user.emailVerificationOtp !== otp) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    // Success: Mark email as verified and clear OTP
    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    // If both verified, log user in and send token
    if (user.isEmailVerified && user.isPhoneVerified) {
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: 'Verification complete! Account activated.',
        verified: true,
        data: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          token,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email address verified successfully.',
      verified: false,
      isEmailVerified: true,
      isPhoneVerified: user.isPhoneVerified,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Verify mobile phone OTP
 * @route   POST /api/auth/verify-phone
 * @access  Public
 */
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide phone and OTP code' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isPhoneVerified) {
      return res.status(200).json({ 
        success: true, 
        message: 'Phone is already verified',
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: true
      });
    }

    // Increment and check attempts limit
    user.otpAttempts += 1;
    if (user.otpAttempts > 5) {
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many failed verification attempts. Please request a new OTP.',
      });
    }

    // Verify expiry
    if (!user.phoneVerificationOtpExpires || user.phoneVerificationOtpExpires < new Date()) {
      await user.save();
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please resend.' });
    }

    // Match OTP
    if (user.phoneVerificationOtp !== otp) {
      await user.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    // Success: Mark phone verified and clear OTP
    user.isPhoneVerified = true;
    user.phoneVerificationOtp = null;
    user.phoneVerificationOtpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    // If both verified, log user in and send token
    if (user.isEmailVerified && user.isPhoneVerified) {
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        message: 'Verification complete! Account activated.',
        verified: true,
        data: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          token,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Mobile phone verified successfully.',
      verified: false,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: true,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Resend OTP to User (email or SMS phone)
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOtp = async (req, res) => {
  try {
    const { target, type } = req.body; // target is email or phone number, type is 'email' or 'phone'

    if (!target || !type) {
      return res.status(400).json({ success: false, message: 'Please provide verification target and type' });
    }

    const query = type === 'email' ? { email: target } : { phone: target };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newOtp = generateOTP();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    if (type === 'email') {
      user.emailVerificationOtp = newOtp;
      user.emailVerificationOtpExpires = expiry;
      user.otpAttempts = 0;
      await user.save();
      await sendEmailOTP(user.email, newOtp);
    } else {
      user.phoneVerificationOtp = newOtp;
      user.phoneVerificationOtpExpires = expiry;
      user.otpAttempts = 0;
      await user.save();
      await sendSMSOTP(user.phone, newOtp);
    }

    res.status(200).json({
      success: true,
      message: `Verification OTP resent successfully to ${target}`,
      devOtp: process.env.NODE_ENV === 'development' ? newOtp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name', 'email', 'avatar', 'location',
      'workerProfile', 'companyProfile',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Profile updated',
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
