import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

// Alerts API
export const alertsAPI = {
    getAll: (params) => api.get('/alerts', { params }),
    getById: (id) => api.get(`/alerts/${id}`),
    create: (data) => api.post('/alerts', data),
    update: (id, data) => api.put(`/alerts/${id}`, data),
    delete: (id) => api.delete(`/alerts/${id}`),
    getStats: () => api.get('/alerts/stats/summary'),
};

// Incidents API
export const incidentsAPI = {
    getAll: (params) => api.get('/incidents', { params }),
    getById: (id) => api.get(`/incidents/${id}`),
    create: (data) => api.post('/incidents', data),
    update: (id, data) => api.put(`/incidents/${id}`, data),
    delete: (id) => api.delete(`/incidents/${id}`),
};

// Contacts API
export const contactsAPI = {
    getAll: () => api.get('/contacts'),
    getById: (id) => api.get(`/contacts/${id}`),
    create: (data) => api.post('/contacts', data),
    update: (id, data) => api.put(`/contacts/${id}`, data),
    delete: (id) => api.delete(`/contacts/${id}`),
};

export default api;
