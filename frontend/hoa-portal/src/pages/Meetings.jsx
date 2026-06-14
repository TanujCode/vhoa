import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar, Video, MapPin, Users, CheckCircle, Clock, ExternalLink, Edit2, Trash2, Mic, Play, Pause, Square, MessageSquare, Volume2 } from 'lucide-react';
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
  diarizeMeetingAudio
} from '../services/meetingSurveyService';
import { getBaseUrl } from '../services/api';

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
              <h4 className="text-sm font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">Active Meeting</h4>
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
                      ? 'border-teal-500 bg-teal-500/5 text-teal-600 dark:text-teal-400 font-bold'
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
                      ? 'border-teal-500 bg-teal-500/5 text-teal-600 dark:text-teal-400 font-bold'
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
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-2xl font-bold transition shadow-lg shadow-teal-500/20"
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
                      className="p-4 bg-teal-600/10 hover:bg-teal-600/25 text-teal-600 dark:text-teal-400 rounded-2xl font-bold transition animate-bounce"
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
              <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
              <Mic size={24} className="text-teal-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
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
                    <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-ping"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-gray-600 rounded-full"></span>
                  )}
                  <span className={`font-semibold ${
                    processingStep === idx 
                      ? 'text-teal-600 dark:text-teal-400' 
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

  const isMeetingExpired = (meetingDateStr) => {
    if (!meetingDateStr) return true;
    return new Date() > new Date(meetingDateStr);
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
            {meetings.map((meeting) => {
              const expired = isMeetingExpired(meeting.meeting_date);
              return (
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
                      {meeting.meeting_link && !expired && (
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
                            disabled={expired}
                            onClick={() => setEditingMeeting(meeting)}
                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                            title={expired ? "Meeting has ended and cannot be edited" : "Edit Meeting"}
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
                    
                    {/* Recording & Transcript Block */}
                    {(meeting.recording_url || meeting.transcript || meeting.summary) && (
                      <div className="mt-4 p-4 bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-3">
                        {meeting.recording_url && (
                          <div className="flex items-center gap-3">
                            <Volume2 size={16} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />
                            <audio 
                              src={getBaseUrl(meeting.recording_url)} 
                              controls 
                              className="w-full max-w-md h-8 text-xs accent-teal-600"
                            />
                          </div>
                        )}
                        {(meeting.summary || meeting.transcript) && (
                          <div>
                            <button
                              onClick={() => setExpandedTranscriptMeetingId(expandedTranscriptMeetingId === meeting.meeting_id ? null : meeting.meeting_id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                            >
                              <MessageSquare size={14} />
                              {expandedTranscriptMeetingId === meeting.meeting_id ? 'Hide AI Summary & Transcript' : 'View AI Summary & Transcript'}
                            </button>
                            
                            {expandedTranscriptMeetingId === meeting.meeting_id && (
                              <div className="mt-3 space-y-3">
                                {/* Tab Selectors */}
                                <div className="flex gap-2 border-b border-slate-200/50 dark:border-white/5 pb-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveMeetingTab({ ...activeMeetingTab, [meeting.meeting_id]: 'summary' })}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                      (activeMeetingTab[meeting.meeting_id] || 'summary') === 'summary'
                                        ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                                    }`}
                                  >
                                    📝 AI Summary & Action Items
                                  </button>
                                  {meeting.transcript && (
                                    <button
                                      type="button"
                                      onClick={() => setActiveMeetingTab({ ...activeMeetingTab, [meeting.meeting_id]: 'transcript' })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                        activeMeetingTab[meeting.meeting_id] === 'transcript'
                                          ? 'bg-teal-600/10 text-teal-600 dark:text-teal-400 shadow-sm'
                                          : 'text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white'
                                      }`}
                                    >
                                      🗣️ Full AI Transcript
                                    </button>
                                  )}
                                </div>

                                {/* Tab Contents */}
                                {(activeMeetingTab[meeting.meeting_id] || 'summary') === 'summary' ? (
                                  /* Summary Content */
                                  <div className="bg-white dark:bg-[#0D1B2A] rounded-xl p-4 border border-slate-200/60 dark:border-white/5 text-xs leading-relaxed space-y-2 max-h-60 overflow-y-auto custom-scrollbar text-slate-700 dark:text-gray-300 font-medium">
                                    {meeting.summary ? (
                                      meeting.summary.split('\n').map((line, sIdx) => {
                                        if (!line.trim()) return null;
                                        // Format bullet points beautifully
                                        if (line.startsWith('•') || line.startsWith('*')) {
                                          const cleanLine = line.replace(/^[•*\s]+/, '');
                                          
                                          // Parse bold markers **
                                          const boldRegex = /\*\*(.*?)\*\*/g;
                                          const parts = [];
                                          let lastIndex = 0;
                                          let match;
                                          while ((match = boldRegex.exec(cleanLine)) !== null) {
                                            if (match.index > lastIndex) {
                                              parts.push(cleanLine.substring(lastIndex, match.index));
                                            }
                                            parts.push(<strong key={match.index} className="text-teal-600 dark:text-teal-400 font-bold">{match[1]}</strong>);
                                            lastIndex = boldRegex.lastIndex;
                                          }
                                          if (lastIndex < cleanLine.length) {
                                            parts.push(cleanLine.substring(lastIndex));
                                          }

                                          return (
                                            <div key={sIdx} className="flex gap-2 items-start pl-1">
                                              <span className="text-teal-500 flex-shrink-0 mt-0.5 font-bold">✓</span>
                                              <span>{parts.length > 0 ? parts : cleanLine}</span>
                                            </div>
                                          );
                                        }
                                        return <p key={sIdx}>{line}</p>;
                                      })
                                    ) : (
                                      <p className="text-slate-400 dark:text-gray-500 italic">No summary generated for this meeting.</p>
                                    )}
                                  </div>
                                ) : (
                                  /* Transcript Content */
                                  <div className="bg-white dark:bg-[#0D1B2A] rounded-xl p-4 border border-slate-200/60 dark:border-white/5 max-h-60 overflow-y-auto custom-scrollbar text-xs leading-relaxed space-y-2.5">
                                    {meeting.transcript.split('\n').map((line, lIdx) => {
                                      if (!line.trim()) return null;
                                      
                                      if (line.startsWith('[') && line.endsWith(']')) {
                                        return (
                                          <p key={lIdx} className="text-slate-400 dark:text-gray-500 font-mono italic text-[10px] text-center border-b border-slate-250/20 pb-1.5 mb-2">
                                            {line}
                                          </p>
                                        );
                                      }
                                      
                                      const colonIdx = line.indexOf(':');
                                      if (colonIdx > 0) {
                                        const speaker = line.slice(0, colonIdx);
                                        const speech = line.slice(colonIdx + 1);
                                        return (
                                          <div key={lIdx} className="flex flex-col gap-0.5">
                                            <span className="font-bold text-teal-600 dark:text-teal-400 tracking-wide">{speaker}</span>
                                            <span className="text-slate-700 dark:text-gray-300 bg-slate-50 dark:bg-white/5 px-2.5 py-1.5 rounded-lg border-l-2 border-teal-500">{speech}</span>
                                          </div>
                                        );
                                      }
                                      return <p key={lIdx} className="text-slate-700 dark:text-gray-300">{line}</p>;
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Record Meeting Button for admins if transcript doesn't exist */}
                    {!meeting.transcript && isAdmin && (
                      <div className="pt-1">
                        {expired ? (
                          <span className="text-slate-400 dark:text-gray-500 text-xs italic flex items-center gap-1.5 pt-1">
                            <Clock size={12} /> Meeting has ended. Recording is disabled.
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setRecordingMeeting(meeting);
                              setShowRecorderModal(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/10 hover:bg-teal-600 text-teal-600 hover:text-white dark:text-teal-400 dark:hover:text-white text-xs font-semibold rounded-xl transition border border-teal-500/20"
                          >
                            <Mic size={14} /> Record & Process AI Transcript
                          </button>
                        )}
                      </div>
                    )}

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
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1 text-center md:text-left flex items-center gap-1.5">
                      Your Attendance:
                      {expired && (
                        <span className="text-[9px] uppercase bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-gray-400 px-1.5 py-0.5 rounded font-bold">
                          Ended
                        </span>
                      )}
                    </span>
                    <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                      <button
                        disabled={expired}
                        onClick={() => handleRsvp(meeting.meeting_id, 'YES')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          meeting.user_rsvp === 'YES'
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                        }`}
                      >
                        <CheckCircle size={12} /> Yes
                      </button>
                      <button
                        disabled={expired}
                        onClick={() => handleRsvp(meeting.meeting_id, 'NO')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                          meeting.user_rsvp === 'NO'
                            ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300'
                        }`}
                      >
                        No
                      </button>
                      <button
                        disabled={expired}
                        onClick={() => handleRsvp(meeting.meeting_id, 'MAYBE')}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
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
              );
            })}
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
      {showRecorderModal && recordingMeeting && (
        <MeetingRecorderModal
          meeting={recordingMeeting}
          onClose={() => { setShowRecorderModal(false); setRecordingMeeting(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Meetings;
