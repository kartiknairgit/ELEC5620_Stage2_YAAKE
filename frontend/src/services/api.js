import axios from "axios";

// API base URL

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 70000, // 60 seconds timeout
});

// Request interceptor - add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("yaake_token");
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
      localStorage.removeItem("yaake_token");
      localStorage.removeItem("yaake_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  // Register new user
  register: async (email, password, confirmPassword, role, companyName) => {
    const response = await api.post("/auth/register", {
      email,
      password,
      confirmPassword,
      role,
      companyName,
    });
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    console.log("Login response:", response.data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await api.post("/auth/resend-verification", {
      email,
    });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

// File upload API
export const filesAPI = {
  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/files/resume", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

// Resumes API - translation / parsing endpoints
export const resumesAPI = {
  // Translate a PDF resume and return the translated PDF as an ArrayBuffer
  translateResumePdf: async (file, targetLanguage = "English", onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetLanguage", targetLanguage);

    const response = await api.post("/resume/translate/pdf", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "arraybuffer",
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
            onUploadProgress(percentCompleted);
          }
        : undefined,
    });

    return response;
  },

  translateResumeDocx: async (file, targetLanguage = "English", onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetLanguage", targetLanguage);

    const response = await api.post("/resume/translate/docx", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      responseType: "arraybuffer",
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded));
            onUploadProgress(percentCompleted);
          }
        : undefined,
    });


    return response;
  },
};

// Courses API
export const coursesAPI = {
  // list/search courses: accept optional { q }
  getCourses: async ({ q } = {}) => {
    // Attach the logged-in user's id (if available) so server can scope results.
    let userId;
    try {
      const stored = localStorage.getItem("yaake_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        userId = parsed._id || parsed.id || parsed.email;
      }
    } catch (err) {
      // ignore parse errors
    }

    const params = { q };
    if (userId) params.userId = userId;
    const response = await api.get("/courses", { params });
    // backend returns { success: true, data: [...] }
    return response.data && response.data.data ? response.data.data : [];
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data && response.data.data ? response.data.data : null;
  },

  createCourse: async (course) => {
    const response = await api.post("/courses", course);
    return response.data && response.data.data ? response.data.data : null;
  },

  // Extract course metadata from a URL using backend prompt service
  extractCourseFromUrl: async (url) => {
    const response = await api.post("/courses/extract", { url });
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
  },
};

// Job Post API
export const jobPostAPI = {
  create: async (payload) => {
    const response = await api.post('/jobposts', payload);
    return response.data?.data || null;
  },

  getMine: async () => {
    const response = await api.get('/jobposts/mine');
    return response.data?.data || [];
  },

  listPublic: async (params = {}) => {
    const response = await api.get('/jobposts/public', { params });
    return {
      posts: response.data?.data || [],
      pagination: response.data?.pagination || null
    };
  },

  getById: async (id) => {
    const response = await api.get(`/jobposts/${id}`);
    return response.data?.data || null;
  },

  getCareerInsights: async (params = {}) => {
    const response = await api.get('/jobposts/insights/career', { params });
    return response.data?.data || null;
  }
};

// Outreach API
export const outreachAPI = {
  // Generate new outreach email with AI
  generateEmail: async (data) => {
    const response = await api.post("/outreach/generate", data);
    return response.data?.data || null;
  },

  // Get all outreach emails
  getOutreachEmails: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get("/outreach", { params });
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
      responseType: "blob",
    });
    return response.data;
  },

  // Export as text
  exportText: async (id) => {
    const response = await api.get(`/outreach/${id}/export/text`, {
      responseType: "blob",
    });
    return response.data;
  },
};

// Cover letters API
export const coverLettersAPI = {
  generate: async (payload) => {
    const response = await api.post("/cover-letters/generate", payload);
    return response.data;
  },
  refine: async (payload) => {
    const response = await api.post("/cover-letters/refine", payload);
    return response.data;
  },
};

