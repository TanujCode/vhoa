import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar, Video, MapPin, Users, CheckCircle, Clock, ExternalLink, Edit2, Trash2, Mic, Play, Pause, Square, MessageSquare, Volume2, ChevronDown, ChevronLeft, ChevronRight, Search, Building } from 'lucide-react';
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
  deleteSurvey,
  diarizeMeetingAudio,
  renameSpeaker
} from '../services/meetingSurveyService';
import API, { getBaseUrl } from '../services/api';

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
      if (meeting && meeting.meeting_id) {
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
      const detail = err.response?.data?.detail;
      const errorMsg = typeof detail === 'string' ? detail :
                       Array.isArray(detail) ? detail.map(e => `${e.loc.join('.')}: ${e.msg}`).join('\n') :
                       detail ? JSON.stringify(detail) :
                       'Error saving meeting';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {(meeting && meeting.meeting_id) ? 'Update Meeting Details' : 'Schedule New Meeting'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto custom-scrollbar flex-1 pr-1">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Meeting Title *</label>
            <input
              required
              type="text"
              placeholder="e.g. Monthly HOA Budget Review"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Description & Agenda *</label>
            <textarea
              required
              rows={3}
              placeholder="Provide meeting agenda and details..."
              value={form.description}
              onChange={e => setForm({...form, description: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-teal-500/10 transition-all resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Date & Time *</label>
            <input
              required
              type="datetime-local"
              value={form.meeting_date}
              onChange={e => setForm({...form, meeting_date: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Physical Location (optional)</label>
            <input
              type="text"
              placeholder="e.g. Community Center Hall A"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Meeting Link / Video URL (optional)</label>
            <input
              type="url"
              placeholder="e.g. https://zoom.us/j/..."
              value={form.meeting_link}
              onChange={e => setForm({...form, meeting_link: e.target.value})}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
            />
          </div>
          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 cancel-button-red-hover rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
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
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                + Add Option
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 cancel-button-red-hover rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white disabled:opacity-50">
              {loading ? 'Saving...' : survey ? 'Save Changes' : 'Create Survey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ── Rename Speaker Modal ──────────────────────────────
const RenameSpeakerModal = ({ meetingId, oldLabel, members, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedMember, setSelectedMember] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalName = selectedMember || customName.trim();
    if (!finalName) {
      alert('Please select a community member or type a custom name.');
      return;
    }
    
    setLoading(true);
    try {
      await renameSpeaker(meetingId, oldLabel, finalName);
      alert(`Successfully renamed "${oldLabel}" to "${finalName}".`);
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error renaming speaker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Rename Speaker
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="mb-4 bg-slate-50 dark:bg-black/20 p-3.5 rounded-2xl border border-slate-200/50 dark:border-white/5 text-xs text-slate-600 dark:text-gray-400">
          Changing speaker label for <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">"{oldLabel}"</span>. This will rename all occurrences of this speaker across the entire meeting transcript.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Select Community Member</label>
            <div className="relative">
              <select
                value={selectedMember}
                onChange={e => {
                  setSelectedMember(e.target.value);
                  if (e.target.value) {
                    setCustomName(''); // Clear custom name if member selected
                  }
                }}
                className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 pr-10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
              >
                <option value="">-- Type custom name instead --</option>
                {members.map(m => {
                  const roleLabel = m.role_name === 'super_admin' ? 'Super Admin' : 
                                    m.role_name === 'property_manager' ? 'Property Manager' : 
                                    m.role_name === 'board_member' ? 'Board Member' : 'Resident';
                  const label = `${m.full_name} (${roleLabel})`;
                  return (
                    <option key={m.user_id} value={label}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block">Or Enter Custom Name</label>
            <input
              type="text"
              placeholder="e.g. Guest Speaker, John Doe"
              value={customName}
              disabled={!!selectedMember}
              onChange={e => setCustomName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex gap-3 pt-4 flex-shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 cancel-button-red-hover rounded-xl text-sm font-medium transition">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 shadow-md shadow-blue-500/25">
              {loading ? 'Renaming...' : 'Rename Speaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ── Meeting Recorder Modal ────────────────────────────
const MeetingRecorderModal = ({ meeting, onClose, onSuccess }) => {
  const [status, setStatus] = useState('idle'); // idle, recording, paused, processing
  const [recordingType, setRecordingType] = useState('physical'); // physical, virtual
  const [duration, setDuration] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Timer effect
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  // Canvas visualizer loop
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = dataArrayRef.current;

    const draw = () => {
      if (status !== 'recording' && status !== 'paused') return;
      animationFrameRef.current = requestAnimationFrame(draw);
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // Tailwind dark slate-900 with opacity
      if (document.documentElement.classList.contains('dark') || canvas.closest('.dark')) {
        ctx.fillStyle = 'rgba(13, 27, 42, 0.2)';
      } else {
        ctx.fillStyle = 'rgba(248, 250, 252, 0.2)'; // slate-50
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        
        // Premium teal gradient
        ctx.fillStyle = `rgb(13, ${148 + barHeight}, ${136})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };
    draw();
  };

  // Start recording
  const startRecording = async () => {
    try {
      let finalStream;
      let micStream;
      let displayStream;

      if (recordingType === 'virtual') {
        try {
          displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: 1, height: 1, frameRate: 1 },
            audio: true
          });
        } catch (err) {
          console.error("Display media selection cancelled/failed", err);
          return; // User cancelled screen sharing
        }

        const displayAudioTracks = displayStream.getAudioTracks();
        if (displayAudioTracks.length === 0) {
          displayStream.getTracks().forEach(track => track.stop());
          alert("Error: Please make sure to check the 'Share tab audio' or 'Share system audio' checkbox in the browser prompt when recording virtual meetings.");
          return;
        }

        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Setup Web Audio API for mixing
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const micSource = audioContext.createMediaStreamSource(micStream);
        const displaySource = audioContext.createMediaStreamSource(new MediaStream([displayAudioTracks[0]]));

        const destination = audioContext.createMediaStreamDestination();

        // Connect both to mixed output
        micSource.connect(analyser); // Visualize mic input
        micSource.connect(destination);
        displaySource.connect(destination);

        finalStream = destination.stream;
        streamRef.current = [...micStream.getTracks(), ...displayStream.getTracks()];
      } else {
        // Physical mode
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Setup Web Audio for visualizer
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioContext;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(micStream);
        sourceRef.current = source;
        source.connect(analyser);
        
        finalStream = micStream;
        streamRef.current = micStream.getTracks();
      }

      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Setup MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(finalStream, options);
      } catch (err) {
        mediaRecorder = new MediaRecorder(finalStream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus('processing');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Run AI processing steps loading animation
        const steps = [
          'Uploading recording file...',
          'Initializing AI speech model...',
          'Analyzing voices and speech patterns...',
          'Identifying speakers (Speaker Diarization)...',
          'Extracting AI Summary & Action Items...',
          'Completing...'
        ];
        
        for (let i = 0; i < steps.length; i++) {
          setProcessingStep(i);
          await new Promise(r => setTimeout(r, 1200));
        }

        try {
          await diarizeMeetingAudio(meeting.meeting_id, audioBlob);
          onSuccess();
          onClose();
        } catch (err) {
          alert('Error processing audio diarization: ' + (err.response?.data?.detail || err.message));
          setStatus('idle');
          setDuration(0);
        }
      };

      mediaRecorder.start();
      setStatus('recording');
      setTimeout(drawVisualizer, 100);
    } catch (err) {
      alert('Could not access microphone: ' + err.message);
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      if (audioContextRef.current) {
        audioContextRef.current.resume();
      }
      setTimeout(drawVisualizer, 100);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Clean up visualizer resources on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const steps = [
    'Uploading recording file...',
    'Initializing AI speech model...',
    'Analyzing voices and speech patterns...',
    'Identifying speakers (Speaker Diarization)...',
    'Extracting AI Summary & Action Items...',
    'Completing...'
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl flex flex-col items-center">
        
        {status !== 'processing' ? (
          <>
            <div className="w-full flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Record Meeting Session</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="text-center w-full mb-6">
              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Active Meeting</h4>
              <p className="text-base font-bold text-slate-800 dark:text-white truncate px-4">{meeting.title}</p>
            </div>

            {status === 'idle' && (
              /* Recording Type Selector */
              <div className="w-full grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setRecordingType('physical')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition ${
                    recordingType === 'physical'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-white/10 text-slate-550 dark:text-gray-400 hover:border-slate-350 dark:hover:border-white/20'
                  }`}
                >
                  <Mic size={22} />
                  <span className="text-xs font-bold">Physical Meeting</span>
                  <span className="text-[9px] text-slate-450 dark:text-gray-500 leading-tight">Records only your mic.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecordingType('virtual')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2 transition ${
                    recordingType === 'virtual'
                      ? 'border-blue-500 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-white/10 text-slate-550 dark:text-gray-400 hover:border-slate-350 dark:hover:border-white/20'
                  }`}
                >
                  <Video size={22} />
                  <span className="text-xs font-bold">Virtual Call</span>
                  <span className="text-[9px] text-slate-450 dark:text-gray-500 leading-tight">Captures Mic + Tab Audio.</span>
                </button>
              </div>
            )}

            {/* Visualizer Area */}
            <div className="w-full h-40 bg-slate-50 dark:bg-[#0D1B2A] rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden flex flex-col justify-center items-center relative mb-6">
              {status === 'idle' && (
                <div className="flex flex-col items-center text-slate-400 dark:text-gray-500">
                  <Mic size={40} className="animate-pulse mb-2" />
                  <span className="text-xs font-semibold">Ready to record ({recordingType === 'physical' ? 'Mic Only' : 'Mic + Tab'})</span>
                </div>
              )}
              {(status === 'recording' || status === 'paused') && (
                <canvas ref={canvasRef} width="350" height="160" className="w-full h-full" />
              )}
              
              {status === 'paused' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">Recording Paused</span>
                </div>
              )}
            </div>

            {/* Duration Timer */}
            <div className="text-4xl font-mono font-bold text-slate-800 dark:text-white mb-8">
              {formatTime(duration)}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full justify-center">
              {status === 'idle' ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition shadow-lg shadow-blue-500/20"
                >
                  <Mic size={18} /> Start Recording
                </button>
              ) : (
                <>
                  {status === 'recording' ? (
                    <button
                      onClick={pauseRecording}
                      className="p-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-2xl font-bold transition"
                      title="Pause Recording"
                    >
                      <Pause size={20} />
                    </button>
                  ) : (
                    <button
                      onClick={resumeRecording}
                      className="p-4 bg-blue-600/10 hover:bg-blue-600/25 text-blue-600 dark:text-blue-400 rounded-2xl font-bold transition animate-bounce"
                      title="Resume Recording"
                    >
                      <Play size={20} />
                    </button>
                  )}
                  
                  <button
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition shadow-lg shadow-red-500/25"
                  >
                    <Square size={16} /> Stop & Process AI
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          /* Processing Screen */
          <div className="w-full py-8 text-center flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-500/30 border-t-teal-500 rounded-full animate-spin"></div>
              <Mic size={24} className="text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Analyzing Meeting Audio</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 max-w-xs mb-6 leading-relaxed">
              We are uploading, transcribing, and extracting AI meeting summaries. Please do not close this modal.
            </p>
            
            {/* Steps Progress Checklist */}
            <div className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 text-left space-y-2.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs">
                  {processingStep > idx ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : processingStep === idx ? (
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full"></span>
                  )}
                  <span className={`font-semibold ${
                    processingStep === idx 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : processingStep > idx 
                        ? 'text-slate-400 dark:text-gray-500 line-through' 
                        : 'text-slate-500 dark:text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
  
  const [showRecorderModal, setShowRecorderModal] = useState(false);
  const [recordingMeeting, setRecordingMeeting] = useState(null);
  const [expandedTranscriptMeetingId, setExpandedTranscriptMeetingId] = useState(null);
  const [activeMeetingTab, setActiveMeetingTab] = useState({});

  // Speaker Renaming states
  const [showRenameSpeakerModal, setShowRenameSpeakerModal] = useState(false);
  const [renameSpeakerMeetingId, setRenameSpeakerMeetingId] = useState(null);
  const [renameSpeakerOldLabel, setRenameSpeakerOldLabel] = useState('');
  const [members, setMembers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [personalNotes, setPersonalNotes] = useState([]);
  const [quickAddType, setQuickAddType] = useState('meeting');

  useEffect(() => {
    if (community?.community_id) {
      try {
        const saved = localStorage.getItem(`personal_notes_${user?.user_id || 'guest'}_${community.community_id}`);
        setPersonalNotes(saved ? JSON.parse(saved) : []);
      } catch (_) {
        setPersonalNotes([]);
      }
    }
  }, [community, user]);

  useEffect(() => {
    if (community?.community_id) {
      try {
        localStorage.setItem(
          `personal_notes_${user?.user_id || 'guest'}_${community.community_id}`,
          JSON.stringify(personalNotes)
        );
      } catch (_) {}
    }
  }, [personalNotes, community, user]);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [quickAddTaskText, setQuickAddTaskText] = useState("");
  const [selectedCalendars, setSelectedCalendars] = useState({
    meetings: true,
    bookings: true,
    notes: true
  });
  const [plannerView, setPlannerView] = useState("month"); // month, week, list, year
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const getEventsForDay = (date) => {
    const list = [];
    const dStr = date.toDateString();

    if (selectedCalendars.meetings) {
      meetings.forEach(m => {
        if (new Date(m.meeting_date).toDateString() === dStr) {
          list.push({
            id: `meeting-${m.meeting_id}`,
            type: 'meeting',
            title: m.title,
            desc: m.description,
            time: new Date(m.meeting_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            raw: m
          });
        }
      });
    }

    if (selectedCalendars.bookings && bookings?.length > 0) {
      bookings.forEach(b => {
        if (b.booking_date) {
          const [yr, mo, dy] = b.booking_date.split('-').map(Number);
          const bookingDateLocalStr = new Date(yr, mo - 1, dy).toDateString();
          if (bookingDateLocalStr === dStr) {
            list.push({
              id: `booking-${b.booking_id}`,
              type: 'booking',
              title: `${b.amenity_name || 'Amenity'} Booking`,
              time: `${b.slot_start} - ${b.slot_end}`,
              location: b.amenity_name,
              raw: b
            });
          }
        }
      });
    }

    if (selectedCalendars.notes && personalNotes?.length > 0) {
      personalNotes.forEach(n => {
        if (n.date && new Date(n.date).toDateString() === dStr) {
          list.push({
            id: `note-${n.note_id}`,
            type: 'note',
            title: n.title,
            time: n.time || "All Day",
            raw: n
          });
        }
      });
    }

    return list;
  };

  const getUpcomingDays = () => {
    if (plannerView === "list") {
      return [new Date(selectedDate)];
    }
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay();
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const days = [];
    // Show active 7 days of the week, plus any day in the next 30 days that has events scheduled
    for (let i = 0; i < 30; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = getEventsForDay(d);
      const isWithinActiveWeek = i < 7;
      const isSel = d.toDateString() === selectedDate.toDateString();
      
      if (dayEvents.length > 0 || isWithinActiveWeek || isSel) {
        days.push(d);
      }
    }
    return days;
  };

  const handleQuickAddSubmit = (e) => {
    e.preventDefault();
    if (!quickAddTaskText.trim()) return;

    const isCreatingNote = !isAdmin || quickAddType === 'note';

    if (isCreatingNote) {
      const newNote = {
        note_id: Date.now(),
        title: quickAddTaskText.trim(),
        date: new Date(selectedDate).toISOString(),
        time: "All Day"
      };
      setPersonalNotes(prev => [...prev, newNote]);
      alert("✅ Personal schedule note added successfully.");
    } else {
      setEditingMeeting({
        title: quickAddTaskText.trim(),
        description: "",
        meeting_date: new Date(selectedDate).toISOString(),
        location: "",
        meeting_link: ""
      });
      setShowMeetingModal(true);
    }
    setQuickAddTaskText("");
  };

  const renderMiniCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];
    
    const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    
    const hasMeetingOnDay = (day) => {
      const hasM = selectedCalendars.meetings && meetings.some(m => {
        const d = new Date(m.meeting_date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
      });
      
      const hasB = selectedCalendars.bookings && bookings.some(b => {
        if (!b.booking_date) return false;
        const [yr, mo, dy] = b.booking_date.split('-').map(Number);
        return yr === year && (mo - 1) === month && dy === day;
      });
      
      return hasM || hasB;
    };

    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{monthName}</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-bold"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {totalSlots.map((day, idx) => {
            const isToday = day && 
              new Date().getDate() === day && 
              new Date().getMonth() === month && 
              new Date().getFullYear() === year;
              
            const isSelected = day &&
              selectedDate.getDate() === day &&
              selectedDate.getMonth() === month &&
              selectedDate.getFullYear() === year;
              
            const showMeetingDot = day && selectedCalendars.meetings && meetings.some(m => {
              const d = new Date(m.meeting_date);
              return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
            });
            
            const showBookingDot = day && selectedCalendars.bookings && bookings.some(b => {
              if (!b.booking_date) return false;
              const [yr, mo, dy] = b.booking_date.split('-').map(Number);
              return yr === year && (mo - 1) === month && dy === day;
            });

            const showNoteDot = day && selectedCalendars.notes && personalNotes.some(n => {
              if (!n.date) return false;
              const d = new Date(n.date);
              return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
            });

            return (
              <button
                key={idx}
                disabled={!day}
                onClick={() => day && setSelectedDate(new Date(year, month, day))}
                className={`aspect-square flex flex-col items-center justify-center text-[10px] font-mono rounded-lg transition-all relative ${
                  !day ? 'opacity-0' :
                  isSelected ? 'bg-blue-600 text-white font-bold' :
                  isToday ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20' :
                  'hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-gray-300'
                }`}
              >
                <span>{day}</span>
                <div className="flex gap-0.5 justify-center absolute bottom-1">
                  {showMeetingDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-purple-500 dark:bg-purple-400'}`}></span>
                  )}
                  {showBookingDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500 dark:bg-blue-450'}`}></span>
                  )}
                  {showNoteDot && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500 dark:bg-emerald-400'}`}></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarsToggle = () => {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm mt-5">
        <h4 className="text-[10px] font-bold text-slate-500 dark:text-gray-500 tracking-widest uppercase mb-4">Calendars</h4>
        <div className="space-y-3.5">
          {[
            { key: 'meetings', label: 'Community Meetings', color: 'bg-purple-500' },
            { key: 'bookings', label: 'Amenity Bookings', color: 'bg-blue-500' },
            { key: 'notes', label: 'Personal Schedules', color: 'bg-emerald-500' }
          ].map(cal => (
            <label key={cal.key} className="flex items-center gap-3 cursor-pointer text-xs font-semibold text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
              <input
                type="checkbox"
                checked={selectedCalendars[cal.key]}
                onChange={() => setSelectedCalendars(prev => ({ ...prev, [cal.key]: !prev[cal.key] }))}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-white/5 focus:ring-teal-500 focus:ring-opacity-25"
              />
              <span className={`w-2.5 h-2.5 rounded-full ${cal.color}`} />
              <span>{cal.label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const getDaysOfWeek = () => {
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay();
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const renderMonthGrid = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm overflow-hidden animate-in fade-in duration-300">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black text-slate-700 dark:text-gray-300 mb-2 sm:mb-4 uppercase tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
            <div key={i}>
              <span className="hidden sm:inline">{d}</span>
              <span className="inline sm:hidden">{d[0]}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {totalSlots.map((day, idx) => {
            if (!day) return <div key={idx} className="aspect-square bg-slate-100/10 dark:bg-white/[0.005] rounded-xl sm:rounded-2xl border border-transparent"></div>;

            const date = new Date(year, month, day);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dayEvents = getEventsForDay(date);

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDate(date);
                }}
                className={`min-h-[45px] sm:min-h-[90px] md:min-h-[110px] p-1 sm:p-2.5 rounded-xl sm:rounded-2xl flex flex-col justify-between text-left transition-all border ${
                  isSelected 
                    ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/10 scale-[1.01]' 
                    : isToday 
                      ? 'bg-blue-500/5 border-blue-500/40' 
                      : 'bg-white/40 dark:bg-white/[0.01] border-slate-200/50 dark:border-white/[0.03] hover:bg-white/85 dark:hover:bg-white/[0.03]'
                }`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`text-[10px] sm:text-xs font-mono font-bold w-4 h-4 sm:w-6 sm:h-6 flex items-center justify-center rounded-md sm:rounded-lg ${
                    isToday 
                      ? 'bg-blue-600 text-white' 
                      : isSelected 
                        ? 'text-blue-650 dark:text-blue-400 font-extrabold' 
                        : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {day}
                  </span>
                  <div className="flex gap-0.5 mt-0.5 sm:mt-1">
                    {dayEvents.some(e => e.type === 'meeting') && <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-purple-500"></span>}
                    {dayEvents.some(e => e.type === 'booking') && <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-500"></span>}
                    {dayEvents.some(e => e.type === 'note') && <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-500"></span>}
                  </div>
                </div>

                <div className="hidden sm:flex flex-col space-y-1 w-full mt-2.5 overflow-hidden flex-1 justify-end">
                  {dayEvents.slice(0, 2).map((evt, eIdx) => {
                    const isMeeting = evt.type === 'meeting';
                    const isBooking = evt.type === 'booking';
                    return (
                      <div
                        key={eIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(date);
                          setSelectedEvent(evt);
                        }}
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-lg truncate max-w-full block hover:scale-[1.03] transition-transform ${
                          isMeeting 
                            ? 'bg-purple-500/10 text-purple-750 dark:text-purple-300 border border-purple-500/10' 
                            : isBooking 
                              ? 'bg-blue-500/10 text-blue-755 dark:text-blue-300 border border-blue-500/10' 
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/10'
                        }`}
                        title={`${evt.time} - ${evt.title}`}
                      >
                        {evt.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDate(date);
                        setPlannerView('list');
                      }}
                      className="text-[9px] font-bold text-slate-400 dark:text-gray-500 pl-1 hover:underline cursor-pointer"
                    >
                      + {dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekGrid = () => {
    const daysOfWeek = getDaysOfWeek();

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3.5 items-start animate-in fade-in duration-300">
        {daysOfWeek.map((date, idx) => {
          const isToday = new Date().toDateString() === date.toDateString();
          const isSelected = selectedDate.toDateString() === date.toDateString();
          const dayEvents = getEventsForDay(date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <div 
              key={idx} 
              onClick={() => setSelectedDate(date)}
              className={`bg-white dark:bg-[#1E2E42] border rounded-3xl p-3.5 flex flex-col gap-3 min-h-[220px] transition-all cursor-pointer ${
                isSelected 
                  ? 'border-blue-500 shadow-sm' 
                  : isToday 
                    ? 'border-blue-500/20 bg-slate-50/50 dark:bg-white/[0.01]' 
                    : 'border-slate-200/80 dark:border-white/10 hover:bg-slate-50/30 dark:hover:bg-white/[0.01]'
              }`}
            >
              {/* Header */}
              <div className="flex flex-row md:flex-col items-center justify-between md:justify-center text-center pb-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{dayName}</span>
                <span className={`text-xs md:text-sm font-mono font-black mt-0.5 w-6 h-6 flex items-center justify-center rounded-lg ${
                  isToday 
                    ? 'bg-blue-600 text-white' 
                    : isSelected 
                      ? 'text-blue-650 dark:text-blue-400 font-extrabold' 
                      : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {dayNum}
                </span>
              </div>

              {/* Events list */}
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px] custom-scrollbar pr-0.5">
                {dayEvents.length === 0 ? (
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 italic text-center mt-8 font-medium">No events</p>
                ) : (
                  dayEvents.map((evt, eIdx) => {
                    const isMeeting = evt.type === 'meeting';
                    const isBooking = evt.type === 'booking';
                    return (
                      <div
                        key={eIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(date);
                          setSelectedEvent(evt);
                        }}
                        className={`p-2 rounded-xl border text-[9px] font-semibold leading-normal flex flex-col gap-1 hover:scale-[1.02] transition-transform cursor-pointer ${
                          isMeeting 
                            ? 'bg-purple-500/10 text-purple-750 dark:text-purple-300 border-purple-500/20' 
                            : isBooking 
                              ? 'bg-blue-500/10 text-blue-755 dark:text-blue-300 border-blue-500/20' 
                              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        }`}
                      >
                        <span className="font-bold font-mono tracking-tight block text-[8px]">{evt.time}</span>
                        <span className="truncate block">{evt.title}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearGrid = () => {
    const year = currentMonth.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
        {months.map((mIdx) => {
          const tempMonthDate = new Date(year, mIdx, 1);
          const monthName = tempMonthDate.toLocaleString('en-US', { month: 'long' });
          const daysInMonth = getDaysInMonth(year, mIdx);
          const firstDay = getFirstDayOfMonth(year, mIdx);
          const blanks = Array(firstDay).fill(null);
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
          const totalSlots = [...blanks, ...days];

          return (
            <button
              key={mIdx}
              onClick={() => {
                setCurrentMonth(new Date(year, mIdx, 1));
                setPlannerView('month');
              }}
              className="bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm hover:border-blue-500/40 text-left transition-all hover:scale-[1.01]"
            >
              <div className="pb-2.5 border-b border-slate-100 dark:border-white/5 mb-3 flex justify-between items-center">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">{monthName}</span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">{year}</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-700 dark:text-gray-300 mb-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-[9px]">
                {totalSlots.map((day, idx) => {
                  if (!day) return <div key={idx} className="aspect-square"></div>;

                  const date = new Date(year, mIdx, day);
                  const isToday = new Date().toDateString() === date.toDateString();
                  const dayEvents = getEventsForDay(date);

                  return (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center font-mono rounded relative ${
                        isToday 
                          ? 'bg-blue-600 text-white font-bold' 
                          : 'text-slate-650 dark:text-gray-400'
                      }`}
                    >
                      {day}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 justify-center absolute bottom-0.5 w-full">
                          {dayEvents.some(e => e.type === 'meeting') && (
                            <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-purple-500'}`}></span>
                          )}
                          {dayEvents.some(e => e.type === 'booking') && (
                            <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-blue-500'}`}></span>
                          )}
                          {dayEvents.some(e => e.type === 'note') && (
                            <span className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-emerald-500'}`}></span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const handleNavigate = (direction) => {
    const step = direction === 'next' ? 1 : -1;
    
    if (plannerView === 'year') {
      const nextYear = new Date(currentMonth);
      nextYear.setFullYear(currentMonth.getFullYear() + step);
      setCurrentMonth(nextYear);
      setSelectedDate(nextYear);
    } else if (plannerView === 'month') {
      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(currentMonth.getMonth() + step);
      setCurrentMonth(nextMonth);
      setSelectedDate(nextMonth);
    } else if (plannerView === 'week') {
      const nextWeek = new Date(selectedDate);
      nextWeek.setDate(selectedDate.getDate() + (step * 7));
      setSelectedDate(nextWeek);
      setCurrentMonth(nextWeek);
    } else { // list/day view
      const nextDay = new Date(selectedDate);
      nextDay.setDate(selectedDate.getDate() + step);
      setSelectedDate(nextDay);
      setCurrentMonth(nextDay);
    }
  };

  const renderDayDetailView = () => {
    const dayEvents = getEventsForDay(selectedDate);
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    const isTomorrow = selectedDate.toDateString() === new Date(new Date().setDate(new Date().getDate() + 1)).toDateString();
    
    const headerPrefix = isToday ? 'Today, ' : isTomorrow ? 'Tomorrow, ' : '';
    const dateHeaderStr = headerPrefix + selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    return (
      <div className="space-y-4 p-6 bg-white dark:bg-[#1E2E42] border border-slate-200/80 dark:border-white/10 rounded-3xl shadow-sm animate-in fade-in duration-300">
        <div className="flex justify-between items-center pb-3.5 border-b border-slate-100 dark:border-white/5">
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-wide uppercase">
            📅 {dateHeaderStr}
          </h4>
          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider font-mono">
            {dayEvents.length} event{dayEvents.length !== 1 && 's'}
          </span>
        </div>

        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-gray-500 italic font-medium">
            No events or tasks scheduled for this day.
          </div>
        ) : (
          <div className="space-y-4">
            {dayEvents.map((evt) => {
              if (evt.type === 'meeting') {
                const meeting = evt.raw;
                const expired = isMeetingExpired(meeting.meeting_date);
                return (
                  <div
                    key={evt.id}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border border-y-slate-200/50 border-r-slate-200/50 border-l-4 border-l-purple-500 dark:border-y-white/[0.03] dark:border-r-white/[0.03] rounded-r-2xl transition duration-150 shadow-sm"
                  >
                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-purple-500/10 text-purple-650 dark:text-purple-400">
                          Meeting
                        </span>
                        {expired ? (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-slate-500/10 text-slate-500">
                            Past
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 animate-pulse">
                            Live
                          </span>
                        )}
                        {meeting.location && (
                          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-650 dark:text-blue-400">
                            <MapPin size={10} className="text-blue-500" />
                            {meeting.location}
                          </span>
                        )}
                        {meeting.meeting_link && !expired && (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-purple-500/10 text-purple-650 dark:text-purple-400 hover:underline"
                          >
                            <Video size={10} className="text-purple-500" />
                            Join <ExternalLink size={8} />
                          </a>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white leading-snug">
                          {meeting.title}
                        </h4>
                        {meeting.description && (
                          <p className="text-slate-500 dark:text-gray-400 text-xs mt-1 leading-relaxed whitespace-pre-line max-w-2xl">
                            {meeting.description}
                          </p>
                        )}
                      </div>

                      {/* Record Meeting Trigger */}
                      {!meeting.transcript && !meeting.recording_url && isAdmin && (
                        <div className="pt-1.5">
                          {expired ? (
                            <span className="text-slate-400 dark:text-gray-500 text-xs italic flex items-center gap-1 font-mono">
                              <Clock size={11} /> Meeting has ended.
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setRecordingMeeting(meeting);
                                setShowRecorderModal(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white text-[10px] font-black rounded-lg transition border border-blue-500/20 uppercase tracking-wider shadow-sm"
                            >
                              <Mic size={11} /> Record & Process AI Transcript
                            </button>
                          )}
                        </div>
                      )}

                      {/* Preserved Recording & Transcript Block */}
                      {(meeting.recording_url || meeting.transcript || meeting.summary) && (
                        <div className="mt-3 p-3.5 bg-slate-100/50 dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-2.5">
                          {meeting.recording_url && (
                            <div className="flex items-center gap-3">
                              <Volume2 size={14} className="text-blue-605 dark:text-blue-400 flex-shrink-0" />
                              <audio 
                                src={getBaseUrl(meeting.recording_url)} 
                                controls 
                                className="w-full max-w-sm h-6 text-xs accent-blue-600"
                              />
                            </div>
                          )}
                          {(meeting.summary || meeting.transcript) && (
                            <div>
                              <button
                                onClick={() => setExpandedTranscriptMeetingId(expandedTranscriptMeetingId === meeting.meeting_id ? null : meeting.meeting_id)}
                                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <MessageSquare size={13} />
                                {expandedTranscriptMeetingId === meeting.meeting_id ? 'Hide AI Summary & Transcript' : 'View AI Summary & Transcript'}
                              </button>
                              
                              {expandedTranscriptMeetingId === meeting.meeting_id && (
                                <div className="mt-3 space-y-3">
                                  <div className="flex gap-2 border-b border-slate-200/50 dark:border-white/5 pb-2">
                                    <button
                                      type="button"
                                      onClick={() => setActiveMeetingTab({ ...activeMeetingTab, [meeting.meeting_id]: 'summary' })}
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                        (activeMeetingTab[meeting.meeting_id] || 'summary') === 'summary'
                                          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm'
                                          : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                                      }`}
                                    >
                                      📝 AI Summary
                                    </button>
                                    {meeting.transcript && (
                                      <button
                                        type="button"
                                        onClick={() => setActiveMeetingTab({ ...activeMeetingTab, [meeting.meeting_id]: 'transcript' })}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                                          activeMeetingTab[meeting.meeting_id] === 'transcript'
                                            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                                        }`}
                                      >
                                        🗣️ AI Transcript
                                      </button>
                                    )}
                                  </div>

                                  {(activeMeetingTab[meeting.meeting_id] || 'summary') === 'summary' ? (
                                    <div className="bg-white dark:bg-[#0D1B2A] rounded-xl p-4 border border-slate-200/60 dark:border-white/5 text-xs leading-relaxed space-y-2 max-h-60 overflow-y-auto custom-scrollbar text-slate-700 dark:text-gray-300 font-medium">
                                      {meeting.summary ? (
                                        meeting.summary.split('\n').map((line, sIdx) => {
                                          if (!line.trim()) return null;
                                          if (line.startsWith('•') || line.startsWith('*')) {
                                            const cleanLine = line.replace(/^[•*\s]+/, '');
                                            const boldRegex = /\*\*(.*?)\*\*/g;
                                            const parts = [];
                                            let lastIndex = 0;
                                            let match;
                                            while ((match = boldRegex.exec(cleanLine)) !== null) {
                                              const textBefore = cleanLine.substring(lastIndex, match.index);
                                              if (textBefore) parts.push(textBefore);
                                              parts.push(<strong key={match.index} className="text-blue-600 dark:text-blue-400 font-bold">{match[1]}</strong>);
                                              lastIndex = boldRegex.lastIndex;
                                            }
                                            const textAfter = cleanLine.substring(lastIndex);
                                            if (textAfter) parts.push(textAfter);
                                            return (
                                              <div key={sIdx} className="flex gap-2 items-start pl-1">
                                                <span className="text-blue-500 flex-shrink-0 mt-0.5 font-bold">✓</span>
                                                <span>{parts.length > 0 ? parts : cleanLine}</span>
                                              </div>
                                            );
                                          }
                                          return <p key={sIdx}>{line}</p>;
                                        })
                                      ) : (
                                        <p className="italic text-slate-400">No AI summary generated.</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="bg-white dark:bg-[#0D1B2A] rounded-xl p-4 border border-slate-200/60 dark:border-white/5 text-xs leading-relaxed max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                      {/* 🎤 Transcript Header Info */}
                                      <div className="flex justify-between items-center bg-slate-50 dark:bg-black/30 p-2 rounded-lg mb-2">
                                        <span className="font-semibold text-slate-600 dark:text-gray-400">Audio Transcription</span>
                                        <div className="flex gap-1.5">
                                          <button 
                                            onClick={() => diarizeMeetingAudio(meeting.meeting_id)}
                                            className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold transition flex items-center gap-1"
                                          >
                                            <Mic size={9} /> Process Speakers
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* Speakers / Lines */}
                                      {meeting.transcript ? (
                                        meeting.transcript.split('\n').map((line, tIdx) => {
                                          if (!line.trim()) return null;
                                          
                                          const diarizationMatch = line.match(/^([^:]+):\s*(.*)$/);
                                          if (diarizationMatch) {
                                            const speakerName = diarizationMatch[1].trim();
                                            const speechText = diarizationMatch[2].trim();
                                            
                                            return (
                                              <div key={tIdx} className="border-l-2 border-slate-200 dark:border-white/10 pl-3 py-1 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all group relative">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                  <span className="font-extrabold text-[10px] text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                                    {speakerName}
                                                  </span>
                                                  <button
                                                    onClick={() => {
                                                      setRenameSpeakerMeetingId(meeting.meeting_id);
                                                      setRenameSpeakerOldLabel(speakerName);
                                                      setShowRenameSpeakerModal(true);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition p-0.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                                    title="Rename Speaker"
                                                  >
                                                    <Edit2 size={9} />
                                                  </button>
                                                </div>
                                                <p className="text-slate-700 dark:text-gray-300 font-medium text-xs leading-relaxed">{speechText}</p>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                            <p key={tIdx} className="text-slate-600 dark:text-gray-400 font-medium">{line}</p>
                                          );
                                        })
                                      ) : (
                                        <p className="italic text-slate-400">No transcript text loaded.</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Side Actions: RSVP, Edit, Delete, Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-3 sm:pt-0">
                      {/* Left side of actions row (Time & Edit/Delete on mobile, Time only on desktop) */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                          <Clock size={12} />
                          {evt.time}
                        </span>
                        
                        {/* Edit / Delete actions on mobile */}
                        {isAdmin && (
                          <div className="flex sm:hidden items-center gap-0.5">
                            <button
                              disabled={expired}
                              onClick={() => setEditingMeeting(meeting)}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition disabled:opacity-30"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Edit / Delete actions on desktop */}
                        {isAdmin && (
                          <div className="hidden sm:flex items-center gap-0.5">
                            <button
                              disabled={expired}
                              onClick={() => setEditingMeeting(meeting)}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition disabled:opacity-30"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteMeeting(meeting.meeting_id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}

                        {/* RSVP buttons */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            disabled={expired}
                            onClick={() => handleRsvp(meeting.meeting_id, 'YES')}
                            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold transition uppercase tracking-wider text-center ${
                              meeting.user_rsvp === 'YES'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            disabled={expired}
                            onClick={() => handleRsvp(meeting.meeting_id, 'NO')}
                            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold transition uppercase tracking-wider text-center ${
                              meeting.user_rsvp === 'NO'
                                ? 'bg-red-600 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                            }`}
                          >
                            No
                          </button>
                          <button
                            disabled={expired}
                            onClick={() => handleRsvp(meeting.meeting_id, 'MAYBE')}
                            className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold transition uppercase tracking-wider text-center ${
                              meeting.user_rsvp === 'MAYBE'
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                            }`}
                          >
                            Maybe
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (evt.type === 'booking') {
                const statusText = evt.raw?.is_paid ? 'Paid' : (evt.raw?.status || 'Confirmed');
                return (
                  <div
                    key={evt.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border border-y-slate-200/50 border-r-slate-200/50 border-l-4 border-l-blue-500 dark:border-y-white/[0.03] dark:border-r-white/[0.03] rounded-r-2xl transition duration-150 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Building size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-650 dark:text-blue-450">
                            Booking
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-semibold">
                            {evt.location}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">
                          {evt.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-2 sm:pt-0">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {evt.time}
                      </span>
                      <span className="text-[10px] px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 rounded-full font-black uppercase tracking-wider">
                        {statusText}
                      </span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    key={evt.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.02] border border-y-slate-200/50 border-r-slate-200/50 border-l-4 border-l-emerald-500 dark:border-y-white/[0.03] dark:border-r-white/[0.03] rounded-r-2xl transition duration-150 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-emerald-500/10 text-emerald-650 dark:text-emerald-400">
                            Private Note
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">
                          {evt.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-white/5 pt-2 sm:pt-0">
                      <span className="text-xs font-mono font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {evt.time}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm("Delete this personal note?")) {
                              setPersonalNotes(prev => prev.filter(n => n.note_id !== evt.raw.note_id));
                            }
                          }}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-405 hover:text-red-500 transition"
                          title="Delete Note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    );
  };

  const role = user?.role_name || user?.role || '';
  const isAdmin = ['super_admin', 'property_manager', 'board_member'].includes(role);

  const fetchMembers = async () => {
    if (!community?.community_id) return;
    try {
      const res = await API.get(`/user/community/${community.community_id}?limit=100`);
      setMembers(res.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  useEffect(() => {
    if (community?.community_id) {
      fetchData();
      if (isAdmin) {
        fetchMembers();
      }
    }
  }, [community, activeTab, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'meetings') {
        const [meetingsData, bookingsRes] = await Promise.all([
          getMeetings(community.community_id),
          API.get(`/amenity/booking/${community.community_id}?limit=100`).catch(() => ({ data: [] }))
        ]);
        setMeetings(meetingsData || []);
        setBookings(bookingsRes?.data || []);
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

  const isMeetingExpired = (meetingDateStr) => {
    if (!meetingDateStr) return true;
    return new Date() > new Date(meetingDateStr);
  };

  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;
    
    const isMeeting = selectedEvent.type === 'meeting';
    const isBooking = selectedEvent.type === 'booking';
    const isNote = selectedEvent.type === 'note';
    
    const meeting = isMeeting ? selectedEvent.raw : null;
    const booking = isBooking ? selectedEvent.raw : null;
    const note = isNote ? selectedEvent.raw : null;
    const expired = meeting ? isMeetingExpired(meeting.meeting_date) : false;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gradient-to-br dark:from-[#1E2E42] dark:to-[#162535] rounded-3xl p-6 w-full max-w-lg border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase ${
                isMeeting 
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' 
                  : isBooking 
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
              }`}>
                {isMeeting ? 'Public Meeting' : isBooking ? 'Amenity Booking' : 'Private Note'}
              </span>
              {isMeeting && (
                <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase ${
                  expired ? 'bg-slate-500/10 text-slate-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                }`}>
                  {expired ? 'Past' : 'Live'}
                </span>
              )}
            </div>
            <button 
              onClick={() => setSelectedEvent(null)} 
              className="text-slate-400 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {selectedEvent.title}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-gray-505 font-mono font-semibold mt-1">
                ⏱ {selectedEvent.time}
              </p>
            </div>

            {isMeeting && meeting && (
              <div className="space-y-4">
                {meeting.description && (
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-black/20 p-4 rounded-2xl border border-slate-200/40 dark:border-white/[0.02]">
                    {meeting.description}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {meeting.location && (
                    <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase block mb-1">📍 Location</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">{meeting.location}</span>
                    </div>
                  )}
                  {meeting.meeting_link && !expired && (
                    <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02] flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase block mb-1">🔗 Virtual Meeting Link</span>
                      <a
                        href={meeting.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        Join Virtual Call <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>

                {!expired && (
                  <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-505 uppercase block mb-3 text-center">Are you attending?</span>
                    <div className="flex gap-2 justify-center">
                      {[
                        { status: 'YES', label: 'Going', color: 'bg-emerald-600' },
                        { status: 'NO', label: 'Not Going', color: 'bg-red-600' },
                        { status: 'MAYBE', label: 'Maybe', color: 'bg-amber-500' }
                      ].map(rsvp => (
                        <button
                          key={rsvp.status}
                          onClick={async () => {
                            await handleRsvp(meeting.meeting_id, rsvp.status);
                            setSelectedEvent(prev => ({
                              ...prev,
                              raw: { ...prev.raw, user_rsvp: rsvp.status }
                            }));
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition uppercase tracking-wider ${
                            meeting.user_rsvp === rsvp.status
                              ? `${rsvp.color} text-white shadow-md`
                              : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                          }`}
                        >
                          {rsvp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(meeting.recording_url || meeting.transcript || meeting.summary) && (
                  <div className="p-4 bg-slate-150/50 dark:bg-black/30 rounded-2xl border border-slate-250/50 dark:border-white/[0.03] space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase block">🎙️ AI Audio & Transcription</span>
                    {meeting.recording_url && (
                      <audio 
                        src={getBaseUrl(meeting.recording_url)} 
                        controls 
                        className="w-full h-8 accent-blue-600"
                      />
                    )}
                    {meeting.summary && (
                      <div className="bg-white dark:bg-[#0D1B2A] rounded-xl p-3.5 border border-slate-200/60 dark:border-white/5 text-xs space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                        <strong className="text-slate-800 dark:text-white text-[10px] uppercase font-bold tracking-wider">AI Summary:</strong>
                        <p className="text-slate-600 dark:text-gray-300 leading-relaxed font-medium">{meeting.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isBooking && booking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-505 uppercase block mb-1">🏰 Amenity Booked</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{booking.amenity_name}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-505 uppercase block mb-1">👤 Booked By</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{booking.resident_name || 'Resident'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-550 uppercase block mb-1">🏢 Unit No.</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">Unit {booking.unit_no}</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-black/10 rounded-2xl border border-slate-200/50 dark:border-white/[0.02]">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-550 uppercase block mb-1">💵 Booking Status</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-450">{booking.is_paid ? 'Paid' : 'Paid & Confirmed'}</span>
                  </div>
                </div>
              </div>
            )}

            {isNote && note && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/[0.02] flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-550 uppercase block">🔒 Note Visibility</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white">Visible only to you</span>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this personal note?")) {
                        setPersonalNotes(prev => prev.filter(n => n.note_id !== note.note_id));
                        setSelectedEvent(null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-xs font-bold rounded-xl transition border border-red-500/20"
                  >
                    <Trash2 size={13} /> Delete Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="text-slate-900 dark:text-white">
      {/* Compact Page Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-3 border-b border-slate-200/60 dark:border-white/5">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Meetings & Surveys
        </h1>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {activeTab === 'meetings' ? (
              <button
                onClick={() => setShowMeetingModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/25 whitespace-nowrap"
              >
                <Plus size={13} /> Schedule Meeting
              </button>
            ) : (
              <button
                onClick={() => setShowSurveyModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-blue-500/25 whitespace-nowrap"
              >
                <Plus size={13} /> Create Survey
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
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:text-white shadow-md shadow-blue-500/20' 
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
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-gray-400 font-mono text-sm">LOADING...</p>
        </div>
      ) : activeTab === 'meetings' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Mini Calendar & Calendar Toggles */}
          <div className="lg:col-span-4 lg:sticky lg:top-4">
            {renderMiniCalendar()}
            {renderCalendarsToggle()}
          </div>

          {/* Right Column: Planner Center Area */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Planner Header Console */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white uppercase tracking-wider">
                  {plannerView === 'year' 
                    ? currentMonth.getFullYear()
                    : currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })
                  }
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavigate('prev')}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-400"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today);
                      setCurrentMonth(today);
                    }}
                    className="px-3 py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-300 hover:border-blue-500 rounded-xl text-xs font-bold transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleNavigate('next')}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 dark:text-gray-455"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* View Selector Toggle (Month, Week, Day, Year) */}
              <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl gap-0.5">
                {[
                  { key: 'month', label: 'Month' },
                  { key: 'week', label: 'Week' },
                  { key: 'list', label: 'Day' },
                  { key: 'year', label: 'Year' }
                ].map(view => (
                  <button
                    key={view.key}
                    type="button"
                    onClick={() => setPlannerView(view.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      plannerView === view.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Quick Add Bar */}
            <form onSubmit={handleQuickAddSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickAddTaskText}
                  onChange={(e) => setQuickAddTaskText(e.target.value)}
                  placeholder={isAdmin && quickAddType === 'meeting' ? "Type to create public Board meeting..." : "Type to create private Personal Schedule note..."}
                  className="w-full bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
                <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-gray-500" />
              </div>
              
              <div className="flex gap-2 self-stretch">
                {isAdmin && (
                  <select
                    value={quickAddType}
                    onChange={(e) => setQuickAddType(e.target.value)}
                    className="bg-slate-50 dark:bg-[#0D1B2A] border border-slate-200 dark:border-white/10 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-700 dark:text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="meeting">📢 Public Meeting</option>
                    <option value="note">🔒 Private Note</option>
                  </select>
                )}
                
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-blue-500/20 active:scale-95 flex-shrink-0"
                >
                  Create
                </button>
              </div>
            </form>

            {/* Live Filter Pills Row */}
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 p-3 rounded-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-2">Show events:</span>
              <button
                type="button"
                onClick={() => setSelectedCalendars({ meetings: true, bookings: true, notes: true })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  selectedCalendars.meetings && selectedCalendars.bookings && selectedCalendars.notes
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                    : 'bg-white dark:bg-white/5 text-slate-700 dark:text-gray-300 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                🌈 All
              </button>
              
              <button
                type="button"
                onClick={() => setSelectedCalendars(prev => ({ ...prev, meetings: !prev.meetings }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  selectedCalendars.meetings
                    ? 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-650 dark:text-purple-400 border-purple-500/30'
                    : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-white/10 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Meetings ({meetings?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCalendars(prev => ({ ...prev, bookings: !prev.bookings }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  selectedCalendars.bookings
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
                    : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-white/10 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Bookings ({bookings?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setSelectedCalendars(prev => ({ ...prev, notes: !prev.notes }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  selectedCalendars.notes
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-white dark:bg-white/5 text-slate-400 dark:text-gray-500 border-slate-200 dark:border-white/10 opacity-60'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Personal Notes ({personalNotes?.length || 0})
              </button>
            </div>

            {/* ── Dynamic Calendar Views ── */}
            <div className="space-y-6">
              {plannerView === 'month' && renderMonthGrid()}
              {plannerView === 'week' && renderWeekGrid()}
              {plannerView === 'list' && renderDayDetailView()}
              {plannerView === 'year' && renderYearGrid()}
            </div>


            {/* Past Meetings Archive Section */}
            {meetings.some(m => isMeetingExpired(m.meeting_date)) && (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#1E2E42] dark:to-[#162535] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm mt-8">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider mb-4 pb-2 border-b border-slate-200/60 dark:border-white/[0.05]">
                  📚 Past Meetings Archive & Transcripts
                </h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {meetings
                    .filter(m => isMeetingExpired(m.meeting_date))
                    .map((meeting) => (
                      <div 
                        key={meeting.meeting_id}
                        className="p-4 bg-white/40 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.05] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-purple-500/20 transition-all duration-200"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[10px] text-slate-505 text-slate-500 bg-slate-500/10 px-2.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                              Past Meeting
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-semibold">
                              {new Date(meeting.meeting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(meeting.meeting_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-800 dark:text-white truncate">{meeting.title}</h4>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDate(new Date(meeting.meeting_date));
                            setCurrentMonth(new Date(meeting.meeting_date));
                          }}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm whitespace-nowrap self-end md:self-auto"
                        >
                          View Details & Transcripts
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
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
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-[#5BA4F5]'
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
                                    <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">Your Vote</span>
                                  )}
                                </span>
                                <span>{percentage}% ({option.vote_count} votes)</span>
                              </div>
                              <div className="w-full bg-slate-200/50 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                                <div
                                  className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
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
                              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl text-left text-sm font-semibold text-slate-800 dark:text-white transition flex items-center justify-between border border-transparent hover:border-blue-500/30"
                            >
                              <span>{option.option_text}</span>
                              <span className="text-blue-600 dark:text-blue-400 text-xs opacity-0 hover:opacity-100 transition-opacity">Vote →</span>
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
      {showRecorderModal && recordingMeeting && (
        <MeetingRecorderModal
          meeting={recordingMeeting}
          onClose={() => { setShowRecorderModal(false); setRecordingMeeting(null); }}
          onSuccess={fetchData}
        />
      )}
      {showRenameSpeakerModal && renameSpeakerMeetingId && (
        <RenameSpeakerModal
          meetingId={renameSpeakerMeetingId}
          oldLabel={renameSpeakerOldLabel}
          members={members}
          onClose={() => { setShowRenameSpeakerModal(false); setRenameSpeakerMeetingId(null); setRenameSpeakerOldLabel(''); }}
          onSuccess={fetchData}
        />
      )}
      {selectedEvent && renderEventDetailsModal()}
    </div>
  );
};

export default Meetings;
