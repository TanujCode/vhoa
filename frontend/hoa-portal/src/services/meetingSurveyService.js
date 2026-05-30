import API from './api';

export const getMeetings = async (communityId) => {
  const res = await API.get(`/meeting-survey/meetings?community_id=${communityId}`);
  return res.data;
};

export const createMeeting = async (data) => {
  const res = await API.post('/meeting-survey/meetings', data);
  return res.data;
};

export const submitMeetingRsvp = async (meetingId, status) => {
  const res = await API.post(`/meeting-survey/meetings/${meetingId}/rsvp`, { status });
  return res.data;
};

export const getSurveys = async (communityId) => {
  const res = await API.get(`/meeting-survey/surveys?community_id=${communityId}`);
  return res.data;
};

export const createSurvey = async (data) => {
  const res = await API.post('/meeting-survey/surveys', data);
  return res.data;
};

export const voteOnSurvey = async (surveyId, optionId) => {
  const res = await API.post(`/meeting-survey/surveys/${surveyId}/vote`, { option_id: optionId });
  return res.data;
};

export const updateMeeting = async (meetingId, data) => {
  const res = await API.put(`/meeting-survey/meetings/${meetingId}`, data);
  return res.data;
};

export const deleteMeeting = async (meetingId) => {
  const res = await API.delete(`/meeting-survey/meetings/${meetingId}`);
  return res.data;
};

export const updateSurvey = async (surveyId, data) => {
  const res = await API.put(`/meeting-survey/surveys/${surveyId}`, data);
  return res.data;
};

export const deleteSurvey = async (surveyId) => {
  const res = await API.delete(`/meeting-survey/surveys/${surveyId}`);
  return res.data;
};
