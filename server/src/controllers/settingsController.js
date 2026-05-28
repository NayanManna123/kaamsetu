import Settings from '../models/Settings.js';
import User from '../models/User.js';

/**
 * @desc    Get global social links
 * @route   GET /api/settings/social-links
 * @access  Public
 */
export const getSocialLinks = async (req, res) => {
  try {
    let settings = await Settings.findOne({ isGlobal: true });

    // Auto-create global settings if not existing
    if (!settings) {
      settings = await Settings.create({
        isGlobal: true,
        github: 'https://github.com/kaamsetu',
        instagram: 'https://instagram.com/kaamsetu',
        twitter: 'https://twitter.com/kaamsetu',
        linkedin: 'https://linkedin.com/company/kaamsetu',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        github: settings.github,
        instagram: settings.instagram,
        twitter: settings.twitter,
        linkedin: settings.linkedin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update global social links
 * @route   PUT /api/settings/social-links
 * @access  Private (Admin / Authenticated users)
 */
export const updateSocialLinks = async (req, res) => {
  try {
    const { github, instagram, twitter, linkedin } = req.body;

    let settings = await Settings.findOne({ isGlobal: true });

    if (!settings) {
      settings = new Settings({ isGlobal: true });
    }

    if (github !== undefined) settings.github = github;
    if (instagram !== undefined) settings.instagram = instagram;
    if (twitter !== undefined) settings.twitter = twitter;
    if (linkedin !== undefined) settings.linkedin = linkedin;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'Global social links updated',
      data: {
        github: settings.github,
        instagram: settings.instagram,
        twitter: settings.twitter,
        linkedin: settings.linkedin,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get user-specific settings and profile
 * @route   GET /api/settings/user
 * @access  Private
 */
export const getUserSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });

    // Auto-create user settings if not existing
    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        isGlobal: false,
      });
    }

    // Get the latest user profile details (exclude password)
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user,
        settings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user profile and settings
 * @route   PUT /api/settings/user
 * @access  Private
 */
export const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      // Profile updates
      name,
      phone,
      avatar,
      workerProfile,
      companyProfile,
      // Settings updates
      notifications,
      language,
      upiId,
      bankDetails,
      // Password updates
      currentPassword,
      newPassword,
    } = req.body;

    // 1. Fetch user (select +password for password change validation)
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // 2. Fetch or create Settings
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = new Settings({ userId, isGlobal: false });
    }

    // 3. Handle Password Change (if provided)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Please provide current password to set a new password',
        });
      }
      
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }

      user.password = newPassword; // Pre-save hook will hash this
    }

    // 4. Update Profile Fields (User model)
    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Handle phone update (check uniqueness)
    if (phone !== undefined && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered by another user',
        });
      }
      user.phone = phone;
    }

    // Merge workerProfile fields
    if (workerProfile !== undefined && user.role === 'worker') {
      const existingWorker = user.workerProfile || {};
      user.workerProfile = {
        ...existingWorker,
        skills: workerProfile.skills !== undefined ? workerProfile.skills : existingWorker.skills,
        experience: workerProfile.experience !== undefined ? workerProfile.experience : existingWorker.experience,
        preferredWorkType: workerProfile.preferredWorkType !== undefined ? workerProfile.preferredWorkType : existingWorker.preferredWorkType,
        availability: workerProfile.availability !== undefined ? workerProfile.availability : existingWorker.availability,
        expectedWage: workerProfile.expectedWage !== undefined ? workerProfile.expectedWage : existingWorker.expectedWage,
        bio: workerProfile.bio !== undefined ? workerProfile.bio : existingWorker.bio,
        isInstantAvailable: workerProfile.isInstantAvailable !== undefined ? workerProfile.isInstantAvailable : existingWorker.isInstantAvailable,
      };
    }

    // Merge companyProfile fields
    if (companyProfile !== undefined && user.role === 'company') {
      const existingCompany = user.companyProfile || {};
      user.companyProfile = {
        ...existingCompany,
        companyName: companyProfile.companyName !== undefined ? companyProfile.companyName : existingCompany.companyName,
        businessType: companyProfile.businessType !== undefined ? companyProfile.businessType : existingCompany.businessType,
        description: companyProfile.description !== undefined ? companyProfile.description : existingCompany.description,
      };
    }

    // 5. Update Settings Fields (Settings model)
    if (notifications !== undefined) {
      settings.notifications = {
        ...settings.notifications,
        ...notifications,
      };
    }
    if (language !== undefined) settings.language = language;
    if (upiId !== undefined) settings.upiId = upiId;
    if (bankDetails !== undefined) {
      settings.bankDetails = {
        ...settings.bankDetails,
        ...bankDetails,
      };
    }

    // 6. Save both documents
    await user.save();
    await settings.save();

    // 7. Hide password for response
    const sanitizedUser = await User.findById(userId);

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        user: sanitizedUser,
        settings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
