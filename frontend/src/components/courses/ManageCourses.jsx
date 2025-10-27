import React, { useState, useEffect } from 'react';
import { coursesAPI } from '../../services/api';
import { notifySuccess, notifyError, notifyInfo } from '../../services/notification.service';

const emptyCourse = { url: '', title: '', description: '', provider: '', signupLink: '' };

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(emptyCourse);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await coursesAPI.getCourses();
        if (!mounted) return;
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setFetchError(err?.message || 'Failed to fetch courses');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Confirmation modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  const resetForm = () => {
    setFormData(emptyCourse);
    setErrors({});
    setEditingCourse(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const handleAutoFill = async () => {
    const url = formData.url?.trim();
    if (!url) {
      notifyError('Please provide a URL to auto-fill from.');
      return;
    }

      try {
      const meta = await coursesAPI.extractCourseFromUrl(url);
      if (meta) {
        setFormData(prev => ({ ...prev,
          title: meta.title || prev.title,
          provider: meta.provider || prev.provider,
          description: meta.description || prev.description,
          signupLink: meta.signupLink || meta.signup_link || prev.signupLink
        }));
        notifySuccess('Auto-fill completed. Please review the populated fields.');
      } else {
        notifyInfo('No metadata found at the provided URL.');
      }
      } catch (err) {
      notifyError('Failed to auto-fill from URL. Please try again.');
    }
  };

  // Open edit form directly. Confirmation will be shown after save succeeds.
  const openEditForm = (course) => {
    setEditingCourse(course);
    // normalize fields into the form model
    setFormData({
      url: course.url !== undefined ? course.url : '',
      title: course.title || '',
      description: course.description || '',
      provider: course.provider || '',
      signupLink: course.signupLink || ''
    });
    setShowForm(true);
  };

  const openDeleteConfirm = (courseId) => {
    setConfirmMessage('Are you sure you want to delete this course? This action cannot be undone.');
    setConfirmAction(() => () => {
      // perform delete via API, then update state
      (async () => {
        try {
          await coursesAPI.deleteCourse(courseId);
          setCourses(prev => prev.filter(c => c._id !== courseId));
        } catch (err) {
          // show error notification
          notifyError('Failed to delete course. Please try again.');
          return;
        }
        setConfirmOpen(false);
      })();
    });
    setConfirmOpen(true);
  };

  const validate = () => {
    const e = {};
    const titleVal = (formData.title || '').trim();
    const providerVal = (formData.provider || '').trim();
    if (!titleVal) e.title = 'Title is required';
    if (!providerVal) e.provider = 'Provider is required';
    const signupVal = formData.signupLink || '';
    if (signupVal && !/^https?:\/\//i.test(signupVal)) e.signupLink = 'Signup link must start with http:// or https://';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Call API to persist
    (async () => {
      try {
        if (editingCourse && editingCourse._id) {
          const updated = await coursesAPI.updateCourse(editingCourse._id, formData);
          setCourses(prev => prev.map(c => c._id === updated._id ? updated : c));
          notifySuccess('Course updated successfully.');
        } else {
          const created = await coursesAPI.createCourse(formData);
          // created should be the saved course from server
          setCourses(prev => [created, ...prev]);
          notifySuccess('Course added successfully.');
        }
      } catch (err) {
        notifyError('Failed to save the course. Please try again.');
      } finally {
        resetForm();
        setShowForm(false);
      }
    })();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Manage Courses</h2>
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            onClick={openAddForm}
          >
            Add Course
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading && (
            <div className="p-6 bg-white rounded shadow text-gray-600">Loading courses...</div>
          )}

          {fetchError && (
            <div className="p-6 bg-white rounded shadow text-red-600">{fetchError}</div>
          )}

          {!loading && !fetchError && courses.length === 0 && (
            <div className="p-6 bg-white rounded shadow text-gray-600">No courses yet. Use "Add Course" to create one.</div>
          )}

          {courses.map(course => (
            <div key={course._id} className="p-6 bg-white rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.provider}</p>
                {course.description && <p className="mt-2 text-gray-700">{course.description}</p>}
                {course.signupLink && (
                  <p className="mt-2">
                    <a href={course.signupLink} target="_blank" rel="noreferrer" className="text-indigo-600 underline">Sign up link</a>
                  </p>
                )}
              </div>
              <div className="mt-4 md:mt-0 flex gap-2">
                <button
                  className="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  onClick={() => openEditForm(course)}
                >
                  Edit
                </button>
                <button
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  onClick={() => openDeleteConfirm(course._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => { setShowForm(false); resetForm(); }} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-50">
              <h3 className="text-xl font-semibold mb-4">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <form onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 gap-4">

                  <div>
                    <label className="block text-sm font-medium mb-1">Source URL (paste page URL and click Auto-fill)</label>
                    <div className="flex gap-2">
                      <input name="url" value={formData.url ?? ''} onChange={handleChange} placeholder="https://example.com/course" className={`form-input flex-1 p-2 border rounded ${errors.url ? 'border-red-500' : 'border-gray-200'}`} />
                      <button type="button" onClick={handleAutoFill} className="px-3 py-2 bg-green-600 text-white rounded">Auto-fill</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input name="title" value={formData.title ?? ''} onChange={handleChange} className={`form-input w-full p-2 border rounded ${errors.title ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.title && <div className="text-red-500 text-sm mt-1">{errors.title}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Provider</label>
                    <input name="provider" value={formData.provider ?? ''} onChange={handleChange} className={`form-input w-full p-2 border rounded ${errors.provider ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.provider && <div className="text-red-500 text-sm mt-1">{errors.provider}</div>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea name="description" value={formData.description ?? ''} onChange={handleChange} className="w-full p-2 border border-gray-200 rounded" rows={4} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Signup link (https://...)</label>
                    <input name="signupLink" value={formData.signupLink ?? ''} onChange={handleChange} className={`form-input w-full p-2 border rounded ${errors.signupLink ? 'border-red-500' : 'border-gray-200'}`} />
                    {errors.signupLink && <div className="text-red-500 text-sm mt-1">{errors.signupLink}</div>}
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" className="px-4 py-2 rounded border" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">{editingCourse ? 'Save changes' : 'Add course'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-40" onClick={() => setConfirmOpen(false)} />
            <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-6 z-60">
              <h4 className="text-lg font-semibold mb-3">Please confirm</h4>
              <p className="text-gray-700 mb-4">{confirmMessage}</p>
              <div className="flex justify-end gap-2">
                <button className="px-3 py-2 rounded border" onClick={() => setConfirmOpen(false)}>Cancel</button>
                <button className="px-3 py-2 bg-red-600 text-white rounded" onClick={() => { confirmAction(); }}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
