import API from './api';

// Fetch all contracts (Super Admin / Sales Admin only)
export const getContracts = async (skip = 0, limit = 100) => {
  const res = await API.get('/contracts', { params: { skip, limit } });
  return res.data;
};

// Fetch single contract by ID
export const getContract = async (id) => {
  const res = await API.get(`/contracts/${id}`);
  return res.data;
};

// Create a new contract (Super Admin / Sales Admin only)
export const createContract = async (data) => {
  const res = await API.post('/contracts', data);
  return res.data;
};

// Update an existing contract (Super Admin / Sales Admin only)
export const updateContract = async (id, data) => {
  const res = await API.put(`/contracts/${id}`, data);
  return res.data;
};

// Delete a contract (Super Admin / Sales Admin only)
export const deleteContract = async (id) => {
  const res = await API.delete(`/contracts/${id}`);
  return res.data;
};


// Verify contract code (Public endpoint)
export const verifyContractCode = async (code) => {
  const res = await API.get(`/contracts/code/${code}`);
  return res.data;
};

// Fetch mathematical captcha (Public endpoint)
export const getCaptcha = async (config = {}) => {
  const res = await API.get('/auth/captcha', config);
  return res.data;
};

// Onboard client (Public endpoint)
export const onboardClient = async (data) => {
  const res = await API.post('/auth/onboard-client', data);
  return res.data;
};
