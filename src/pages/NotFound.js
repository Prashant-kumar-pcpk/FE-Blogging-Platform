import React from 'react';

const NotFound = () => {
  return (
    <div className="text-center py-16">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-700 mb-8">Page Not Found</h2>
      <p className="text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a 
        href="/"
        className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
};

export default NotFound;