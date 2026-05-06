import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI } from '../API/api';

const CategoryPage = () => {
  const { slug } = useParams();
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        const res = await postsAPI.getCategoryPosts(slug);
        setCategory(res.data.category);
        setPosts(res.data.posts);
      } catch (error) {
        console.error('Failed to fetch category posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Category not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <span>←</span>
          Back to Home
        </Link>
      </div>

      {/* Category Header */}
      <div className="text-center py-12">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: category.color }}
        >
          {category.icon}
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{category.name}</h1>
        {category.description && (
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{category.description}</p>
        )}
        <p className="text-gray-500 mt-4">{posts.length} posts</p>
      </div>

      {/* Posts Grid */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: post.category?.color || '#3B82F6' }}
                  >
                    {post.category?.name || 'General'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  <Link to={`/post/${post.slug}`} className="hover:text-blue-600">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
                    <span>{post.author?.username || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>{post.views || 0} views</span>
                    <span>{post.likes?.length || 0} likes</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No posts found in this category yet.</p>
          <Link
            to="/create-post"
            className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Write the first post
          </Link>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
