import api from './axios';

// ==================== AUTH ====================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
  getOnlineStatus: (userId) => api.get(`/auth/users/${userId}/online-status`),
};

// ==================== DASHBOARD ====================
export const dashboardAPI = {
  getWorkerStats: () => api.get('/dashboard/worker'),
  getCompanyStats: () => api.get('/dashboard/company'),
};

// ==================== JOBS ====================
export const jobsAPI = {
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  search: (params) => api.get('/jobs/search', { params }),
  getUrgent: () => api.get('/jobs/urgent'),
  getNearby: (params) => api.get('/jobs/nearby', { params }),
  getRecommended: () => api.get('/jobs/feed/recommended'),
  getMy: (params) => api.get('/jobs/manage/my', { params }),
};

// ==================== WORKERS ====================
export const workersAPI = {
  getAll: (params) => api.get('/workers', { params }),
  getById: (id) => api.get(`/workers/${id}`),
  update: (id, data) => api.put(`/workers/${id}`, data),
  search: (params) => api.get('/workers/search', { params }),
  getNearby: (params) => api.get('/workers/nearby', { params }),
  getSuggested: (jobId) => api.get(`/workers/suggested/${jobId}`),
  toggleAvailability: (id, data) => api.put(`/workers/${id}/availability`, data),
};

// ==================== APPLICATIONS ====================
export const applicationsAPI = {
  apply: (data) => api.post('/applications', data),
  applyJob: (data) => api.post('/apply-job', data),
  getMy: (params) => api.get('/applications/my', { params }),
  getForJob: (jobId) => api.get(`/applications/job/${jobId}`),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
};

// ==================== HIRES ====================
export const hiresAPI = {
  send: (data) => api.post('/hires', data),
  bulkHire: (data) => api.post('/hires/bulk', data),
  getForWorker: (params) => api.get('/hires/worker', { params }),
  getByCompany: (params) => api.get('/hires/company', { params }),
  respond: (id, data) => api.put(`/hires/${id}/respond`, data),
};

// ==================== RATINGS ====================
export const ratingsAPI = {
  create: (data) => api.post('/ratings', data),
  getForUser: (userId) => api.get(`/ratings/user/${userId}`),
};

// ==================== CHAT ====================
export const chatAPI = {
  getRooms: () => api.get('/chat/rooms'),
  getOrCreateRoom: (data) => api.post('/chat/room', data),
  getMessages: (roomId, params) => api.get(`/chat/room/${roomId}/messages`, { params }),
  sendMessage: (roomId, data) => api.post(`/chat/room/${roomId}/messages`, data),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

// ==================== SETTINGS ====================
export const settingsAPI = {
  getSocialLinks: () => api.get('/settings/social-links'),
  updateSocialLinks: (data) => api.put('/settings/social-links', data),
  getUserSettings: () => api.get('/settings/user'),
  updateUserSettings: (data) => api.put('/settings/user', data),
};

// ==================== WALLET ====================
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  withdraw: (data) => api.post('/wallet/withdraw', data),
};

// ==================== EVENTS ====================
export const eventsAPI = {
  create: (data) => api.post('/events/create', data),
  update: (id, data) => api.put(`/events/update/${id}`, data),
  delete: (id) => api.delete(`/events/delete/${id}`),
  getCompanyEvents: () => api.get('/events/company'),
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  register: (data) => api.post('/events/register', data),
  checkin: (data) => api.post('/events/checkin', data),
  getAnalytics: (id) => api.get(`/events/${id}/analytics`),
  bookSlot: (id, data) => api.post(`/events/${id}/book-slot`, data),
  updateCandidateStatus: (id, registrationId, data) => api.put(`/events/${id}/candidates/${registrationId}/status`, data),
  bulkUpdateCandidateStatus: (id, data) => api.put(`/events/${id}/candidates/bulk-status`, data),
  getChat: (id) => api.get(`/events/${id}/chat`),
  sendChatMessage: (id, data) => api.post(`/events/${id}/chat`, data),
  getCertificate: (id) => api.get(`/events/${id}/certificate`),
};
