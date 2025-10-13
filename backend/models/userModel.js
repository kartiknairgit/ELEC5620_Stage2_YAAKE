const bcrypt = require('bcrypt');

// In-memory user storage (will be replaced with MongoDB later)
let users = [];
let userIdCounter = 1;

// User class definition
class User {
  constructor(email, password, isVerified = false, role = 'user') {
    this.id = userIdCounter++;
    this.email = email;
    this.password = password;
    this.isVerified = isVerified;
    this.role = role;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.verificationToken = null;
  }

  // Method to compare password
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // Return user object without password
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      isVerified: this.isVerified,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// Initialize hardcoded super user
const initializeSuperUser = async () => {
  try {
    const superUserEmail = 'admin@yaake.com';
    const superUserPassword = 'Admin@123';

    // Check if super user already exists
    const existingUser = users.find(u => u.email === superUserEmail);

    if (!existingUser) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(superUserPassword, salt);

      // Create super user
      const superUser = new User(superUserEmail, hashedPassword, true, 'admin');
      users.push(superUser);

      console.log('Super user initialized successfully');
      console.log(`Email: ${superUserEmail}`);
      console.log(`Password: ${superUserPassword}`);
    }
  } catch (error) {
    console.error('Error initializing super user:', error);
  }
};

// Model methods
const UserModel = {
  // Find user by email
  findByEmail: async (email) => {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Find user by ID
  findById: async (id) => {
    return users.find(user => user.id === parseInt(id));
  },

  // Create new user
  create: async (email, password, isVerified = false, role = 'user') => {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = new User(email, hashedPassword, isVerified, role);
      users.push(user);

      return user;
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  },

  // Update user
  update: async (id, updates) => {
    const userIndex = users.findIndex(user => user.id === parseInt(id));

    if (userIndex === -1) {
      return null;
    }

    // Update user properties
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'password') {
        users[userIndex][key] = updates[key];
      }
    });

    users[userIndex].updatedAt = new Date();
    return users[userIndex];
  },

  // Update password
  updatePassword: async (id, newPassword) => {
    const userIndex = users.findIndex(user => user.id === parseInt(id));

    if (userIndex === -1) {
      return null;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    users[userIndex].password = hashedPassword;
    users[userIndex].updatedAt = new Date();

    return users[userIndex];
  },

  // Delete user
  delete: async (id) => {
    const userIndex = users.findIndex(user => user.id === parseInt(id));

    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    return true;
  },

  // Get all users (admin only)
  findAll: async () => {
    return users.map(user => user.toJSON());
  },

  // Set verification token
  setVerificationToken: async (id, token) => {
    const user = users.find(user => user.id === parseInt(id));

    if (user) {
      user.verificationToken = token;
      return user;
    }

    return null;
  },

  // Find user by verification token
  findByVerificationToken: async (token) => {
    return users.find(user => user.verificationToken === token);
  },

  // Initialize super user on module load
  initializeSuperUser
};

module.exports = UserModel;
