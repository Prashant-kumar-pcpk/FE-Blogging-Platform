import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { postsAPI, authAPI } from '../API/api';
import { useAuth } from '../context/AuthContext';

const MAX_SEARCHABLE_POSTS = 1000;

const matchesSearchTerm = (value, query) =>
  typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase());

const buildAuthorsFromPosts = (postList = []) => {
  const authorsMap = new Map();

  postList.forEach((post) => {
    if (!post?.author?._id) return;

    const authorId = post.author._id;
    const existingAuthor = authorsMap.get(authorId);

    if (existingAuthor) {
      existingAuthor.postCount += 1;
      existingAuthor.viewsCount += post.views || 0;
      return;
    }

    authorsMap.set(authorId, {
      _id: authorId,
      username: post.author.username || 'Unknown',
      profilePicture: post.author.profilePicture || '',
      postCount: 1,
      viewsCount: post.views || 0
    });
  });

  return Array.from(authorsMap.values()).sort((firstAuthor, secondAuthor) =>
    secondAuthor.postCount - firstAuthor.postCount
  );
};

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [searchablePosts, setSearchablePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMetaResults, setSearchMetaResults] = useState({
    authors: [],
    categories: [],
    tags: []
  });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [followLoading, setFollowLoading] = useState(false);
  const [followState, setFollowState] = useState({});
  const postsPerPage = 10;
  const selectedCategory = searchParams.get('category') || '';
  const selectedTag = searchParams.get('tag') || '';

  useEffect(() => {
    fetchPosts(currentPage, selectedCategory, selectedTag);
    fetchCategories();
    fetchTags();
  }, [currentPage, selectedCategory, selectedTag]);

  useEffect(() => {
    fetchSearchablePosts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed) {
        performSearch(trimmed, selectedCategory, selectedTag, searchablePosts, categories, tags);
      } else {
        setSearchResults([]);
        setSearchMetaResults({ authors: [], categories: [], tags: [] });
        setSearchError('');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedTag, searchablePosts, categories, tags]);

  const displayedPosts = searchTerm.trim() ? searchResults : posts;
  const isSearching = searchTerm.trim().length > 0;
  const searchAuthors = searchMetaResults.authors || [];
  const searchCategories = searchMetaResults.categories || [];
  const searchTags = searchMetaResults.tags || [];
  const hasSupplementarySearchResults =
    searchAuthors.length > 0 || searchCategories.length > 0 || searchTags.length > 0;

  const trendingCategories = [...categories]
    .sort((a, b) => (b.postCount || 0) - (a.postCount || 0))
    .slice(0, 3);

  const topPosts = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  const getCategoryKey = (category, index) =>
    category?._id || category?.slug || `${category?.name || 'category'}-${index}`;

  const getPostKey = (post, index) =>
    post?._id || post?.slug || `${post?.title || 'post'}-${index}`;

  const isPostLiked = (post) => {
    if (!user || !Array.isArray(post.likes)) return false;
    return post.likes.some(like => like.user === user._id);
  };

  const isFollowingAuthor = (post) => {
    if (!user || !post?.author?._id) return false;
    const authorId = post.author._id.toString();
    if (followState[authorId] !== undefined) {
      return followState[authorId];
    }
    return user.following?.some((followItem) => {
      if (!followItem) return false;
      if (typeof followItem === 'string') return followItem === authorId;
      return followItem._id?.toString() === authorId;
    });
  };

  const toggleFollowAuthor = async (authorId) => {
    if (!isAuthenticated) {
      alert('Please log in to follow authors.');
      return;
    }
    if (!authorId) return;

    setFollowLoading(true);

    try {
      const currentlyFollowing = Boolean(
        followState[authorId] ??
          user.following?.some((followItem) => {
            if (!followItem) return false;
            if (typeof followItem === 'string') return followItem === authorId;
            return followItem._id?.toString() === authorId;
          })
      );

      if (currentlyFollowing) {
        await authAPI.unfollowUser(authorId);
        setFollowState((prev) => ({ ...prev, [authorId]: false }));
      } else {
        await authAPI.followUser(authorId);
        setFollowState((prev) => ({ ...prev, [authorId]: true }));
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const performSearch = async (query, category, tag, availablePosts, availableCategories, availableTags) => {
    setSearchError('');
    setSearchLoading(true);

    try {
      const res = await postsAPI.searchPosts(query, {
        ...(category ? { category } : {}),
        ...(tag ? { tag } : {})
      });

      const matchedPosts = res.data.posts || res.data || [];
      const normalizedQuery = query.toLowerCase();
      const authorResults = buildAuthorsFromPosts(availablePosts).filter((author) =>
        matchesSearchTerm(author.username, normalizedQuery)
      );
      const categoryResults = availableCategories.filter((item) =>
        matchesSearchTerm(item.name, normalizedQuery)
        || matchesSearchTerm(item.description, normalizedQuery)
        || matchesSearchTerm(item.slug, normalizedQuery)
      );
      const tagResults = availableTags.filter((item) =>
        matchesSearchTerm(item.name, normalizedQuery)
        || matchesSearchTerm(item.slug, normalizedQuery)
      );

      setSearchResults(matchedPosts);
      setSearchMetaResults({
        authors: authorResults.slice(0, 6),
        categories: categoryResults.slice(0, 6),
        tags: tagResults.slice(0, 10)
      });
    } catch (error) {
      setSearchError(error.message || 'Search failed.');
      setSearchMetaResults({ authors: [], categories: [], tags: [] });
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchPosts = async (page = 1, category, tag) => {
    try {
      const res = await postsAPI.getAllPosts(page, postsPerPage, {
        ...(category ? { category } : {}),
        ...(tag ? { tag } : {})
      });
      setPosts(res.data.posts || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchablePosts = async () => {
    try {
      const res = await postsAPI.getAllPosts(1, MAX_SEARCHABLE_POSTS);
      setSearchablePosts(res.data.posts || res.data || []);
    } catch (error) {
      console.error('Failed to fetch searchable posts:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await postsAPI.getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await postsAPI.getTags();
      setTags(res.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const updateFilters = (nextCategory, nextTag) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextCategory) {
      nextParams.set('category', nextCategory);
    } else {
      nextParams.delete('category');
    }

    if (nextTag) {
      nextParams.set('tag', nextTag);
    } else {
      nextParams.delete('tag');
    }

    setCurrentPage(1);
    setSearchParams(nextParams);
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchParams({});
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchMetaResults({ authors: [], categories: [], tags: [] });
    setSearchError('');
  };

  const handleLike = async (postSlug) => {
    if (!isAuthenticated) {
      alert('Please log in to like posts.');
      return;
    }

    try {
      const res = await postsAPI.toggleLike(postSlug);
      // Update the local posts state
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.slug === postSlug
            ? {
                ...post,
                likes: res.data.liked
                  ? [...(Array.isArray(post.likes) ? post.likes : []), { user: user._id, createdAt: new Date() }]
                  : (Array.isArray(post.likes) ? post.likes.filter(like => like.user !== user._id) : [])
              }
            : post
        )
      );
      // Also update search results if applicable
      if (searchTerm.trim()) {
        setSearchResults(prevResults =>
          prevResults.map(post =>
            post.slug === postSlug
              ? {
                  ...post,
                  likes: res.data.liked
                    ? [...(Array.isArray(post.likes) ? post.likes : []), { user: user._id, createdAt: new Date() }]
                    : (Array.isArray(post.likes) ? post.likes.filter(like => like.user !== user._id) : [])
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      alert('Failed to update like status.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-72">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Welcome to Prashant Dairies
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Discover amazing stories, insights, and perspectives from writers around the world
        </p>
        <div className="max-w-2xl mx-auto mb-6">
          <input
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search stories, authors, or categories..."
            className="w-full px-4 py-3 rounded-full border border-blue-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        {(selectedCategory || selectedTag) && (
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
            {selectedCategory && (
              <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
                Category: {selectedCategory}
              </span>
            )}
            {selectedTag && (
              <span className="rounded-full bg-white/20 px-4 py-2 text-sm">
                Tag: {selectedTag}
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full border border-white/40 px-4 py-2 text-sm hover:bg-white/10"
            >
              Clear Filters
            </button>
          </div>
        )}
        <Link
          to={isAuthenticated ? '/create-post' : '/register'}
          className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          Start Writing Today
        </Link>
      </section>

      {/* Trending Categories and Popular Stories */}
      <section className="mb-12 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Stories</h2>
          <div className="space-y-4">
            {topPosts.length > 0 ? (
              topPosts.map((post, index) => (
                <Link
                  to={`/post/${post.slug}`}
                  key={getPostKey(post, index)}
                  className="block rounded-lg border border-gray-200 p-4 hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{post.title}</span>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{post.views || 0} views</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLike(post.slug);
                        }}
                        className={`flex items-center space-x-1 transition-colors ${
                          isPostLiked(post) ? 'text-red-600' : 'hover:text-red-600'
                        }`}
                        title={isAuthenticated ? (isPostLiked(post) ? 'Unlike' : 'Like') : 'Login to like'}
                      >
                        <svg className="w-4 h-4" fill={isPostLiked(post) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{typeof post.likes === 'number' ? post.likes : post.likes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{post.excerpt}</p>
                </Link>
              ))
            ) : (
              <p className="text-gray-600">No popular stories available yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Trending Categories</h2>
          <div className="space-y-3">
            {trendingCategories.map((category, index) => (
              <Link
                key={getCategoryKey(category, index)}
                to={`/category/${category.slug}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-500">{category.postCount} posts</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">Explore</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Explore Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <button
              type="button"
              key={getCategoryKey(category, index)}
              onClick={() => updateFilters(category.slug, selectedTag)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-full mb-4"
                style={{ backgroundColor: category.color }}
              ></div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              <p className="text-gray-600">
                {category.postCount} posts
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-gray-900">Browse Tags</h2>
          {selectedTag && (
            <button
              type="button"
              onClick={() => updateFilters(selectedCategory, '')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear Tag
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {tags.slice(0, 15).map((tag) => (
            <button
              key={tag._id}
              type="button"
              onClick={() => updateFilters(selectedCategory, tag.slug)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedTag === tag.slug
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 shadow-sm hover:bg-gray-100'
              }`}
            >
              #{tag.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Posts */}
      <section>
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-gray-900">
            {isSearching ? `Search Results for "${searchTerm}"` : 'Latest Posts'}
          </h2>
          {isSearching && (
            <button
              type="button"
              onClick={clearSearch}
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Clear Search
            </button>
          )}
        </div>
        {isSearching && searchLoading && (
          <div className="rounded-lg bg-white p-8 text-center shadow-md mb-6">
            <p className="text-gray-600 text-lg">Searching for "{searchTerm}"...</p>
          </div>
        )}

        {isSearching && !searchLoading && searchError && (
          <div className="rounded-lg bg-red-50 p-8 text-center shadow-md mb-6 text-red-700">
            {searchError}
          </div>
        )}

        {isSearching && !searchLoading && (
          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Authors</h3>
                <span className="text-sm text-gray-500">{searchAuthors.length}</span>
              </div>
              {searchAuthors.length > 0 ? (
                <div className="space-y-3">
                  {searchAuthors.map((author) => (
                    <Link
                      key={author._id}
                      to={`/profile/${author.username}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-500"
                    >
                      <div className="flex items-center gap-3">
                        {author.profilePicture ? (
                          <img
                            src={author.profilePicture}
                            alt={author.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white">
                            {author.username?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{author.username}</p>
                          <p className="text-sm text-gray-500">{author.postCount} posts</p>
                        </div>
                      </div>
                      <span className="text-sm text-blue-600">View</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No matching authors.</p>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Categories</h3>
                <span className="text-sm text-gray-500">{searchCategories.length}</span>
              </div>
              {searchCategories.length > 0 ? (
                <div className="space-y-3">
                  {searchCategories.map((category) => (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => updateFilters(category.slug, selectedTag)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-3 text-left transition-colors hover:border-blue-500"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full"
                          style={{ backgroundColor: category.color || '#3B82F6' }}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-500">{category.postCount || 0} posts</p>
                        </div>
                      </div>
                      <span className="text-sm text-blue-600">Filter</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No matching categories.</p>
              )}
            </div>

            <div className="rounded-lg bg-white p-6 shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Tags</h3>
                <span className="text-sm text-gray-500">{searchTags.length}</span>
              </div>
              {searchTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {searchTags.map((tag) => (
                    <button
                      key={tag._id}
                      type="button"
                      onClick={() => updateFilters(selectedCategory, tag.slug)}
                      className="rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No matching tags.</p>
              )}
            </div>
          </div>
        )}

        {isSearching && !searchLoading && displayedPosts.length === 0 && !hasSupplementarySearchResults ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-gray-600 text-lg mb-4">No results found for "{searchTerm}".</p>
            <button
              type="button"
              onClick={clearSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedPosts.map((post, index) => (
              <article key={getPostKey(post, index)} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <button
                      type="button"
                      onClick={() => updateFilters(post.category?.slug || '', selectedTag)}
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: post.category?.color || '#3B82F6' }}
                    >
                      {post.category?.name || 'General'}
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    <Link to={`/post/${post.slug}`} className="hover:text-blue-600">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <button
                          key={tag._id || tag.slug || tag.name}
                          type="button"
                          onClick={() => updateFilters(selectedCategory, tag.slug || tag.name)}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      <div>
                        <div>{post.author?.username || 'Unknown'}</div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFollowAuthor(post.author?._id);
                          }}
                          disabled={!isAuthenticated || followLoading || !post.author?._id}
                          className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            isFollowingAuthor(post)
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          } ${followLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                          title={isAuthenticated ? (isFollowingAuthor(post) ? 'Unfollow author' : 'Follow author') : 'Login to follow'}
                        >
                          {isFollowingAuthor(post) ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span>{post.views || 0} views</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLike(post.slug);
                        }}
                        className={`flex items-center space-x-1 transition-colors ${
                          isPostLiked(post) ? 'text-red-600' : 'hover:text-red-600'
                        }`}
                        title={isAuthenticated ? (isPostLiked(post) ? 'Unlike' : 'Like') : 'Login to like'}
                      >
                        <svg className="w-4 h-4" fill={isPostLiked(post) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{typeof post.likes === 'number' ? post.likes : post.likes?.length || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isSearching && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-12">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .slice(
                Math.max(0, currentPage - 2),
                Math.min(pagination.totalPages, currentPage + 1)
              )
              .map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
