import React, { useEffect, useState } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

// Import all feature pages
import ResumeATS from "./Features/ResumeATS";
import CoverLetterGenerator from "./Features/CoverLetterGenerator";
import ColdOutreach from "./Features/ColdOutreach";
import MockInterview from "./Features/MockInterview";
import ResumeTranslator from "./Features/ResumeTranslator";
import JobPostCreator from "./Features/JobPostCreator";
import JobPostBoard from "./Features/JobPostBoard";
import JobMarketInsights from "./Features/JobMarketInsights";
import SkillsGapAnalysis from "./Features/SkillsGapAnalysis";
import InterviewQuestionsBank from "./Features/InterviewQuestionsBank";
import InterviewQuestionGenerator from "./Features/InterviewQuestionGenerator";
import SampleQuestions from "./Features/SampleQuestions";
import ManageCourses from "../components/courses/ManageCourses";
import InterviewScheduler from "./Features/InterviewScheduler";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const menuItems = [
    { path: "/dashboard/resume-ats", iconType: "document", label: "Resume ATS Checker", useCase: "UC2", roles: ["applicant", "recruiter"] },
    { path: "/dashboard/cover-letter", iconType: "mail", label: "Cover Letter Generator", useCase: "UC3", roles: ["applicant"] },
    { path: "/dashboard/cold-outreach", iconType: "email", label: "Cold Outreach", useCase: "UC6", roles: ["applicant"] },
    { path: "/dashboard/mock-interview", iconType: "microphone", label: "Mock Interview", useCase: "UC7", roles: ["applicant"] },
    { path: "/dashboard/interview-scheduler", iconType: "calendar", label: "Interview Scheduler", useCase: "Scheduling", roles: ["applicant", "recruiter"] },
    { path: "/dashboard/resume-translator", iconType: "globe", label: "Resume Translator", useCase: "UC8", roles: ["applicant"] },
    { path: "/dashboard/job-board", iconType: "document", label: "Job Board", useCase: "UC9", roles: ["applicant", "recruiter"] },
    { path: "/dashboard/job-post-creator", iconType: "clipboard", label: "Job Post Creator", useCase: "UC9", roles: ["recruiter"] },
    { path: "/dashboard/skills-gap", iconType: "chart", label: "Skills Gap Analysis", useCase: "UC10", roles: ["applicant"] },
    { path: "/dashboard/interview-questions", iconType: "lightbulb", label: "Interview Questions Bank", useCase: "UC11", roles: ["applicant"] },
    { path: "/dashboard/question-generator", iconType: "lightbulb", label: "Question Generator", useCase: "Recruiter", roles: ["recruiter"] },
    { path: "/dashboard/sample-questions", iconType: "document", label: "Sample Questions", useCase: "Recruiter", roles: ["recruiter"] },
    { path: "/dashboard/job-market-insights", iconType: "chart", label: "Job Market Insights", useCase: "Career Trainer", roles: ["career_trainer"] },
    { path: "/dashboard/manage-courses", iconType: "clipboard", label: "Manage Courses", useCase: "UC12", roles: ["career_trainer"] },
  ];

  // Compute displayed menu items based on user role (normalize to handle spaces/underscores)
  const userRole = user?.role ? user.role.toLowerCase() : null;

  // Filter menu items based on user role
  const displayedMenuItems = menuItems.filter(item => {
    if (!item.roles) return true; // Show items without role restrictions
    return item.roles.includes(userRole);
  });

  const getIcon = (iconType) => {
    const iconClasses = "w-5 h-5";
    switch (iconType) {
      case "home":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case "document":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "mail":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case "pencil":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case "upload":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        );
      case "email":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      case "microphone":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      case "globe":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case "clipboard":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case "chart":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case "lightbulb":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case "calendar":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("yaake_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await authAPI.getMe();
        if (response.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("yaake_token");
      localStorage.removeItem("yaake_user");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  const DashboardHome = () => (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to YAAKE Dashboard!</h2>
          <p className="text-gray-600 mb-6">Your all-in-one platform for career development and job application success.</p>

          {user && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="text-gray-800 font-semibold">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Role:</span>
                  <p className="text-gray-800 font-semibold capitalize">{user.role}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Verification Status:</span>
                  <p className={`font-semibold ${user.isVerified ? "text-green-600" : "text-yellow-600"}`}>{user.isVerified ? "Verified" : "Pending Verification"}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Member Since:</span>
                  <p className="text-gray-800 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {user && !user.isVerified && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800">Your email is not verified yet. Please check your email for the verification link.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Available Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMenuItems.map((item) => (
              <Link key={item.path} to={item.path} className="block p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105 border border-indigo-100">
                <div className="text-indigo-600 mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getIcon(item.iconType)?.props.children}
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{item.label}</h4>
                <p className="text-sm text-gray-600">{item.useCase}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? "w-20" : "w-64"} bg-gradient-to-b from-indigo-600 to-purple-700 text-white transition-all duration-300 flex flex-col shadow-xl`}>
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between border-b border-indigo-500">
          {!isSidebarCollapsed && <h1 className="text-2xl font-bold tracking-wider">YAAKE</h1>}
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-indigo-500 rounded-lg transition-colors">
            {isSidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-2">
            <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === "/dashboard" ? "bg-indigo-500 shadow-lg" : "hover:bg-indigo-500"}`}>
              {getIcon("home")}
              {!isSidebarCollapsed && <span className="font-medium">Home</span>}
            </Link>

            {displayedMenuItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? "bg-indigo-500 shadow-lg" : "hover:bg-indigo-500"}`} title={isSidebarCollapsed ? item.label : ""}>
                {getIcon(item.iconType)}
                {!isSidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-indigo-200">{item.useCase}</div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* User Section at Bottom */}
        <div className="border-t border-indigo-500 p-4">
          <div className="relative">
            <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-indigo-500 transition-colors">
              <div className="w-8 h-8 bg-indigo-400 rounded-full flex items-center justify-center font-bold">{user?.email?.charAt(0).toUpperCase()}</div>
              {!isSidebarCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm truncate">{user?.email}</div>
                  <div className="text-xs text-indigo-200">Account</div>
                </div>
              )}
              {!isSidebarCollapsed && <span>{isUserMenuOpen ? "▲" : "▼"}</span>}
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && !isSidebarCollapsed && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-xl overflow-hidden">
                <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium">
                  Logout
                </button>
              </div>
            )}

            {/* Collapsed logout button */}
            {isSidebarCollapsed && isUserMenuOpen && (
              <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl">
                <button onClick={handleLogout} className="px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors font-medium whitespace-nowrap">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">{location.pathname === "/dashboard" ? "Dashboard Home" : menuItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}</h2>
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                Welcome, <span className="font-semibold">{user?.email}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="bg-gray-50 min-h-[calc(100vh-73px)]">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/resume-ats" element={<ResumeATS />} />
            <Route path="/cover-letter" element={<CoverLetterGenerator />} />
            <Route path="/cold-outreach" element={<ColdOutreach />} />
            <Route path="/mock-interview" element={<MockInterview />} />
            <Route path="/interview-scheduler" element={<InterviewScheduler />} />
            <Route path="/resume-translator" element={<ResumeTranslator />} />
            <Route path="/job-board" element={<JobPostBoard />} />
            <Route path="/job-post-creator" element={<JobPostCreator />} />
            <Route path="/skills-gap" element={<SkillsGapAnalysis />} />
            <Route path="/interview-questions" element={<InterviewQuestionsBank />} />
            {userRole === "recruiter" ? (
              <Route path="/question-generator" element={<InterviewQuestionGenerator />} />
            ) : null}
            {userRole === "recruiter" ? (
              <Route path="/sample-questions" element={<SampleQuestions />} />
            ) : null}
            <Route path="/manage-courses" element={<ManageCourses />} />
            <Route path="/job-market-insights" element={<JobMarketInsights />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
