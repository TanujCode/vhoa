import React, { useState, useEffect } from 'react';
import { Plus, X, Calendar, Video, MapPin, Users, CheckCircle, Clock, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import {
  getMeetings,
  createMeeting,
  submitMeetingRsvp,
  getSurveys,
  createSurvey,
  voteOnSurvey,
  updateMeeting,
  deleteMeeting,
  updateSurvey,
  deleteSurvey
} from '../services/meetingSurveyService';

// ── Schedule Meeting Modal ────────────────────────────
const ScheduleMeetingModal = ({ communityId, onClose, onSuccess, meeting }) => {
  const [loading, setLoading] = useState(false);

  const formatToLocalDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: meeting ? meeting.title : '',
    description: meeting ? meeting.description : '',
    meeting_date: meeting ? formatToLocalDatetimeLocal(meeting.meeting_date) : '',
    location: meeting ? meeting.location || '' : '',
    meeting_link: meeting ? meeting.meeting_link || '' : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.meeting_date) {
      alert('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      if (meeting) {
        await updateMeeting(meeting.meeting_id, {
          title: form.title.trim(),
          description: form.description.trim(),
          meeting_date: new Date(form.meeting_date).toISOString(),
          location: form.location.trim() || null,
          meeting_link: form.meeting_link.trim() || null
        });
      } else {
        await createMeeting({
          community_id: communityId,
          title: form.title.trim(),
          description: form.description.trim(),
          meeting_date: new Date(form.meeting_date).toISOString(),
          location: form.location.trim() || null,
          meeting_link: form.meeting_link.trim() || null
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error saving meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {meeting ? 'Update Meeting Details' : 'Schedule New Meeting'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Meeting Title *</label>
            <input
              required
              type="text"
              placeholder="e.g. Monthly HOA Budget Review"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Description & Agenda *</label>
            <textarea
              required
              rows={4}
              placeholder="Provide meeting agenda and details..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={form.meeting_date}
              onChange={e => setForm({...form, meeting_date: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Physical Location (optional)</label>
            <input
              type="text"
              placeholder="e.g. Community Center Hall A"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Meeting Link / Video URL (optional)</label>
            <input
              type="url"
              placeholder="e.g. https://zoom.us/j/..."
              value={form.meeting_link}
              onChange={e => setForm({...form, meeting_link: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium text-slate-700 dark:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Create Survey Modal ──────────────────────────────
const CreateSurveyModal = ({ communityId, onClose, onSuccess, survey }) => {
  const [loading, setLoading] = useState(false);

  const formatToLocalDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const offset = d.getTimezoneOffset() * 60000;
    const localTime = new Date(d.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: survey ? survey.title : '',
    question: survey ? survey.question : '',
    expires_at: survey ? formatToLocalDatetimeLocal(survey.expires_at) : ''
  });
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index, value) => {
    const nextOpts = [...options];
    nextOpts[index] = value;
    setOptions(nextOpts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (survey) {
      if (!form.title.trim() || !form.question.trim() || !form.expires_at) {
        alert('Please fill in all required fields.');
        return;
      }
      setLoading(true);
      try {
        await updateSurvey(survey.survey_id, {
          title: form.title.trim(),
          question: form.question.trim(),
          expires_at: new Date(form.expires_at).toISOString()
        });
        onSuccess();
        onClose();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error updating survey');
      } finally {
        setLoading(false);
      }
    } else {
      const cleanOptions = options.filter(o => o.trim() !== '');
      if (cleanOptions.length < 2) {
        alert('Please fill in at least 2 options.');
        return;
      }
      setLoading(true);
      try {
        await createSurvey({
          community_id: communityId,
          title: form.title.trim(),
          question: form.question.trim(),
          expires_at: new Date(form.expires_at).toISOString(),
          options: cleanOptions
        });
        onSuccess();
        onClose();
      } catch (err) {
        alert(err.response?.data?.detail || 'Error creating survey');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {survey ? 'Update Survey Details' : 'Create New Survey / Poll'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Survey Title *</label>
            <input
              required
              type="text"
              placeholder="e.g. Painting Color Choice"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Survey Question / Topic *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Which color should we choose for the exterior painting?"
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 block">Voting Deadline *</label>
            <input
              required
              type="datetime-local"
              value={form.expires_at}
              onChange={e => setForm({...form, expires_at: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {!survey && (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2 block">Poll Options * (Min 2)</label>
              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      required
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onChange={e => handleOptionChange(index, e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAddOption}
                className="mt-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                + Add Option
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-red-600 hover:text-white dark:bg-white/10 dark:hover:bg-red-600 dark:hover:text-white rounded-xl text-sm font-medium text-slate-700 dark:text-white">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Saving...' : survey ? 'Save Changes' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Page Component ──────────────────────────────
const Meetings = ({ community, user }) => {
  const [activeTab, setActiveTab] = useState('meetings');
  const [meetings, setMeetings] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);

  const role = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  useEffect(() => {
    if (community?.community_id) {
      fetchData();
    }
  }, [community, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'meetings') {
        const data = await getMeetings(community.community_id);
        setMeetings(data || []);
      } else {
        const data = await getSurveys(community.community_id);
        setSurveys(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRsvp = async (meetingId, rsvpStatus) => {
    try {
      await submitMeetingRsvp(meetingId, rsvpStatus);
      // Refresh list
      const data = await getMeetings(community.community_id);
      setMeetings(data || []);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit RSVP');
    }
  };

  const handleVote = async (surveyId, optionId) => {
    try {
      await voteOnSurvey(surveyId, optionId);
      // Refresh surveys
      const data = await getSurveys(community.community_id);
      setSurveys(data || []);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register vote');
    }
  };

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm("Are you sure you want to permanently delete this meeting?")) return;
    try {
      await deleteMeeting(meetingId);
      alert("✅ Meeting successfully deleted.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete meeting");
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm("Are you sure you want to permanently delete this survey/poll?")) return;
    try {
      await deleteSurvey(surveyId);
      alert("✅ Survey/Poll successfully deleted.");
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete survey");
    }
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '—';
    return new Date(isoStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isSurveyExpired = (expiryStr) => {
    if (!expiryStr) return true;
    return new Date() > new Date(expiryStr);
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meetings & Surveys</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">{community?.name || 'Community Portal'}</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {activeTab === 'meetings' ? (
              <button
                onClick={() => setShowMeetingModal(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-teal-500/25"
              >
                <Plus size={15} /> Schedule Meeting
              </button>
            ) : (
              <button
                onClick={() => setShowSurveyModal(true)}
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-2xl text-sm font-semibold transition shadow-lg shadow-teal-500/25"
              >
                <Plus size={15} /> Create Survey
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['meetings', 'surveys'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-2xl text-sm font-medium transition capitalize ${
              activeTab === tab 
                ? 'bg-teal-600 hover:bg-teal-700 text-white hover:text-white shadow-md shadow-teal-500/20' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-gray-400 dark:hover:bg-white/20'
            }`}
          >
            {tab === 'meetings' ? '📅 Community Meetings' : '🗳️ Surveys & Polls'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-gray-400 font-mono text-sm">LOADING...</p>
        </div>
      ) : activeTab === 'meetings' ? (
        /* ── MEETINGS LIST ── */
        meetings.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-gray-400 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl">
            <Calendar size={40} className="mx-auto mb-3 opacity-50 text-slate-400 dark:text-gray-500" />
            No meetings scheduled yet.
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.meeting_id}
                className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full font-semibold">
                      <Clock size={12} />
                      {formatDateTime(meeting.meeting_date)}
                    </span>
                    {meeting.location && (
                      <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full font-semibold">
                        <MapPin size={12} />
                        {meeting.location}
                      </span>
                    )}
                    {meeting.meeting_link && (
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full font-semibold hover:underline"
                      >
                        <Video size={12} />
                        Join Virtual <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{meeting.title}</h3>
                    {isAdmin && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditingMeeting(meeting)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition"
                          title="Edit Meeting"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                          className="p-1.5 hover:bg-red-500/15 rounded-lg text-slate-400 hover:text-red-500 transition"
                          title="Delete Meeting"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">{meeting.description}</p>
                  
                  {/* RSVP count badges */}
                  <div className="flex gap-4 pt-2 text-xs text-slate-500 dark:text-gray-400 border-t border-slate-200/50 dark:border-white/5 pt-3">
                    <span className="flex items-center gap-1"><Users size={14} className="text-teal-600 dark:text-teal-400" /> RSVP Summary:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{meeting.rsvp_yes_count} Yes</span>
                    <span>·</span>
                    <span className="font-semibold text-red-500">{meeting.rsvp_no_count} No</span>
                    <span>·</span>
                    <span className="font-semibold text-amber-500">{meeting.rsvp_maybe_count} Maybe</span>
                  </div>
                </div>

                {/* RSVP Actions Column */}
                <div className="flex flex-col justify-center items-center md:items-start gap-2 border-t md:border-t-0 md:border-l border-slate-200/50 dark:border-white/5 pt-4 md:pt-0 pl-0 md:pl-6 w-full md:w-auto md:min-w-max flex-shrink-0">
                  <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 text-center md:text-left">Your Attendance:</span>
                  <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleRsvp(meeting.meeting_id, 'YES')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        meeting.user_rsvp === 'YES'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      <CheckCircle size={12} /> Yes
                    </button>
                    <button
                      onClick={() => handleRsvp(meeting.meeting_id, 'NO')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        meeting.user_rsvp === 'NO'
                          ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleRsvp(meeting.meeting_id, 'MAYBE')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        meeting.user_rsvp === 'MAYBE'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      Maybe
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── SURVEYS LIST ── */
        surveys.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-gray-400 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl">
            <Users size={40} className="mx-auto mb-3 opacity-50 text-slate-400 dark:text-gray-500" />
            No active surveys or polls yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {surveys.map((survey) => {
              const expired = isSurveyExpired(survey.expires_at);
              const userVoted = survey.user_voted_option_id !== null;
              const showResults = expired || userVoted;

              return (
                <div
                  key={survey.survey_id}
                  className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                        expired 
                          ? 'bg-slate-200 dark:bg-white/5 text-slate-500 dark:text-gray-400' 
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-[#25C490]'
                      }`}>
                        {expired ? 'Closed' : 'Active Poll'}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
                        Deadline: {formatDateTime(survey.expires_at)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{survey.title}</h3>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => setEditingSurvey(survey)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition"
                            title="Edit Survey"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteSurvey(survey.survey_id)}
                            className="p-1 hover:bg-red-500/15 rounded-lg text-slate-400 hover:text-red-500 transition"
                            title="Delete Survey"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-gray-300 leading-relaxed mb-6 font-medium">{survey.question}</p>

                    {/* Options / Results layout */}
                    <div className="space-y-3">
                      {survey.options.map((option) => {
                        const isVotedChoice = survey.user_voted_option_id === option.option_id;
                        const percentage = survey.total_votes > 0 
                          ? Math.round((option.vote_count / survey.total_votes) * 100) 
                          : 0;

                        if (showResults) {
                          return (
                            <div key={option.option_id} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold px-1">
                                <span className="flex items-center gap-1.5">
                                  {option.option_text}
                                  {isVotedChoice && (
                                    <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full font-bold">Your Vote</span>
                                  )}
                                </span>
                                <span>{percentage}% ({option.vote_count} votes)</span>
                              </div>
                              <div className="w-full bg-slate-200/50 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <button
                              key={option.option_id}
                              onClick={() => handleVote(survey.survey_id, option.option_id)}
                              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl text-left text-sm font-semibold text-slate-800 dark:text-white transition flex items-center justify-between border border-transparent hover:border-teal-500/30"
                            >
                              <span>{option.option_text}</span>
                              <span className="text-teal-600 dark:text-teal-400 text-xs opacity-0 hover:opacity-100 transition-opacity">Vote →</span>
                            </button>
                          );
                        }
                      })}
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 dark:border-white/5 mt-6 pt-4 text-xs text-slate-400 dark:text-gray-500 flex justify-between items-center">
                    <span>Total Votes: <strong className="text-slate-700 dark:text-white">{survey.total_votes}</strong></span>
                    {survey.created_by_name && <span>Created by {survey.created_by_name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Modals */}
      {(showMeetingModal || editingMeeting) && (
        <ScheduleMeetingModal
          communityId={community?.community_id}
          meeting={editingMeeting}
          onClose={() => { setShowMeetingModal(false); setEditingMeeting(null); }}
          onSuccess={fetchData}
        />
      )}
      {(showSurveyModal || editingSurvey) && (
        <CreateSurveyModal
          communityId={community?.community_id}
          survey={editingSurvey}
          onClose={() => { setShowSurveyModal(false); setEditingSurvey(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Meetings;
