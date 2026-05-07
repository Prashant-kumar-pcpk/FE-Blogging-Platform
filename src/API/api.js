import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:9090/api';
const TOKEN_STORAGE_KEY = 'token';
const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let refreshPromise = null;

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);
export const getStoredRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

export const persistSession = ({ token, refreshToken }) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
};

const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error('No refresh token available.');
  }

  if (!refreshPromise) {
    refreshPromise = axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        persistSession({
          token: response.data.token,
          refreshToken: response.data.refreshToken
        });
        setAuthToken(response.data.token);
        return response.data;
      })
      .catch((error) => {
        clearSession();
        setAuthToken(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401
      && !originalRequest?._retry
      && !originalRequest?.url?.includes('/auth/login')
      && !originalRequest?.url?.includes('/auth/register')
      && !originalRequest?.url?.includes('/auth/refresh')
      && !originalRequest?.url?.includes('/auth/reset-password')
      && getStoredRefreshToken()
    ) {
      try {
        originalRequest._retry = true;
        const session = await refreshAccessToken();
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${session.token}`
        };
        return api(originalRequest);
      } catch (refreshError) {
        const refreshMessage = refreshError.response?.data?.message || refreshError.message || 'Session expired';
        return Promise.reject({ ...refreshError, message: refreshMessage });
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject({ ...error, message });
  }
);

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
  refreshSession: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  resetPassword: (passwordData) => api.post('/auth/reset-password', passwordData),
  getMyComments: () => api.get('/auth/comments'),
  deleteMyComment: (commentId) => api.delete(`/auth/comments/${commentId}`),
  followUser: (userId) => api.post(`/auth/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/auth/follow/${userId}`),
  getBookmarks: () => api.get('/auth/bookmarks'),
  addBookmark: (postId) => api.post('/auth/bookmarks', { postId }),
  removeBookmark: (postId) => api.delete('/auth/bookmarks', { data: { postId } }),
  isPostBookmarked: (postId) => api.get(`/auth/bookmarks/${postId}`),
};

const isNotFound = (error) => error?.response?.status === 404;

const tryGetPaths = async (paths, defaultData) => {
  let lastError;

  for (const path of paths) {
    try {
      return await api.get(path);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (typeof defaultData !== 'undefined') {
    return { data: defaultData };
  }

  throw lastError;
};

const tryPostPaths = async (paths, data, defaultData) => {
  let lastError;

  for (const path of paths) {
    try {
      return await api.post(path, data);
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (typeof defaultData !== 'undefined') {
    return { data: defaultData };
  }

  throw lastError;
};

export const postsAPI = {
  getAllPosts: (page = 1, limit = 10, filters = {}) => api.get('/posts', { params: { page, limit, ...filters } }),
  getAuthors: () => api.get('/posts/authors'),
  searchPosts: (query, filters = {}) => api.get('/posts', { params: { q: query, ...filters } }),
  getCategories: () => api.get('/posts/categories'),
  createCategory: (categoryData) => api.post('/posts/categories', categoryData),
  updateCategory: (categoryId, categoryData) => api.put(`/posts/categories/${categoryId}`, categoryData),
  deleteCategory: (categoryId) => api.delete(`/posts/categories/${categoryId}`),
  getTags: () => api.get('/posts/tags'),
  getMyPosts: () => api.get('/posts/me'),
  getMyPostById: (postId) => api.get(`/posts/manage/${postId}`),
  getCategoryPosts: (slug) => api.get(`/posts/category/${slug}`),
  getTagPosts: (slug) => api.get(`/posts/tag/${slug}`),
  getAuthorByUsername: (username) => api.get(`/posts/author/${username}`),
  getRelatedPosts: (slug) =>
    tryGetPaths(
      [
        `/posts/${encodeURIComponent(slug)}/related`,
        `/posts/related/${encodeURIComponent(slug)}`
      ],
      { relatedPosts: [] }
    ),
  getPostBySlug: (slug) => api.get(`/posts/${encodeURIComponent(slug)}`),
  createPost: (postData) => api.post('/posts', postData),
  updatePost: (postId, postData) => api.put(`/posts/manage/${postId}`, postData),
  getComments: (slug) =>
    tryGetPaths([
      `/comments/post/${encodeURIComponent(slug)}`,
      `/posts/${encodeURIComponent(slug)}/comments`,
      `/posts/comments/${encodeURIComponent(slug)}`
    ]),
  createComment: (slug, commentData) =>
    tryPostPaths([
      `/comments/post/${encodeURIComponent(slug)}`,
      `/posts/${encodeURIComponent(slug)}/comments`,
      `/posts/comments/${encodeURIComponent(slug)}`
    ], commentData),
  updateComment: (slug, commentId, commentData) =>
    api.put(`/comments/${commentId}`, commentData).catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }

      return api.put(`/posts/${encodeURIComponent(slug)}/comments/${commentId}`, commentData);
    }),
  getCommentsForModeration: (slug) => api.get(`/posts/${encodeURIComponent(slug)}/comments/moderation`),
  moderateComment: (slug, commentId, action) => api.patch(`/posts/${encodeURIComponent(slug)}/comments/${commentId}/moderate`, { action }),
  deleteComment: (slug, commentId) =>
    api.delete(`/comments/${commentId}`).catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }

      return api.delete(`/posts/${encodeURIComponent(slug)}/comments/${commentId}`);
    }),
  toggleCommentLike: (commentId) =>
    api.post(`/comments/${commentId}/like`).catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }

      return { data: { liked: false, likeCount: 0, unsupported: true } };
    }),
  replyToComment: (commentId, payload) =>
    api.post(`/comments/${commentId}/reply`, payload).catch((error) => {
      if (!isNotFound(error)) {
        throw error;
      }

      return { data: { unsupported: true } };
    }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  toggleLike: (slug) =>
    tryPostPaths(
      [
        `/posts/${encodeURIComponent(slug)}/like`,
        `/posts/like/${encodeURIComponent(slug)}`
      ],
      undefined
    ),
  getLikes: (slug) =>
    tryGetPaths(
      [
        `/posts/${encodeURIComponent(slug)}/likes`,
        `/posts/likes/${encodeURIComponent(slug)}`
      ],
      { likeCount: 0, likes: [] }
    ),
  isPostLiked: (slug) =>
    tryGetPaths(
      [
        `/posts/${encodeURIComponent(slug)}/like/check`,
        `/posts/like/${encodeURIComponent(slug)}/check`
      ],
      { isLiked: false, likeCount: 0, unsupported: true }
    ),
};

export default api;
