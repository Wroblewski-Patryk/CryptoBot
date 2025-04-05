import axios from 'axios';

const API_URL = 'http://localhost:3000/api/auth';

export const login = async (credentials) => {
  const res = await axios.post(`${API_URL}/login`, credentials);
  return res.data;
};