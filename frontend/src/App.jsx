import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Archive from './pages/Archive';
import DocumentPage from './pages/DocumentPage';
import TimelinePage from './pages/TimelinePage';
import WordCloudPage from './pages/WordCloudPage';
import CoatOfArmsPage from './pages/CoatOfArmsPage';
import Team from './pages/Team';
import SubmitDocument from './pages/SubmitDocument';
import LoginPage from './pages/LoginPage';
import ReviewDashboard from './pages/ReviewDashboard';
import MediaPDFs from './pages/MediaPDFs';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import PhotoDetailPage from './pages/PhotoDetailPage';
import InternalDashboard from './pages/InternalDashboard';
import HelpCenter from './pages/HelpCenter';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Logout = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    localStorage.removeItem('authToken');
    navigate('/login', { replace: true });
  }, [navigate]);

  return null;
};

const App = () => (
  <div className="flex flex-col min-h-screen font-sans bg-parchment">
    <ScrollToTop />
    <Header />
    <main className="flex-grow">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/document/:id" element={<DocumentPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/wortwolke" element={<WordCloudPage />} />
        <Route path="/wappen" element={<CoatOfArmsPage />} />
        <Route path="/team" element={<Team />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/logout" element={<Logout />} />
        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <SubmitDocument />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internal/dashboard"
          element={
            <ProtectedRoute>
              <InternalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute>
              <ReviewDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/media/pdfs"
          element={
            <ProtectedRoute>
              <MediaPDFs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/albums"
          element={
            <ProtectedRoute>
              <AlbumsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/albums/:albumId"
          element={
            <ProtectedRoute>
              <AlbumDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/photos/:photoId"
          element={
            <ProtectedRoute>
              <PhotoDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <HelpCenter />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
