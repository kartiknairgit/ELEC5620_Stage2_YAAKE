import React, { useState, useEffect } from 'react';
import { scheduleAPI } from '../../services/api';

const InterviewScheduler = () => {
  const [user, setUser] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);

  // Form state for creating interviews
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    meetingLink: '',
    selectedApplicants: [],
    timeSlots: []
  });

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('yaake_user'));
    setUser(userData);
    loadInterviews();
    if (userData?.role === 'recruiter') {
      loadApplicants();
    }
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const data = await scheduleAPI.getMyInterviews();
      setInterviews(data);
    } catch (error) {
      console.error('Error loading interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplicants = async () => {
    try {
      const data = await scheduleAPI.getAllApplicants();
      setApplicants(data);
    } catch (error) {
      console.error('Error loading applicants:', error);
    }
  };

  // Generate time slots for a day (9 AM to 6 PM, 30-min intervals)
  const generateTimeSlots = (date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 18;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const start = new Date(date);
        start.setHours(hour, minute, 0, 0);
        const end = new Date(start);
        end.setMinutes(end.getMinutes() + 30);
        slots.push({ start, end });
      }
    }
    return slots;
  };

  const handleSlotClick = (slot) => {
    const slotKey = `${slot.start.getTime()}-${slot.end.getTime()}`;
    const exists = selectedSlots.find(s => `${s.start.getTime()}-${s.end.getTime()}` === slotKey);

    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => `${s.start.getTime()}-${s.end.getTime()}` !== slotKey));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleCreateInterview = async () => {
    try {
      if (!formData.title || formData.selectedApplicants.length === 0 || selectedSlots.length === 0) {
        alert('Please fill in all required fields');
        return;
      }

      const data = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        meetingLink: formData.meetingLink,
        applicants: formData.selectedApplicants,
        proposedSlots: selectedSlots
      };

      await scheduleAPI.createInterview(data);
      alert('Interview created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadInterviews();
    } catch (error) {
      console.error('Error creating interview:', error);
      alert(error.response?.data?.message || 'Failed to create interview');
    }
  };

  const handleRespondToInterview = async (interviewId, status, selectedSlot) => {
    try {
      const responseData = {
        status,
        selectedSlot: status === 'accepted' ? selectedSlot : undefined,
        message: status === 'rejected' ? 'Not available' : 'Looking forward to it!'
      };

      await scheduleAPI.respondToInterview(interviewId, responseData);
      alert(`Interview ${status} successfully!`);
      loadInterviews();
    } catch (error) {
      console.error('Error responding to interview:', error);
      alert(error.response?.data?.message || 'Failed to respond to interview');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      meetingLink: '',
      selectedApplicants: [],
      timeSlots: []
    });
    setSelectedSlots([]);
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Scheduler</h1>
              <p className="text-gray-600 mt-1">
                {user?.role === 'recruiter'
                  ? 'Schedule interviews with applicants'
                  : 'View and respond to interview invitations'}
              </p>
            </div>
            {user?.role === 'recruiter' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Schedule Interview
              </button>
            )}
          </div>
        </div>

        {/* Interviews List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">
            {user?.role === 'recruiter' ? 'My Scheduled Interviews' : 'Pending Invitations'}
          </h2>

          {interviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No interviews found</p>
          ) : (
            <div className="space-y-4">
              {interviews.map((interview) => (
                <div key={interview._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{interview.title}</h3>
                      {interview.description && (
                        <p className="text-gray-600 text-sm mt-1">{interview.description}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        {interview.location && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {interview.location}
                          </p>
                        )}
                        {interview.meetingLink && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Meeting Link:</span>{' '}
                            <a href={interview.meetingLink} target="_blank" rel="noopener noreferrer"
                               className="text-blue-600 hover:underline">
                              {interview.meetingLink}
                            </a>
                          </p>
                        )}

                        {user?.role === 'recruiter' && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Applicants:</span>{' '}
                            {interview.applicants.map(a => a.email).join(', ')}
                          </p>
                        )}

                        {user?.role === 'applicant' && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Recruiter:</span> {interview.recruiter.email}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                        interview.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        interview.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        interview.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {interview.status.toUpperCase()}
                      </span>

                      {/* Confirmed slot */}
                      {interview.confirmedSlot && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm font-medium text-green-900">Confirmed Time:</p>
                          <p className="text-sm text-green-700">
                            {formatDateTime(interview.confirmedSlot.start)} - {formatTime(interview.confirmedSlot.end)}
                          </p>
                        </div>
                      )}

                      {/* Proposed slots (for applicants) */}
                      {user?.role === 'applicant' && interview.status === 'pending' && interview.proposedSlots && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {interview.proposedSlots.map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleRespondToInterview(interview._id, 'accepted', slot)}
                                className="p-2 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-500 text-sm text-left"
                              >
                                {formatDateTime(slot.start)} - {formatTime(slot.end)}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => handleRespondToInterview(interview._id, 'rejected')}
                            className="mt-3 text-sm text-red-600 hover:text-red-700"
                          >
                            Reject Interview
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Interview Modal */}
        {showCreateModal && user?.role === 'recruiter' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Schedule New Interview</h2>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interview Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Technical Interview for Software Engineer"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows="3"
                      placeholder="Additional details about the interview..."
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Office Room 301 or Virtual"
                    />
                  </div>

                  {/* Meeting Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={formData.meetingLink}
                      onChange={(e) => setFormData({...formData, meetingLink: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="https://zoom.us/..."
                    />
                  </div>

                  {/* Select Applicants */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Applicants *
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                      {applicants.length === 0 ? (
                        <p className="text-gray-500 text-sm">No applicants found</p>
                      ) : (
                        applicants.map((applicant) => (
                          <label key={applicant._id} className="flex items-center space-x-2 py-1">
                            <input
                              type="checkbox"
                              checked={formData.selectedApplicants.includes(applicant._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    selectedApplicants: [...formData.selectedApplicants, applicant._id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    selectedApplicants: formData.selectedApplicants.filter(id => id !== applicant._id)
                                  });
                                }
                              }}
                            />
                            <span className="text-sm">{applicant.email}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Time Slots Grid */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Available Time Slots * (Click to select/deselect)
                    </label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50">
                      <div className="grid grid-cols-3 gap-2">
                        {generateTimeSlots(selectedDate).map((slot, idx) => {
                          const slotKey = `${slot.start.getTime()}-${slot.end.getTime()}`;
                          const isSelected = selectedSlots.some(
                            s => `${s.start.getTime()}-${s.end.getTime()}` === slotKey
                          );

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSlotClick(slot)}
                              className={`p-2 rounded text-sm transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {formatTime(slot.start)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedSlots.length} slot(s) selected
                    </p>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateInterview}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewScheduler;
