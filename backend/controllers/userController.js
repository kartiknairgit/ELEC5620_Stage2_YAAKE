const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

// --- Service functions (DB operations) ---
const findByEmail = async (email) => {
  if (!email) return null;
  return await User.findOne({ email: email.toLowerCase() }).exec();
};

const findById = async (id) => {
  if (!id) return null;
  try {
    return await User.findById(id).exec();
  } catch (err) {
    return null;
  }
};

const create = async (email, password, isVerified = false, role = 'applicant', companyName = undefined, name = undefined) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({ name, email: email.toLowerCase(), password: hashedPassword, isVerified, role, companyName });
  await user.save();
  return user;
};

const update = async (id, updates) => {
  if (!id) return null;
  const safeUpdates = { ...updates };
  delete safeUpdates.password;
  // Normalize isVerified and verificationToken if provided
  if (typeof safeUpdates.isVerified === 'string') {
    const lower = safeUpdates.isVerified.toLowerCase();
    safeUpdates.isVerified = (lower === 'true' || lower === '1');
  }
  if (typeof safeUpdates.verificationToken === 'string' && safeUpdates.verificationToken.toLowerCase() === 'null') {
    safeUpdates.verificationToken = null;
  }
  const updated = await User.findByIdAndUpdate(id, safeUpdates, { new: true }).exec();
  return updated;
};

const updatePassword = async (id, newPassword) => {
  if (!id) return null;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  const updated = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true }).exec();
  return updated;
};

const remove = async (id) => {
  if (!id) return false;
  const res = await User.findByIdAndDelete(id).exec();
  return !!res;
};

const findAll = async () => {
  const users = await User.find().exec();
  return users.map(u => {
    const obj = u.toObject();
    delete obj.password;
    return obj;
  });
};

const setVerificationToken = async (id, token) => {
  if (!id) return null;
  const t = (typeof token === 'string' && token.toLowerCase() === 'null') ? null : token;
  const updated = await User.findByIdAndUpdate(id, { verificationToken: t }, { new: true }).exec();
  return updated;
};

const findByVerificationToken = async (token) => {
  if (!token) return null;
  const t = (typeof token === 'string' && token.toLowerCase() === 'null') ? null : token;
  if (t === null) return null;
  return await User.findOne({ verificationToken: t }).exec();
};

const initializeSuperUser = async () => {
  try {
    const superUserEmail = 'admin@yaake.com';
    const superUserPassword = 'Admin@123';
    const existing = await User.findOne({ email: superUserEmail }).exec();
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(superUserPassword, salt);
      const superUser = new User({ email: superUserEmail.toLowerCase(), password: hashedPassword, isVerified: true, role: 'admin' });
      await superUser.save();
      console.log('Super user initialized successfully');
      console.log(`Email: ${superUserEmail}`);
      console.log(`Password: ${superUserPassword}`);
    }
  } catch (error) {
    console.error('Error initializing super user:', error);
  }
};

// --- HTTP handlers (use service functions above) ---
const getAllUsers = async (req, res) => {
  try {
    const users = await findAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const obj = user.toObject ? user.toObject() : user;
    if (obj.password) delete obj.password;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user', error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isVerified } = req.body;
    const existing = await findByEmail(email);
    if (existing) return res.status(400).json({ success: false, message: 'User with this email already exists' });
    const user = await create(email, password, !!isVerified, role || 'user', name);
    const obj = user.toObject ? user.toObject() : user;
    if (obj.password) delete obj.password;
    res.status(201).json({ success: true, data: obj });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error creating user', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updated = await update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    const obj = updated.toObject ? updated.toObject() : updated;
    if (obj.password) delete obj.password;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error updating user', error: error.message });
  }
};

const updatePasswordHandler = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const updated = await updatePassword(req.params.id, newPassword);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    const obj = updated.toObject ? updated.toObject() : updated;
    if (obj.password) delete obj.password;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ success: false, message: 'Server error updating password', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const ok = await remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting user', error: error.message });
  }
};

const generateAndSetVerification = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const token = crypto.randomBytes(32).toString('hex');
    const updated = await setVerificationToken(id, token);
    if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: { verificationToken: token } });
  } catch (error) {
    console.error('Generate verification token error:', error);
    res.status(500).json({ success: false, message: 'Server error generating token', error: error.message });
  }
};

const getUserByVerificationToken = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await findByVerificationToken(token);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const obj = user.toObject ? user.toObject() : user;
    if (obj.password) delete obj.password;
    res.status(200).json({ success: true, data: obj });
  } catch (error) {
    console.error('Get user by verification token error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  // service
  findByEmail,
  findById,
  create,
  update,
  updatePassword,
  delete: remove,
  findAll,
  setVerificationToken,
  findByVerificationToken,
  initializeSuperUser,
  // handlers
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updatePasswordHandler,
  deleteUser,
  generateAndSetVerification,
  getUserByVerificationToken
};
