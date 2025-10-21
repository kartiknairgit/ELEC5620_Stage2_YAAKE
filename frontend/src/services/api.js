import axios from 'axios';

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000 // 20 seconds timeout
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('yaake_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('yaake_token');
      localStorage.removeItem('yaake_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (email, password, confirmPassword) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      confirmPassword
    });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    console.log('Login response:', response.data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post('/auth/resend-verification', {
      email
    });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// File upload API
export const filesAPI = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Cover letters API
export const coverLettersAPI = {
  generate: async (payload) => {
    const response = await api.post('/cover-letters/generate', payload);
    return response.data;
  },
  refine: async (payload) => {
    const response = await api.post('/cover-letters/refine', payload);
    return response.data;
  }
};

// Export API
export const exportAPI = {
  coverLetter: async ({ draftText, title, format = 'docx', download = true }) => {
    const response = await api.post('/export/cover-letter', { draftText, title, format, download }, { responseType: 'blob' });
    return response;
  }
};

export default api;
