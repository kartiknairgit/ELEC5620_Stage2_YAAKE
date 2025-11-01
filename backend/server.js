const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const coverLetterRoutes = require('./routes/coverLetterRoutes');
const exportRoutes = require('./routes/exportRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const resumeroutes = require("./routes/resumeRoutes")

const uc7Routes = require('./routes/uc7-mockInterview');
const coursesRoutes = require('./routes/coursesRoutes');
const outreachRoutes = require('./routes/outreachRoutes');
const questionRoutes = require('./routes/questionRoutes');
const jobPostRoutes = require('./routes/jobPostRoutes');
const recommenderRoutes = require('./routes/recommenderRoutes');
const atsRoutes = require('./routes/atsRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const UserController = require('./controllers/userController');
const dbService = require('./services/db.service');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (NFR: Performance optimization)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/files', uploadRoutes);
app.use("/api/resume", resumeroutes)
app.use('/api/uc7', uc7Routes);
app.use('/api/courses', coursesRoutes);
app.use('/api/outreach', outreachRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/jobposts', jobPostRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/recommender', recommenderRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'YAAKE Backend is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Note: super user is initialized after DB connect via UserController.initializeSuperUser()

// Server configuration
const PORT = process.env.PORT || 5000;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';

// Start server
const startServer = () => {
  if (HTTPS_ENABLED) {
    // HTTPS server configuration
    const sslKeyPath = process.env.SSL_KEY_PATH || './config/ssl/key.pem';
    const sslCertPath = process.env.SSL_CERT_PATH || './config/ssl/cert.pem';

    // Check if SSL certificates exist
    if (fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
      const httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log('===========================================');
        console.log(`YAAKE Backend Server (HTTPS)`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Server running on https://localhost:${PORT}`);
        console.log(`Health check: https://localhost:${PORT}/api/health`);
        console.log('===========================================');
      });
    } else {
      console.warn('⚠️  SSL certificates not found. Falling back to HTTP.');
      console.warn(`Expected SSL key at: ${sslKeyPath}`);
      console.warn(`Expected SSL cert at: ${sslCertPath}`);
      console.warn('To generate self-signed certificates, run:');
      console.warn('mkdir -p backend/config/ssl && openssl req -x509 -newkey rsa:4096 -keyout backend/config/ssl/key.pem -out backend/config/ssl/cert.pem -days 365 -nodes');

      // Start HTTP server as fallback
      http.createServer(app).listen(PORT, () => {
        console.log('===========================================');
        console.log(`YAAKE Backend Server (HTTP - Fallback)`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Health check: http://localhost:${PORT}/api/health`);
        console.log('===========================================');
      });
    }
  } else {
    // HTTP server
    http.createServer(app).listen(PORT, () => {
      console.log('===========================================');
      console.log(`YAAKE Backend Server (HTTP)`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log('===========================================');
    });
  }
};

// Connect to DB then start the server
dbService.connect()
  .then(() => {
    // Initialize super user after DB is ready (controller handles creation)
    UserController.initializeSuperUser()
      .then(() => startServer())
      .catch((err) => {
        console.error('Failed to initialize super user:', err);
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB. Server not started.');
    console.error(err);
    process.exit(1);
  });
// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;
