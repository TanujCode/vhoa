import API from './api';

// Fetch all condo contracts (Super Admin / Sales Admin only)
export const getCondoContracts = async (skip = 0, limit = 100) => {
  const res = await API.get('/condo/contracts', { params: { skip, limit } });
  return res.data;
};

// Fetch single condo contract by ID
export const getCondoContract = async (id) => {
  const res = await API.get(`/condo/contracts/${id}`);
  return res.data;
};

// Create a new condo contract (Super Admin / Sales Admin only)
export const createCondoContract = async (data) => {
  const res = await API.post('/condo/contracts', data);
  return res.data;
};

// Update an existing condo contract (Super Admin / Sales Admin only)
export const updateCondoContract = async (id, data) => {
  const res = await API.put(`/condo/contracts/${id}`, data);
  return res.data;
};

// Delete a condo contract (Super Admin / Sales Admin only)
export const deleteCondoContract = async (id) => {
  const res = await API.delete(`/condo/contracts/${id}`);
  return res.data;
};

// Verify condo contract code (Public endpoint)
export const verifyCondoContractCode = async (code) => {
  const res = await API.get(`/condo/contracts/code/${code}`);
  return res.data;
};

// Onboard condo client (Public endpoint)
export const onboardCondoClient = async (data) => {
  const res = await API.post('/condo/auth/onboard-client', data);
  return res.data;
};
