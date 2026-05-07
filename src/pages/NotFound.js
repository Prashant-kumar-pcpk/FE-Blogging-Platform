import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  useEffect(() => {
    document.title = '404 Not Found | Prashant Dairies';
  }, []);

  return (
    <section className="mx-auto max-w-3xl rounded-3xl bg-white/90 px-6 py-16 text-center shadow-lg backdrop-blur sm:px-10" aria-labelledby="not-found-heading">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">404 Error</p>
      <h1 id="not-found-heading" className="mt-4 text-5xl font-bold text-gray-900 sm:text-6xl">Page Not Found</h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
        The page you&apos;re looking for doesn&apos;t exist, may have moved, or the link may be incomplete.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="rounded-full bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          Go Home
        </Link>
        <Link
          to="/authors"
          className="rounded-full border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
        >
          Explore Authors
        </Link>
      </div>
    </section>
  );
};

export default NotFound;
