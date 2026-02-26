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
import Team from './pages/Team';
import SubmitDocument from './pages/SubmitDocument';
import LoginPage from './pages/LoginPage';
import ReviewDashboard from './pages/ReviewDashboard';
import MediaImages from './pages/MediaImages';

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
          path="/review"
          element={
            <ProtectedRoute>
              <ReviewDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/media/images"
          element={
            <ProtectedRoute>
              <MediaImages />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
    <Footer />
  </div>
);

export default App;
