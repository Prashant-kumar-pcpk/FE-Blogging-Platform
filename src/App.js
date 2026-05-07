import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import 'quill/dist/quill.snow.css';

// Components
import Header from './layout/header';
import Footer from './layout/footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import CategoryPage from './pages/CategoryPage';
import Profile from './pages/Profile';
import About from './pages/About';
import Authors from './pages/Authors';
import NotFound from './pages/NotFound';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './component/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gradient-to-br from-purple-600 via-yellow-200 to-violet-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-gray-900"
            >
              Skip to main content
            </a>
            <Header />
            <main id="main-content" className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/edit-post/:id" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                <Route path="/post/:slug" element={<PostDetail />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/about" element={<About />} />
                <Route path="/authors" element={<Authors />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