// ATS API calls
export const atsAPI = {
  // Score resume against job description
  scoreResume: async (file, jobDescription, onUploadProgress) => {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);

    const response = await api.post("/ats/score", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: onUploadProgress
        ? (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress(percentCompleted);
          }
        : undefined,
    });

    return response.data;
  },

  // Get health status
  getHealth: async () => {
    const response = await api.get("/ats/health");
    return response.data;
  },

  // Get scoring criteria information
  getCriteria: async () => {
    const response = await api.get("/ats/criteria");
    return response.data;
  },
};

// Export API
export const exportAPI = {
  coverLetter: async ({ draftText, title, format = "docx", download = true }) => {
    const response = await api.post("/export/cover-letter", { draftText, title, format, download }, { responseType: "blob" });
    return response;
  },
};

// Learning Recommender API
export const learningAPI = {
  learningPath: async ({ resumeText, jobDescription, targetRole }) => {
    const response = await api.post('/recommender/learning-path', { resumeText, jobDescription, targetRole });
    return response.data?.data || null;
  }
};

// Interview Question Generator API (for recruiters)
export const questionAPI = {
  // Generate new question set with AI
  generateQuestions: async (data) => {
    // AI generation can take longer, so we use a 60-second timeout
    const response = await api.post("/questions/generate", data, {
      timeout: 60000, // 60 seconds for AI generation
    });
    return response.data?.data || null;
  },

  // Get all question sets for current recruiter
  getMyQuestionSets: async (visibility) => {
    const params = visibility ? { visibility } : {};
    const response = await api.get("/questions/my-sets", { params });
    return response.data?.data || [];
  },

  // Get public sample questions (for applicants)
  getPublicSamples: async (filters = {}) => {
    const response = await api.get("/questions/samples", { params: filters });
    return response.data?.data || [];
  },

  // Get company templates (for applicants)
  getCompanyTemplates: async (filters = {}) => {
    const response = await api.get("/questions/templates", { params: filters });
    return response.data?.data || {};
  },

  // Get single question set by ID
  getQuestionSet: async (id) => {
    const response = await api.get(`/questions/${id}`);
    return response.data?.data || null;
  },

  // Update question set (edit questions, change details)
  updateQuestionSet: async (id, updates) => {
    const response = await api.patch(`/questions/${id}`, updates);
    return response.data?.data || null;
  },

  // Delete question set
  deleteQuestionSet: async (id) => {
    const response = await api.delete(`/questions/${id}`);
    return response.data || null;
  },

  // Update visibility (make public/template/private)
  updateVisibility: async (id, visibility) => {
    const response = await api.post(`/questions/${id}/visibility`, { visibility });
    return response.data?.data || null;
  },

  // Provide feedback on AI-generated questions
  provideFeedback: async (id, feedback) => {
    const response = await api.post(`/questions/${id}/feedback`, { feedback });
    return response.data?.data || null;
  },

  // Export question set as PDF
  exportPDF: async (id) => {
    const response = await api.get(`/questions/${id}/export/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
};

// Interview Scheduling API
export const scheduleAPI = {
  // Get list of applicants (for recruiters)
  getAllApplicants: async () => {
    const response = await api.get("/schedule/applicants/list");
    return response.data?.data || [];
  },

  // Create new interview schedule (recruiter only)
  createInterview: async (data) => {
    const response = await api.post("/schedule", data);
    return response.data?.data || null;
  },

  // Get all my interviews
  getMyInterviews: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get("/schedule", { params });
    return response.data?.data || [];
  },

  // Get single interview
  getInterview: async (id) => {
    const response = await api.get(`/schedule/${id}`);
    return response.data?.data || null;
  },

  // Respond to interview (applicant only)
  respondToInterview: async (id, responseData) => {
    const response = await api.post(`/schedule/${id}/respond`, responseData);
    return response.data?.data || null;
  },

  // Update interview (recruiter only)
  updateInterview: async (id, updates) => {
    const response = await api.patch(`/schedule/${id}`, updates);
    return response.data?.data || null;
  },

  // Cancel interview (recruiter only)
  cancelInterview: async (id) => {
    const response = await api.delete(`/schedule/${id}`);
    return response.data || null;
  },
};

export default api;
