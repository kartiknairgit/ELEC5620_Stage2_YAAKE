const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import models
const User = require('../models/userModel');

// Test users configuration
const testUsers = [
  {
    email: 'recruiter1@yaake.com',
    password: 'Recruiter@123',
    role: 'recruiter',
    companyName: 'Tech Solutions Inc',
    isVerified: true,
    name: 'Sarah Johnson'
  },
  {
    email: 'recruiter2@yaake.com',
    password: 'Recruiter@123',
    role: 'recruiter',
    companyName: 'Innovation Labs',
    isVerified: true,
    name: 'Michael Chen'
  },
  {
    email: 'applicant1@yaake.com',
    password: 'Applicant@123',
    role: 'applicant',
    isVerified: true,
    name: 'Emily Davis'
  },
  {
    email: 'applicant2@yaake.com',
    password: 'Applicant@123',
    role: 'applicant',
    isVerified: true,
    name: 'James Wilson'
  },
  {
    email: 'applicant3@yaake.com',
    password: 'Applicant@123',
    role: 'applicant',
    isVerified: true,
    name: 'Lisa Anderson'
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/yaake';
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Seed function
const seedUsers = async () => {
  try {
    console.log('Starting user seeding...\n');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email.toLowerCase() });

      if (existingUser) {
        console.log(`✓ User already exists: ${userData.email} (${userData.role})`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Create new user
      const user = new User({
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role,
        companyName: userData.companyName,
        isVerified: userData.isVerified
      });

      await user.save();
      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n===========================================');
    console.log('User seeding completed successfully!');
    console.log('===========================================');
    console.log('\nTest Account Credentials:\n');

    console.log('RECRUITERS:');
    testUsers
      .filter(u => u.role === 'recruiter')
      .forEach(u => {
        console.log(`  Email: ${u.email}`);
        console.log(`  Password: ${u.password}`);
        console.log(`  Company: ${u.companyName}\n`);
      });

    console.log('APPLICANTS:');
    testUsers
      .filter(u => u.role === 'applicant')
      .forEach(u => {
        console.log(`  Email: ${u.email}`);
        console.log(`  Password: ${u.password}\n`);
      });

  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedUsers();

  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run the script
main();
