import React, { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../API/api';

const socialLinkItems = [
  { key: 'twitter', label: 'Twitter' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'github', label: 'GitHub' },
  { key: 'website', label: 'Website' }
];

const AuthorsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }, (_, index) => (
      <div key={`author-skeleton-${index}`} className="animate-pulse rounded-2xl bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded bg-gray-200"></div>
            <div className="h-4 w-24 rounded bg-gray-100"></div>
          </div>
        </div>
        <div className="mb-4 space-y-2">
          <div className="h-4 rounded bg-gray-100"></div>
          <div className="h-4 rounded bg-gray-100"></div>
          <div className="h-4 w-2/3 rounded bg-gray-100"></div>
        </div>
        <div className="mb-5 h-16 rounded-2xl bg-gray-100"></div>
        <div className="h-10 rounded-full bg-gray-200"></div>
      </div>
    ))}
  </div>
);

const AuthorCard = memo(({ author }) => {
  const availableSocialLinks = socialLinkItems.filter((item) => author.socialLinks?.[item.key]);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md transition-shadow hover:shadow-lg">
      <div className="p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          {author.profilePicture ? (
            <img
              src={author.profilePicture}
              alt={`${author.username} profile`}
              loading="lazy"
              decoding="async"
              className="h-20 w-20 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white">
              {author.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-900">{author.username}</h3>
            <p className="text-sm text-gray-500">
              Joined {new Date(author.joinedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>

        <p className="mb-4 min-h-[72px] text-sm leading-6 text-gray-600">
          {author.bio || 'This author has not added a bio yet.'}
        </p>

        {availableSocialLinks.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2" aria-label={`${author.username} social links`}>
            {availableSocialLinks.map((item) => (
              <a
                key={`${author._id}-${item.key}`}
                href={author.socialLinks[item.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-600">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{author.postCount}</p>
            <p>Posts</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{author.viewsCount}</p>
            <p>Views</p>
          </div>
        </div>

        <Link
          to={`/profile/${author.username}`}
          className="block w-full rounded-full bg-blue-600 py-2 text-center font-medium text-white transition-colors hover:bg-blue-700"
          aria-label={`View ${author.username}'s profile`}
        >
          View Profile
        </Link>
      </div>
    </article>
  );
});

const Authors = () => {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const loadAuthors = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await postsAPI.getAuthors();
      setAuthors(res.data || []);
    } catch (fetchError) {
      console.error('Failed to fetch authors:', fetchError);
      setError(fetchError.response?.data?.message || fetchError.message || 'Unable to load authors right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Authors | Prashant Dairies';
  }, []);

  useEffect(() => {
    loadAuthors();
  }, []);

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const filteredAuthors = useMemo(
    () =>
      authors.filter((author) =>
        !normalizedSearchTerm
        || author.username?.toLowerCase().includes(normalizedSearchTerm)
        || author.bio?.toLowerCase().includes(normalizedSearchTerm)
      ),
    [authors, normalizedSearchTerm]
  );

  const communityStats = useMemo(
    () => ({
      activeAuthors: authors.length,
      totalPosts: authors.reduce((sum, author) => sum + author.postCount, 0),
      totalViews: authors.reduce((sum, author) => sum + author.viewsCount, 0)
    }),
    [authors]
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 py-10 text-center sm:py-12">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
          Our Authors
        </h1>
        <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-600 md:text-xl">
          Explore writers, their bios, social links, and published stories.
        </p>

        <div className="mx-auto mb-4 max-w-md">
          <input
            type="text"
            placeholder="Search authors by name or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search authors by name or bio"
            className="w-full rounded-full border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </header>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-center text-red-700" role="alert" aria-live="polite">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadAuthors}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <AuthorsSkeleton />
      ) : filteredAuthors.length > 0 ? (
        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="Authors list">
          {filteredAuthors.map((author) => (
            <AuthorCard key={author._id} author={author} />
          ))}
        </section>
      ) : (
        <section className="mb-12 rounded-2xl bg-white p-8 text-center shadow-md sm:p-10">
          <h2 className="text-2xl font-semibold text-gray-900">Nothing to show yet</h2>
          <p className="mt-3 text-lg text-gray-600">
            {searchTerm ? 'No authors found matching your search.' : 'No authors yet.'}
          </p>
          {!searchTerm && (
            <Link
              to="/register"
              className="mt-6 inline-block rounded-full bg-blue-600 px-8 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Be the First Author
            </Link>
          )}
        </section>
      )}

      <section className="mb-8 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center text-white shadow-md sm:p-8" aria-label="Author community statistics">
        <h2 className="mb-6 text-2xl font-bold">Community Stats</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="mb-2 text-4xl font-bold">{communityStats.activeAuthors}</p>
            <p className="text-lg">Active Authors</p>
          </div>
          <div>
            <p className="mb-2 text-4xl font-bold">{communityStats.totalPosts}</p>
            <p className="text-lg">Published Posts</p>
          </div>
          <div>
            <p className="mb-2 text-4xl font-bold">{communityStats.totalViews}</p>
            <p className="text-lg">Total Views</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Authors;
