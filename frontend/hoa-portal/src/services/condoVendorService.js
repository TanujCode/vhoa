import API from './api';

// Onboard new condo vendor
export const onboardCondoVendor = async (data) => {
  const res = await API.post('/condo/vendor', data);
  return res.data;
};

// Fetch all condo vendors in the community
export const getCondoVendors = async (communityId, params = {}) => {
  const res = await API.get(`/condo/vendor/${communityId}`, { params });
  return res.data;
};

// Fetch details of a specific condo vendor
export const getCondoVendorDetail = async (vendorId) => {
  const res = await API.get(`/condo/vendor/detail/${vendorId}`);
  return res.data;
};

// Update a condo vendor
export const updateCondoVendor = async (vendorId, data) => {
  const res = await API.put(`/condo/vendor/${vendorId}`, data);
  return res.data;
};

// Delete a condo vendor
export const deleteCondoVendor = async (vendorId) => {
  const res = await API.delete(`/condo/vendor/${vendorId}`);
  return res.data;
};

// Generate a one-time use vendor access code
export const generateCondoVendorAccessCode = async (vendorId) => {
  const res = await API.post(`/condo/vendor/${vendorId}/access-code`);
  return res.data;
};

// Generate a contract code
export const generateCondoVendorContractCode = async (vendorId) => {
  const res = await API.post(`/condo/vendor/${vendorId}/contract-code`);
  return res.data;
};

// Verify a vendor access code
export const verifyCondoVendorAccessCode = async (accessCode, communityId) => {
  const res = await API.post('/condo/vendor/verify-access-code', null, {
    params: { access_code: accessCode, community_id: communityId }
  });
  return res.data;
};

// Assign a vendor to a request
export const assignCondoVendor = async (data) => {
  const res = await API.post('/condo/vendor/assignment', data);
  return res.data;
};

// View condo vendor assignments
export const getCondoAssignments = async (communityId, params = {}) => {
  const res = await API.get(`/condo/vendor/assignment/${communityId}`, { params });
  return res.data;
};

// Update a condo vendor assignment
export const updateCondoAssignment = async (assignmentId, data) => {
  const res = await API.put(`/condo/vendor/assignment/${assignmentId}`, data);
  return res.data;
};

// Submit feedback for a vendor
export const giveCondoVendorFeedback = async (data) => {
  const res = await API.post('/condo/vendor/feedback', data);
  return res.data;
};
