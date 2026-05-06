import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../API/api';
import RichTextEditor from '../component/RichTextEditor';

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const getMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return null;
};

const DRAFT_STORAGE_KEY = 'blogging-platform-draft';
const MAX_EXCERPT_LENGTH = 300;

const CreatePost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    categoryName: '',
    tags: '',
    status: 'draft'
  });
  const [customCategory, setCustomCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    fetchCategories();

    if (!isEditing) {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
          setCustomCategory(parsed.customCategory || '');
          setMediaFiles(parsed.mediaFiles || []);
        } catch (err) {
          console.error('Failed to load saved draft:', err);
        }
      }
    }
  }, [id, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ formData, customCategory, mediaFiles })
      );
    }
  }, [formData, customCategory, mediaFiles, isEditing]);

  const fetchCategories = async () => {
    try {
      const res = await postsAPI.getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'categoryName') {
      setFormData((prev) => ({
        ...prev,
        categoryName: value,
      }));
      if (value !== '__new__') {
        setCustomCategory('');
      }
      return;
    }

    if (name === 'excerpt') {
      // Limit excerpt to 300 characters
      const limitedValue = value.slice(0, 300);
      setFormData((prev) => ({
        ...prev,
        [name]: limitedValue,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const handleMediaUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) {
      return;
    }

    setError('');

    try {
      const uploadedMedia = await Promise.all(
        files.map(async (file) => {
          const mediaType = getMediaType(file.type);

          if (!mediaType) {
            throw new Error(`Unsupported file type for ${file.name}`);
          }

          const url = await readFileAsDataUrl(file);

          return {
            name: file.name,
            type: mediaType,
            url
          };
        })
      );

      setMediaFiles((prev) => [...prev, ...uploadedMedia]);
      e.target.value = '';
    } catch (uploadError) {
      setError(uploadError.message || 'Failed to upload media files.');
    }
  };

  const handleRemoveMedia = (indexToRemove) => {
    setMediaFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearSavedDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const buildPayload = (status) => {
    const categoryName = customCategory.trim() || formData.categoryName.trim();
    const tags = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      title: formData.title.trim(),
      content: formData.content,
      excerpt: formData.excerpt.trim().slice(0, 300),
      categoryName,
      tags,
      status,
      featuredImage: mediaFiles.find((item) => item.type === 'image')?.url || '',
      media: mediaFiles,
    };
  };

  const handleSave = async (status) => {
    setError('');
    const payload = buildPayload(status);
    const trimmedTitle = payload.title;
    const trimmedContent = payload.content?.trim();
    const emptyQuill = trimmedContent === '<p><br></p>' || trimmedContent === '<div><br></div>';

    if (status === 'published' && (!trimmedTitle || !trimmedContent || emptyQuill)) {
      setError('Please provide a title and post content before publishing.');
      return;
    }

    if (status === 'draft' && !trimmedTitle && !trimmedContent && mediaFiles.length === 0) {
      setError('Add a title, content, or media before saving a draft.');
      return;
    }

    if (!payload.categoryName) {
      setError('Please select or create a category.');
      return;
    }

    if (payload.excerpt.length > MAX_EXCERPT_LENGTH) {
      setError(`Excerpt cannot exceed ${MAX_EXCERPT_LENGTH} characters.`);
      return;
    }

    setLoading(true);

    try {
      await postsAPI.createPost(payload);
      clearSavedDraft();
      navigate('/dashboard');
    } catch (error) {
      const message = error.message || error.response?.data?.message || 'Unable to save the post.';
      console.error('Failed to save post:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave('published');
  };

  const handleSaveDraft = async () => {
    await handleSave('draft');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please log in to create posts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {isEditing ? 'Edit Post' : 'Create New Post'}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your post title"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="excerpt" className="block text-gray-700 font-medium mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={(e) => {
                if (e.target.value.length <= MAX_EXCERPT_LENGTH) {
                  handleChange(e);
                }
              }}
              rows={3}
              maxLength={MAX_EXCERPT_LENGTH}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of your post"
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.excerpt.length}/{MAX_EXCERPT_LENGTH} characters
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="categoryName" className="block text-gray-700 font-medium mb-2">
              Category *
            </label>
            {categories.length > 0 ? (
              <>
                <select
                  id="categoryName"
                  name="categoryName"
                  value={formData.categoryName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a category</option>
                  <option value="__new__">Create new category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formData.categoryName === '__new__' && (
                  <input
                    type="text"
                    id="customCategory"
                    name="customCategory"
                    value={customCategory}
                    onChange={handleCustomCategoryChange}
                    className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a new category name"
                  />
                )}
              </>
            ) : (
              <input
                type="text"
                id="categoryName"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create or enter a category"
                required
              />
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="tags" className="block text-gray-700 font-medium mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tags separated by commas"
            />
            <p className="text-sm text-gray-500 mt-2">
              Use commas to separate tags, e.g. react, javascript, ui.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Content *
            </label>
            <RichTextEditor
              value={formData.content}
              onChange={handleContentChange}
              className="bg-white min-h-[260px]"
              placeholder="Write your post content here..."
            />
          </div>

          <div className="mb-6">
            <label htmlFor="media" className="block text-gray-700 font-medium mb-2">
              Images and Multimedia
            </label>
            <input
              type="file"
              id="media"
              accept="image/*,video/*,audio/*"
              multiple
              onChange={handleMediaUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              Upload images, videos, or audio files to include in your post.
            </p>

            {mediaFiles.length > 0 && (
              <div className="mt-4 space-y-4">
                {mediaFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{file.type}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    {file.type === 'image' && (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="max-h-56 rounded-md object-cover"
                      />
                    )}

                    {file.type === 'video' && (
                      <video controls className="max-h-56 w-full rounded-md">
                        <source src={file.url} />
                      </video>
                    )}

                    {file.type === 'audio' && (
                      <audio controls className="w-full">
                        <source src={file.url} />
                      </audio>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="status" className="block text-gray-700 font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Preview</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {formData.title || 'Your post title will appear here'}
                </h3>
                <p className="text-gray-600">{formData.excerpt || 'Your excerpt will appear here.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
                  {customCategory.trim() || formData.categoryName || 'Category'}
                </span>
                {formData.tags
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-200 px-3 py-1 text-sm text-gray-700"
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
              <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: formData.content || '<p>Your content preview will show here.</p>' }} />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:justify-end md:items-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-2 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Post' : 'Publish Post')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
