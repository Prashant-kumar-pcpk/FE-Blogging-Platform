import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://be-blogging-platform-1.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  resetPassword: (passwordData) => api.post('/auth/reset-password', passwordData),
};

export const postsAPI = {
  getAllPosts: () => api.get('/posts'),
  getCategories: () => api.get('/posts/categories'),
  getMyPosts: () => api.get('/posts/me'),
  getCategoryPosts: (slug) => api.get(`/posts/category/${slug}`),
  getPostBySlug: (slug) => api.get(`/posts/${slug}`),
  createPost: (postData) => api.post('/posts', postData),
  getComments: (slug) => api.get(`/posts/${slug}/comments`),
  createComment: (slug, commentData) => api.post(`/posts/${slug}/comments`, commentData),
  deleteComment: (slug, commentId) => api.delete(`/posts/${slug}/comments/${commentId}`),
};

export default api;
