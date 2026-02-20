import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Archive from './pages/Archive';
import DocumentPage from './pages/DocumentPage';
import TimelinePage from './pages/TimelinePage';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-parchment">
      <ScrollToTop />
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/document/:id" element={<DocumentPage />} />

          <Route path="/timeline" element={<TimelinePage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
