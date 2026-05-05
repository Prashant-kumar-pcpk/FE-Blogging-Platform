import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../API/api';

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const res = await postsAPI.getAllPosts();
      const posts = res.data;

      // Group posts by author and count
      const authorsMap = {};
      posts.forEach(post => {
        if (post.author) {
          const authorId = post.author._id;
          if (!authorsMap[authorId]) {
            authorsMap[authorId] = {
              _id: authorId,
              username: post.author.username,
              profilePicture: post.author.profilePicture,
              postCount: 0,
              viewsCount: 0
            };
          }
          authorsMap[authorId].postCount += 1;
          authorsMap[authorId].viewsCount += (post.views || 0);
        }
      });

      const authorsList = Object.values(authorsMap).sort((a, b) => b.postCount - a.postCount);
      setAuthors(authorsList);
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuthors = authors.filter(author =>
    author.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Our Authors
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Meet the talented writers sharing their stories on Prashant Dairies
        </p>

        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <input
            type="text"
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Authors Grid */}
      {filteredAuthors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredAuthors.map((author) => (
            <Link
              key={author._id}
              to={`/profile/${author.username}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6 text-center">
                {/* Profile Picture */}
                <div className="mb-4">
                  {author.profilePicture ? (
                    <img
                      src={author.profilePicture}
                      alt={author.username}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                      {author.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Author Info */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {author.username}
                </h3>

                {/* Stats */}
                <div className="flex justify-around text-sm text-gray-600 mb-4 py-4 border-y border-gray-200">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{author.postCount}</p>
                    <p className="text-sm">Posts</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-900">{author.viewsCount}</p>
                    <p className="text-sm">Views</p>
                  </div>
                </div>

                {/* CTA */}
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  View Profile
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No authors found matching your search.' : 'No authors yet.'}
          </p>
          {!searchTerm && (
            <Link
              to="/register"
              className="inline-block mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Be the First Author
            </Link>
          )}
        </div>
      )}

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-8 text-white text-center mb-8">
        <h2 className="text-2xl font-bold mb-6">Community Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-4xl font-bold mb-2">{authors.length}</p>
            <p className="text-lg">Active Authors</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-2">
              {authors.reduce((sum, author) => sum + author.postCount, 0)}
            </p>
            <p className="text-lg">Total Posts</p>
          </div>
          <div>
            <p className="text-4xl font-bold mb-2">
              {authors.reduce((sum, author) => sum + author.viewsCount, 0)}
            </p>
            <p className="text-lg">Total Views</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Want to Join Our Community?</h2>
        <p className="text-gray-600 mb-6 text-lg">
          Start sharing your thoughts and stories with thousands of readers.
        </p>
        <Link
          to="/register"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors font-semibold"
        >
          Become an Author
        </Link>
      </div>
    </div>
  );
};

export default Authors;
