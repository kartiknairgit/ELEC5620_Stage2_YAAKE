import React, { useState } from 'react';

/**
 * InterviewSetup Component
 * Form to collect candidate information before starting the mock interview
 */
const InterviewSetup = ({ onStartInterview }) => {
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    age: '',
    experience: '',
    skills: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    const age = parseInt(formData.age);
    if (!formData.age || age < 18 || age > 100) {
      newErrors.age = 'Age must be between 18 and 100';
    }

    const experience = parseInt(formData.experience);
    if (formData.experience === '' || experience < 0 || experience > 50) {
      newErrors.experience = 'Experience must be between 0 and 50 years';
    }

    if (!formData.skills.trim()) {
      newErrors.skills = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Convert skills string to array
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);

      const interviewData = {
        position: formData.position.trim(),
        company: formData.company.trim(),
        location: formData.location.trim(),
        age: parseInt(formData.age),
        experience: parseInt(formData.experience),
        skills: skillsArray
      };

      await onStartInterview(interviewData);
    } catch (error) {
      console.error('Error starting interview:', error);
      setErrors({ submit: error.message || 'Failed to start interview' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mock Interview Setup
          </h1>
          <p className="text-gray-600">
            Fill in your details to begin your AI-powered mock interview
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position */}
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
              Position / Role
            </label>
            <input
              type="text"
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="e.g., Software Engineer, Product Manager"
              className={`w-full px-4 py-3 border ${
                errors.position ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
            />
            {errors.position && (
              <p className="mt-1 text-sm text-red-600">{errors.position}</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g., Google, Microsoft, Startup XYZ"
              className={`w-full px-4 py-3 border ${
                errors.company ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., San Francisco, Remote, Sydney"
              className={`w-full px-4 py-3 border ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">{errors.location}</p>
            )}
          </div>

          {/* Age and Experience (side by side) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="18"
                max="100"
                placeholder="25"
                className={`w-full px-4 py-3 border ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>

            {/* Experience */}
            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                min="0"
                max="50"
                placeholder="3"
                className={`w-full px-4 py-3 border ${
                  errors.experience ? 'border-red-500' : 'border-gray-300'
                } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors`}
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">{errors.experience}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <textarea
              id="skills"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="e.g., JavaScript, React, Node.js, Python (comma-separated)"
              rows="3"
              className={`w-full px-4 py-3 border ${
                errors.skills ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none`}
            />
            {errors.skills && (
              <p className="mt-1 text-sm text-red-600">{errors.skills}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Separate multiple skills with commas
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting Interview...
              </>
            ) : (
              'Start Mock Interview'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800">
            <strong>What to expect:</strong> You'll be asked 5 questions tailored to your profile.
            The AI will adapt questions based on your answers. Take your time and answer thoughtfully!
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterviewSetup;
