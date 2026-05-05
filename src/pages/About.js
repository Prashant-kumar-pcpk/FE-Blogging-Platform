import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-12 mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          About Prashant Dairies
        </h1>
        <p className="text-xl text-gray-600">
          Sharing stories, insights, and knowledge with the world
        </p>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
        <p className="text-gray-700 mb-6 leading-relaxed">
          Prashant Dairies is a modern blogging platform dedicated to bringing together writers, 
          thinkers, and readers from around the world. We believe in the power of storytelling and 
          the importance of sharing diverse perspectives and experiences.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Our mission is to create a space where anyone can express their thoughts, share their 
          expertise, and connect with an engaged community of readers who are passionate about 
          learning and discovery.
        </p>
      </div>

      {/* What We Offer */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-l-4 border-blue-600 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Publishing</h3>
            <p className="text-gray-600">
              Simple and intuitive tools to write, format, and publish your stories without any 
              technical knowledge required.
            </p>
          </div>

          <div className="border-l-4 border-purple-600 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Rich Editor</h3>
            <p className="text-gray-600">
              A powerful rich text editor with support for formatting, images, links, and more 
              to create engaging content.
            </p>
          </div>

          <div className="border-l-4 border-pink-600 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Engagement</h3>
            <p className="text-gray-600">
              Connect with readers through comments, likes, and shares. Build your audience and 
              grow your influence.
            </p>
          </div>

          <div className="border-l-4 border-green-600 pl-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600">
              Track your post performance with detailed analytics including views, likes, shares, 
              and reader engagement.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Choose Prashant Dairies?</h2>
        <ul className="space-y-4">
          <li className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700"><strong>User-Friendly:</strong> Our platform is designed with simplicity in mind, making it easy for anyone to start publishing.</span>
          </li>
          <li className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700"><strong>Open Community:</strong> We believe in fostering a supportive and inclusive community where all voices are heard.</span>
          </li>
          <li className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700"><strong>Always Free:</strong> Prashant Dairies is completely free to use. No subscription fees, no hidden charges.</span>
          </li>
          <li className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700"><strong>Modern Features:</strong> We continuously update our platform with new and improved features based on user feedback.</span>
          </li>
        </ul>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="mb-6 text-lg">
          Join thousands of writers and readers on Prashant Dairies today.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/"
            className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            Explore Posts
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;