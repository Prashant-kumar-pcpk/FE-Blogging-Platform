import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!username || username === currentUser?.username) {
          setUser(currentUser);
          setIsOwnProfile(true);
        } else {
          setUser({
            username: username,
            email: 'user@example.com',
            bio: 'A passionate writer sharing thoughts and ideas.',
            profilePicture: '',
            socialLinks: {
              twitter: 'https://twitter.com/user',
              linkedin: 'https://linkedin.com/in/user'
            },
            followers: 45,
            following: 23,
            joinedAt: new Date('2023-01-15').toISOString()
          });
          setIsOwnProfile(false);
        }

        setPosts([
          {
            id: 1,
            title: 'My First Blog Post',
            excerpt: 'An introduction to my blogging journey...',
            publishedAt: new Date().toISOString(),
            views: 125,
            likes: 15
          },
          {
            id: 2,
            title: 'Advanced React Patterns',
            excerpt: 'Exploring modern React development techniques...',
            publishedAt: new Date(Date.now() - 86400000).toISOString(),
            views: 89,
            likes: 22
          }
        ]);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, username]);

  const handleFollow = async () => {
    setIsFollowing(!isFollowing);
    // API call would go here
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-24 h-24 bg-gray-300 rounded-full mr-6"></div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {user.username}
              </h1>
              {user.bio && (
                <p className="text-gray-600 mb-4">{user.bio}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{user.followers || 0} followers</span>
                <span>{user.following || 0} following</span>
                <span>
                  Joined {new Date(user.joinedAt || user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Social Links */}
        {user.socialLinks && (
          <div className="flex space-x-4 mt-6">
            {user.socialLinks.twitter && (
              <a
                href={user.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700"
              >
                Twitter
              </a>
            )}
            {user.socialLinks.linkedin && (
              <a
                href={user.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-800"
              >
                LinkedIn
              </a>
            )}
            {user.socialLinks.website && (
              <a
                href={user.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 hover:text-gray-900"
              >
                Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* Posts Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Posts by {user.username}
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {posts.map((post) => (
            <article key={post.id} className="p-6 hover:bg-gray-50">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                <Link to={`/post/${post.id}`} className="hover:text-blue-600">
                  {post.title}
                </Link>
              </h3>
              <p className="text-gray-600 mb-3">{post.excerpt}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <div className="flex items-center space-x-4">
                  <span>{post.views} views</span>
                  <span>{post.likes} likes</span>
                </div>
              </div>
            </article>
          ))}

          {posts.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-600">No posts yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
