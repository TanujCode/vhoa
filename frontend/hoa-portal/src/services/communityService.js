import API from './api';

export const getCommunities = async () => {
  const res = await API.get('/community');
  return res.data;
};

export const getCommunity = async (id) => {
  const res = await API.get(`/community/${id}`);
  return res.data;
};

export const getCommunityStats = async (id) => {
  const res = await API.get(`/community/${id}/stats`);
  return res.data;
};