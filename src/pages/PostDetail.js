import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI } from '../API/api';
import { useAuth } from '../context/AuthContext';

const PostDetail = () => {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await postsAPI.getPostBySlug(slug);
        setPost(res.data);
      } catch (error) {
        console.error('Failed to fetch post:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      try {
        const res = await postsAPI.getComments(slug);
        setComments(res.data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    fetchPost();
    fetchComments();
  }, [slug]);

  const handleLike = async () => {
    // Toggle like
    setPost(prev => ({
      ...prev,
      liked: !prev.liked,
      likes: prev.liked ? prev.likes - 1 : prev.likes + 1
    }));
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt || post.title;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        return;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const trimmedComment = newComment.trim();

    if (!trimmedComment) return;
    if (!isAuthenticated) {
      setCommentError('Please log in to post a comment.');
      return;
    }

    setCommentSubmitting(true);
    setCommentError('');

    try {
      const res = await postsAPI.createComment(slug, { content: trimmedComment });
      setComments((prev) => [res.data, ...prev]);
      setNewComment('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to post comment.';
      console.error('Failed to post comment:', error);
      setCommentError(message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated) {
      setCommentError('Please log in to manage comments.');
      return;
    }

    setDeletingCommentId(commentId);
    setCommentError('');

    try {
      await postsAPI.deleteComment(slug, commentId);
      setComments((prevComments) =>
        prevComments.filter((comment) => comment._id !== commentId)
      );
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete comment.';
      console.error('Failed to delete comment:', error);
      setCommentError(message);
    } finally {
      setDeletingCommentId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Post not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Post Header */}
      <header className="mb-8">
        {post.featuredImage && (
          <img
            src={post.featuredImage}
            alt={post.title}
            className="mb-6 h-72 w-full rounded-xl object-cover"
          />
        )}

        <div className="flex items-center mb-4">
          <span
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: post.category.color }}
          >
            {post.category.name}
          </span>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <p className="text-xl text-black mb-6">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
            <div>
              <Link
                to={`/profile/${post.author.username}`}
                className="font-medium text-gray-900 hover:text-blue-600"
              >
                {post.author.username}
              </Link>
              <p className="text-sm text-gray-600">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-gray-600">
            <span>{post.views} views</span>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${post.liked ? 'text-red-600' : 'hover:text-red-600'}`}
            >
              <svg className="w-5 h-5" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{post.likes}</span>
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Share:</span>
              <button
                onClick={() => handleShare('twitter')}
                className="w-8 h-8 bg-blue-400 text-white rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors"
                title="Share on LinkedIn"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="Share on Facebook"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                title="Share on WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="w-8 h-8 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                title="Copy Link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Post Content */}
      <article className="prose prose-lg max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>

      {post.media?.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Media</h2>
          <div className="space-y-6">
            {post.media.map((item, index) => (
              <div key={`${item.name || item.type}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
                {item.type === 'image' && (
                  <img
                    src={item.url}
                    alt={item.name || `Post media ${index + 1}`}
                    className="max-h-[32rem] w-full rounded-lg object-contain"
                  />
                )}

                {item.type === 'video' && (
                  <video controls className="max-h-[32rem] w-full rounded-lg">
                    <source src={item.url} />
                  </video>
                )}

                {item.type === 'audio' && (
                  <audio controls className="w-full">
                    <source src={item.url} />
                  </audio>
                )}

                {item.name && (
                  <p className="mt-3 text-sm text-gray-600">{item.name}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-12">
        {post.tags.map((tag, index) => (
          <span
            key={index}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
          >
            #{tag.name}
          </span>
        ))}
      </div>

      {/* Comments Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Comments ({comments.length})
        </h2>

        {/* Add Comment Form */}
        <form onSubmit={handleCommentSubmit} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {commentError && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {commentError}
            </div>
          )}
          <button
            type="submit"
            disabled={commentSubmitting}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            {commentSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full mr-3"></div>
                <div>
                  <span className="font-medium text-gray-900">{comment.author.username}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-black">{comment.content}</p>
              <div className="flex items-center mt-2 text-sm text-gray-600">
                <button className="hover:text-blue-600 mr-4">
                  Like ({comment.likes?.length || 0})
                </button>
                <button className="hover:text-blue-600 mr-4">
                  Reply
                </button>
                {user?._id === comment.author?._id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(comment._id)}
                    disabled={deletingCommentId === comment._id}
                    className="hover:text-red-600 disabled:opacity-50"
                  >
                    {deletingCommentId === comment._id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PostDetail;
