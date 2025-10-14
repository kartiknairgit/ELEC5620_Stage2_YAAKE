const mongoose = require('mongoose');
require('dotenv').config();

/**
 * DB Service
 * Exports connect and disconnect helpers for MongoDB using mongoose.
 * Reads connection string from process.env.MONGO_URI or constructs one from MONGO_USER/MONGO_PWD/MONGO_HOST.
 */

const DEFAULT_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // other options can be added here if needed
};

/**
 * Build MongoDB URI from environment variables.
 * Priority: MONGO_URI > (MONGO_USER, MONGO_PWD, MONGO_HOST, MONGO_DB)
 */
function buildMongoUri() {
  if (process.env.MONGO_URI && process.env.MONGO_URI.trim() !== '') {
    return process.env.MONGO_URI.trim();
  }
}

async function connect() {
  const uri = buildMongoUri();
  try {
    await mongoose.connect(uri, DEFAULT_OPTIONS);
    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Re-throw so callers can decide how to handle startup failure
    throw err;
  }
}

async function disconnect() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}

module.exports = {
  connect,
  disconnect,
};
