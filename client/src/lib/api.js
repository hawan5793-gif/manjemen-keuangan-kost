import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kostkas_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use((response) => response);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: (params) => api.get('/transactions/summary', { params }),
};

// Budget API
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Savings Goals API
export const savingsAPI = {
  getAll: () => api.get('/savings-goals'),
  getById: (id) => api.get(`/savings-goals/${id}`),
  create: (data) => api.post('/savings-goals', data),
  update: (id, data) => api.put(`/savings-goals/${id}`, data),
  delete: (id) => api.delete(`/savings-goals/${id}`),
  addDeposit: (id, amount) => api.post(`/savings-goals/${id}/deposits`, { amount }),
};

// Debts API
export const debtsAPI = {
  getAll: () => api.get('/debts'),
  getById: (id) => api.get(`/debts/${id}`),
  create: (data) => api.post('/debts', data),
  update: (id, data) => api.put(`/debts/${id}`, data),
  delete: (id) => api.delete(`/debts/${id}`),
};

// Reminders API
export const remindersAPI = {
  getAll: () => api.get('/reminders'),
  getById: (id) => api.get(`/reminders/${id}`),
  create: (data) => api.post('/reminders', data),
  update: (id, data) => api.put(`/reminders/${id}`, data),
  delete: (id) => api.delete(`/reminders/${id}`),
  markPaid: (id) => api.post(`/reminders/${id}/paid`),
};

export default api;
