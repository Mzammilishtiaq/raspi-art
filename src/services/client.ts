import axios from 'axios';

const api = axios.create({
  baseURL: '/api',     // all requests will be prefixed with /api
  timeout: 30000,      // 30s timeout
});

export default api;
