import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../API/api';

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={`dashboard-stat-${index}`} className="animate-pulse rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
            <div className="ml-4 flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-100"></div>
              <div className="h-7 w-16 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="rounded-lg bg-white shadow-md">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200"></div>
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`dashboard-post-${index}`} className="animate-pulse px-6 py-5">
            <div className="mb-3 h-5 w-1/3 rounded bg-gray-200"></div>
            <div className="h-4 w-2/3 rounded bg-gray-100"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = memo(({ label, value, tone, iconPath }) => (
  <div className="rounded-lg bg-white p-6 shadow-md">
    <div className="flex items-center">
      <div className={`rounded-full p-3 ${tone}`}>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
        </svg>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
));

const DashboardPostRow = memo(({ post, onOpenDraft, onOpenPublished }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={() => (post.status === 'draft' ? onOpenDraft(post._id) : onOpenPublished(post.slug))}
    onKeyDown={(event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      if (post.status === 'draft') {
        onOpenDraft(post._id);
        return;
      }

      onOpenPublished(post.slug);
    }}
    className="flex cursor-pointer flex-col gap-4 px-6 py-4 transition-colors hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
    aria-label={`${post.status === 'draft' ? 'Edit draft' : 'Open post'} ${post.title}`}
  >
    <div className="flex-1">
      <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
          post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {post.status}
        </span>
        {post.publishedAt && (
          <span>Published {new Date(post.publishedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <span>{post.views || 0} views</span>
      <span>{post.likes?.length || 0} likes</span>
      <Link
        to={`/edit-post/${post._id}`}
        onClick={(event) => event.stopPropagation()}
        className="text-blue-600 hover:text-blue-800"
        aria-label={`Edit ${post.title}`}
      >
        Edit
      </Link>
    </div>
  </div>
));

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUserPosts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await postsAPI.getMyPosts();
      setRecentPosts(res.data || []);
    } catch (fetchError) {
      console.error('Failed to fetch dashboard posts:', fetchError);
      setError(fetchError.response?.data?.message || fetchError.message || 'Unable to load your dashboard right now.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    document.title = 'Dashboard | Prashant Dairies';
  }, []);

  useEffect(() => {
    loadUserPosts();
  }, [loadUserPosts]);

  const stats = useMemo(
    () => ({
      totalPosts: recentPosts.length,
      totalViews: recentPosts.reduce((sum, post) => sum + (post.views || 0), 0),
      totalLikes: recentPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0),
      followers: user?.followers?.length || 0
    }),
    [recentPosts, user]
  );

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">Please log in to access your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.username}!</h1>
          <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening with your blog.</p>
        </div>
        <Link
          to="/create-post"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Write New Post
        </Link>
      </header>

      {error && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700" role="alert" aria-live="polite">
          <p>{error}</p>
          <button
            type="button"
            onClick={loadUserPosts}
            className="mt-4 rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard statistics">
        <StatCard
          label="Total Posts"
          value={stats.totalPosts}
          tone="bg-blue-100 text-blue-600"
          iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <StatCard
          label="Total Views"
          value={stats.totalViews}
          tone="bg-green-100 text-green-600"
          iconPath="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
        <StatCard
          label="Total Likes"
          value={stats.totalLikes}
          tone="bg-red-100 text-red-600"
          iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
        <StatCard
          label="Followers"
          value={stats.followers}
          tone="bg-purple-100 text-purple-600"
         iconPath="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z"
        />
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-md" aria-labelledby="recent-posts-heading">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 id="recent-posts-heading" className="text-xl font-semibold text-gray-900">Recent Posts</h2>
        </div>

        {recentPosts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {recentPosts.map((post) => (
              <DashboardPostRow
                key={post._id}
                post={post}
                onOpenDraft={(postId) => navigate(`/edit-post/${postId}`)}
                onOpenPublished={(slug) => slug && navigate(`/post/${slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <h3 className="text-2xl font-semibold text-gray-900">Your dashboard is ready</h3>
            <p className="mt-3 text-lg text-gray-600">You have not created any posts yet.</p>
            <Link
              to="/create-post"
              className="mt-5 inline-block rounded-full bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
            >
              Create Your First Post
            </Link>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
