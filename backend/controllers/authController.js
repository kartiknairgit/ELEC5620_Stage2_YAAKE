const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const UserController = require("./userController");
const { sendVerificationEmail, sendWelcomeEmail } = require("../utils/emailService");

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "24h",
  });
};

// @desc    Register new user (FR1: Email/Password Registration)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

  const { email, password, role, companyName } = req.body;

    // FR4: Check if user already exists (duplicate email handling)
    const existingUser = await UserController.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Create new user (FR3: pending verification status)
  const userRole = role || 'candidate';
  const user = await UserController.create(email, password, false, userRole, companyName);
    // FR3: Generate verification token

    console.log('Newly created user:', user);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await UserController.setVerificationToken(user._id || user.id, verificationToken);

    // FR3: Send verification email (SMTP placeholder)
    const emailResult = await sendVerificationEmail(email, verificationToken);

    // Generate JWT token
    const token = generateToken(user._id || user.id);

    // Convert user to plain object and remove password
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please check your email to verify your account.",
      data: {
        user: userObj,
        token,
        emailSent: emailResult.success,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await UserController.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id || user.id);

    // Convert user to plain object and remove password
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userObj,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
};

// @desc    Verify email (FR3: Email Verification)
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await UserController.findByVerificationToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    // Update user verification status
    await UserController.update(user._id || user.id, {
      isVerified: true,
      verificationToken: null,
    });

    // Send welcome email
    await sendWelcomeEmail(user.email);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
      error: error.message,
    });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await UserController.findByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    await UserController.setVerificationToken(user._id || user.id, verificationToken);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
      emailSent: emailResult.success,
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while resending verification email",
      error: error.message,
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await UserController.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Convert user to plain object and remove password
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;

    res.status(200).json({
      success: true,
      data: {
        user: userObj,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
      error: error.message,
    });
  }
};

// @desc    Logout user (client-side token removal)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful. Please remove the token from client storage.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// @desc    OAuth placeholder endpoints (FR2: OAuth Integration Placeholders)
// @route   GET /api/auth/google
// @access  Public
const googleOAuth = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Google OAuth integration is not yet implemented. This is a placeholder for future development.",
  });
};

// @desc    OAuth callback placeholder
// @route   GET /api/auth/google/callback
// @access  Public
const googleOAuthCallback = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Google OAuth callback is not yet implemented. This is a placeholder for future development.",
  });
};

// @desc    GitHub OAuth placeholder
// @route   GET /api/auth/github
// @access  Public
const githubOAuth = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "GitHub OAuth integration is not yet implemented. This is a placeholder for future development.",
  });
};

// @desc    GitHub OAuth callback placeholder
// @route   GET /api/auth/github/callback
// @access  Public
const githubOAuthCallback = async (req, res) => {
  res.status(501).json({
    success: false,
    message: "GitHub OAuth callback is not yet implemented. This is a placeholder for future development.",
  });
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  logout,
  googleOAuth,
  googleOAuthCallback,
  githubOAuth,
  githubOAuthCallback,
};
