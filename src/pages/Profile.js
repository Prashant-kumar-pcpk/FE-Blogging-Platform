import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, postsAPI } from '../API/api';

const PROFILE_FORM_INITIAL_STATE = {
  username: '',
  bio: '',
  profilePicture: '',
  twitter: '',
  linkedin: '',
  github: '',
  website: '',
};

const CATEGORY_FORM_INITIAL_STATE = {
  name: '',
  description: '',
  color: '#3B82F6',
  icon: '📝'
};

const Profile = () => {
  const { user: currentUser, isAuthenticated, updateProfile } = useAuth();
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState(PROFILE_FORM_INITIAL_STATE);
  const [categoryForm, setCategoryForm] = useState(CATEGORY_FORM_INITIAL_STATE);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        if (!username || username === currentUser?.username) {
          const [profileRes, postsRes, commentsRes, categoriesRes] = await Promise.all([
            authAPI.getProfile(),
            postsAPI.getMyPosts(),
            authAPI.getMyComments(),
            postsAPI.getCategories()
          ]);

          setUser(profileRes.data);
          setPosts(postsRes.data);
          setComments(commentsRes.data);
          setCategories(categoriesRes.data);
          setIsOwnProfile(true);
          setFormData({
            username: profileRes.data.username || '',
            bio: profileRes.data.bio || '',
            profilePicture: profileRes.data.profilePicture || '',
            twitter: profileRes.data.socialLinks?.twitter || '',
            linkedin: profileRes.data.socialLinks?.linkedin || '',
            github: profileRes.data.socialLinks?.github || '',
            website: profileRes.data.socialLinks?.website || '',
          });
        } else {
          const authorRes = await postsAPI.getAuthorByUsername(username);
          setUser(authorRes.data.user);
          setPosts(authorRes.data.posts);
          setComments([]);
          setCategories([]);
          setIsOwnProfile(false);
          setIsEditingProfile(false);

          setIsFollowing(
            currentUser?.following?.some((followItem) => {
              if (!followItem) return false;
              if (typeof followItem === 'string') return followItem === authorRes.data.user._id;
              return followItem._id?.toString() === authorRes.data.user._id?.toString();
            })
          );
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser, username]);

  const socialLinks = [
    { key: 'twitter', label: 'Twitter', className: 'text-sky-500 hover:text-sky-600' },
    { key: 'linkedin', label: 'LinkedIn', className: 'text-blue-700 hover:text-blue-800' },
    { key: 'github', label: 'GitHub', className: 'text-gray-700 hover:text-black' },
    { key: 'website', label: 'Website', className: 'text-emerald-600 hover:text-emerald-700' }
  ].filter((item) => user?.socialLinks?.[item.key]);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      setError('Please log in to follow authors.');
      return;
    }

    if (!user) return;

    setFollowLoading(true);
    setError('');

    try {
      if (isFollowing) {
        await authAPI.unfollowUser(user._id);
        setIsFollowing(false);
        setUser((prev) => ({
          ...prev,
          followers: prev.followers ? prev.followers.filter((follower) => follower.toString() !== currentUser._id.toString()) : []
        }));
      } else {
        await authAPI.followUser(user._id);
        setIsFollowing(true);
        setUser((prev) => ({
          ...prev,
          followers: prev.followers ? [...prev.followers, currentUser._id] : [currentUser._id]
        }));
      }
    } catch (err) {
      console.error('Follow action failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    const trimmedUsername = formData.username.trim();
    const trimmedBio = formData.bio.trim();

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (trimmedBio.length > 500) {
      setError('Bio cannot exceed 500 characters.');
      return;
    }

    setSavingProfile(true);

    try {
      const result = await updateProfile({
        username: trimmedUsername,
        bio: trimmedBio,
        profilePicture: formData.profilePicture.trim(),
        socialLinks: {
          twitter: formData.twitter.trim(),
          linkedin: formData.linkedin.trim(),
          github: formData.github.trim(),
          website: formData.website.trim()
        }
      });

      if (!result.success) {
        setError(result.message);
        return;
      }

      const refreshedProfile = await authAPI.getProfile();
      setUser(refreshedProfile.data);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeletePost = async (postId) => {
    setDeletingPostId(postId);
    setError('');
    setSuccessMessage('');

    try {
      await postsAPI.deletePost(postId);
      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      setSuccessMessage('Post deleted successfully.');
    } catch (err) {
      console.error('Post delete failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to delete post.');
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeletingCommentId(commentId);
    setError('');
    setSuccessMessage('');

    try {
      await authAPI.deleteMyComment(commentId);
      setComments((prevComments) => prevComments.filter((comment) => comment._id !== commentId));
      setSuccessMessage('Comment deleted successfully.');
    } catch (err) {
      console.error('Comment delete failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to delete comment.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleCategoryFormChange = (event) => {
    const { name, value } = event.target;
    setCategoryForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const resetCategoryForm = () => {
    setCategoryForm(CATEGORY_FORM_INITIAL_STATE);
    setEditingCategoryId(null);
  };

  const handleCategorySave = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!categoryForm.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSavingCategory(true);

    try {
      const payload = {
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim(),
        color: categoryForm.color,
        icon: categoryForm.icon.trim() || '📝'
      };

      if (editingCategoryId) {
        const res = await postsAPI.updateCategory(editingCategoryId, payload);
        setCategories((prevCategories) =>
          prevCategories.map((category) => category._id === editingCategoryId ? res.data : category)
        );
        setSuccessMessage('Category updated successfully.');
      } else {
        const res = await postsAPI.createCategory(payload);
        setCategories((prevCategories) => [res.data, ...prevCategories]);
        setSuccessMessage('Category created successfully.');
      }

      resetCategoryForm();
    } catch (err) {
      console.error('Category save failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to save category.');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategoryId(category._id);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3B82F6',
      icon: category.icon || '📝'
    });
    setActiveTab('categories');
    setError('');
    setSuccessMessage('');
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeletingCategoryId(categoryId);
    setError('');
    setSuccessMessage('');

    try {
      await postsAPI.deleteCategory(categoryId);
      setCategories((prevCategories) => prevCategories.filter((category) => category._id !== categoryId));
      setSuccessMessage('Category deleted successfully.');
      if (editingCategoryId === categoryId) {
        resetCategoryForm();
      }
    } catch (err) {
      console.error('Category delete failed:', err);
      setError(err.response?.data?.message || err.message || 'Unable to delete category.');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-md p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="h-28 w-28 rounded-full object-cover border-4 border-blue-100"
              />
            ) : (
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl text-white font-bold bg-gradient-to-br from-blue-500 to-indigo-600">
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
              <p className="text-gray-600 mb-4">{user.bio || 'No bio added yet.'}</p>
              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600">
                <span>{user.followers?.length || 0} followers</span>
                <span>{user.following?.length || 0} following</span>
                <span>{posts.length} posts</span>
                <span>
                  Joined{' '}
                  {new Date(user.createdAt || user.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
              {socialLinks.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {socialLinks.map((item) => (
                    <a
                      key={item.key}
                      href={user.socialLinks[item.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`font-medium transition-colors ${item.className}`}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile((prev) => !prev);
                    setSuccessMessage('');
                    setError('');
                  }}
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  {isEditingProfile ? 'Close Editor' : 'Edit Profile'}
                </button>
                <Link
                  to="/create-post"
                  className="rounded-full border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Write a Post
                </Link>
              </>
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`rounded-full px-6 py-2.5 font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${followLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {(error || successMessage) && (
          <div className="mt-6 space-y-2">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && <p className="text-sm text-green-600">{successMessage}</p>}
          </div>
        )}

        {isOwnProfile && isEditingProfile && (
          <form onSubmit={handleProfileSave} className="mt-8 grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture URL
              </label>
              <input
                id="profilePicture"
                name="profilePicture"
                value={formData.profilePicture}
                onChange={handleFormChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleFormChange}
                rows={4}
                maxLength={500}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell readers about yourself"
              />
              <p className="mt-2 text-sm text-gray-500">{formData.bio.length}/500 characters</p>
            </div>

            <div>
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                Twitter URL
              </label>
              <input
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>

            <div>
              <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://linkedin.com/in/yourname"
              />
            </div>

            <div>
              <label htmlFor="github" className="block text-sm font-medium text-gray-700 mb-2">
                GitHub URL
              </label>
              <input
                id="github"
                name="github"
                value={formData.github}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://github.com/yourname"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL
              </label>
              <input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleFormChange}
                className="w-full rounded-3xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://yourwebsite.com"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className={`rounded-full bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors ${
                  savingProfile ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setFormData({
                    username: user.username || '',
                    bio: user.bio || '',
                    profilePicture: user.profilePicture || '',
                    twitter: user.socialLinks?.twitter || '',
                    linkedin: user.socialLinks?.linkedin || '',
                    github: user.socialLinks?.github || '',
                    website: user.socialLinks?.website || '',
                  });
                }}
                className="rounded-full border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`py-4 text-sm font-semibold transition-colors ${
                activeTab === 'posts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Posts
            </button>
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Comments
              </button>
            )}
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Categories
              </button>
            )}
          </div>
        </div>

        {activeTab === 'posts' ? (
          <div className="divide-y divide-gray-200">
            {posts.length > 0 ? (
              posts.map((post) => (
                <article key={post._id} className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link to={`/post/${post.slug}`} className="hover:text-blue-600">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-3">{post.excerpt || 'No excerpt provided.'}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          {new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span>{post.views || 0} views</span>
                        <span>{Array.isArray(post.likes) ? post.likes.length : post.likes || 0} likes</span>
                        <span className="capitalize">{post.status || 'draft'}</span>
                      </div>
                    </div>

                    {isOwnProfile && (
                      <div className="flex gap-3">
                        <Link
                          to={`/post/${post.slug}`}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post._id)}
                          disabled={deletingPostId === post._id}
                          className={`rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ${
                            deletingPostId === post._id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {deletingPostId === post._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600">{isOwnProfile ? 'You have not published any posts yet.' : 'No posts yet.'}</p>
              </div>
            )}
          </div>
        ) : activeTab === 'comments' ? (
          <div className="divide-y divide-gray-200">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <article key={comment._id} className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-gray-800 mb-3">{comment.content}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        {comment.post?.slug ? (
                          <Link to={`/post/${comment.post.slug}`} className="text-blue-600 hover:text-blue-700">
                            On {comment.post.title}
                          </Link>
                        ) : (
                          <span>Original post unavailable</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment._id)}
                      disabled={deletingCommentId === comment._id}
                      className={`rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ${
                        deletingCommentId === comment._id ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {deletingCommentId === comment._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="p-12 text-center">
                <p className="text-gray-600">You have not added any comments yet.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-8 p-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form onSubmit={handleCategorySave} className="rounded-2xl border border-gray-200 p-5">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {editingCategoryId ? 'Edit Category' : 'Create Category'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    id="category-name"
                    name="name"
                    value={categoryForm.name}
                    onChange={handleCategoryFormChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Technology"
                  />
                </div>

                <div>
                  <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="category-description"
                    name="description"
                    value={categoryForm.description}
                    onChange={handleCategoryFormChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What kind of posts belong here?"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="category-color" className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      id="category-color"
                      type="color"
                      name="color"
                      value={categoryForm.color}
                      onChange={handleCategoryFormChange}
                      className="h-12 w-full rounded-lg border border-gray-300 bg-white px-2 py-2"
                    />
                  </div>
                  <div>
                    <label htmlFor="category-icon" className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <input
                      id="category-icon"
                      name="icon"
                      value={categoryForm.icon}
                      onChange={handleCategoryFormChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="📝"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={savingCategory}
                  className={`rounded-full bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 transition-colors ${
                    savingCategory ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {savingCategory ? 'Saving...' : editingCategoryId ? 'Update Category' : 'Create Category'}
                </button>
                {editingCategoryId && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="rounded-full border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 px-5 py-4">
                <h3 className="text-xl font-semibold text-gray-900">Existing Categories</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category._id} className="flex items-start justify-between gap-4 p-5">
                      <div className="flex gap-4">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
                          style={{ backgroundColor: category.color }}
                        >
                          <span>{category.icon || '📝'}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.description || 'No description yet.'}</p>
                          <p className="mt-1 text-xs text-gray-500">{category.postCount || 0} published posts</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(category)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category._id)}
                          disabled={deletingCategoryId === category._id}
                          className={`rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors ${
                            deletingCategoryId === category._id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {deletingCategoryId === category._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-gray-600">No categories available yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
