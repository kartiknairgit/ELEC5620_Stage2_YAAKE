import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
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
  register: async (email, password, confirmPassword, role) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      confirmPassword,
      role
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

// Courses API
export const coursesAPI = {
  // list/search courses: accept optional { q }
  getCourses: async ({ q } = {}) => {
    // Attach the logged-in user's id (if available) so server can scope results.
    let userId;
    try {
      const stored = localStorage.getItem('yaake_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        userId = parsed._id || parsed.id || parsed.email;
      }
    } catch (err) {
      // ignore parse errors
    }

    const params = { q };
    if (userId) params.userId = userId;
    const response = await api.get('/courses', { params });
    // backend returns { success: true, data: [...] }
    return response.data && response.data.data ? response.data.data : [];
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data && response.data.data ? response.data.data : null;
  },

  createCourse: async (course) => {
    const response = await api.post('/courses', course);
    return response.data && response.data.data ? response.data.data : null;
  },

  // Extract course metadata from a URL using backend prompt service
  extractCourseFromUrl: async (url) => {
    const response = await api.post('/courses/extract', { url });
    return response.data && response.data.data ? response.data.data : null;
  },

  updateCourse: async (id, updates) => {
    const response = await api.patch(`/courses/${id}`, updates);
    return response.data && response.data.data ? response.data.data : null;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    // delete returns { success: true, message: 'Course deleted' }
    return response.data || null;
  }
};

// Outreach API
export const outreachAPI = {
  // Generate new outreach email with AI
  generateEmail: async (data) => {
    const response = await api.post('/outreach/generate', data);
    return response.data?.data || null;
  },

  // Get all outreach emails
  getOutreachEmails: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/outreach', { params });
    return response.data?.data || [];
  },

  // Get single outreach email
  getOutreach: async (id) => {
    const response = await api.get(`/outreach/${id}`);
    return response.data?.data || null;
  },

  // Update outreach email
  updateOutreach: async (id, updates) => {
    const response = await api.patch(`/outreach/${id}`, updates);
    return response.data?.data || null;
  },

  // Regenerate email with new instructions
  regenerateEmail: async (id, instructions) => {
    const response = await api.post(`/outreach/${id}/regenerate`, { instructions });
    return response.data?.data || null;
  },

  // Send outreach email
  sendEmail: async (id) => {
    const response = await api.post(`/outreach/${id}/send`);
    return response.data || null;
  },

  // Delete outreach email
  deleteOutreach: async (id) => {
    const response = await api.delete(`/outreach/${id}`);
    return response.data || null;
  },

  // Export as PDF
  exportPDF: async (id) => {
    const response = await api.get(`/outreach/${id}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Export as text
  exportText: async (id) => {
    const response = await api.get(`/outreach/${id}/export/text`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// ATS API calls
export const atsAPI = {
  // Score resume against job description
  scoreResume: async (file, jobDescription, onUploadProgress) => {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    const response = await api.post('/ats/score', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onUploadProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percentCompleted);
      } : undefined
    });

    return response.data;
  },

  // Get health status
  getHealth: async () => {
    const response = await api.get('/ats/health');
    return response.data;
  },

  // Get scoring criteria information
  getCriteria: async () => {
    const response = await api.get('/ats/criteria');
    return response.data;
  }
};

export default api;
