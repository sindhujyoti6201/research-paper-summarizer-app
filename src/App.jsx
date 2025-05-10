import React, { useState } from 'react';
import Header from './components/Header';
import NavigationCards from './components/NavigationCards';
import UploadSection from './components/UploadSection';
import PDFPreviewSection from './components/PDFPreviewSection';
import SummariesSection from './components/SummariesSection';
import PreviousUploadsPage from './components/PreviousUploadsPage';
import QAPage from './components/QAPage';
import TrendingPapersSection from './components/TrendingPapersSection';
import SearchSimilarPapersPage from './components/SearchSimilarPapersPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPaper, setSelectedPaper] = useState(null);

  const navigateTo = (page, paper = null) => {
    setCurrentPage(page);
    if (paper) setSelectedPaper(paper);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1581090700227-1e7b1c78f3c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1950&q=80')",
      }}
    >
      <div className="backdrop-blur-sm bg-white/80 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Header />

          {currentPage === 'home' && (
            <>
              <NavigationCards navigateTo={navigateTo} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <UploadSection />
                <PDFPreviewSection />
              </div>
              <SummariesSection navigateTo={navigateTo} />
            </>
          )}

          {currentPage === 'searchSimilar' && (
            <SearchSimilarPapersPage navigateTo={navigateTo} />
          )}

          {currentPage === 'previous' && (
            <PreviousUploadsPage navigateTo={navigateTo} />
          )}

          {currentPage === 'qa' && (
            <QAPage navigateTo={navigateTo} paper={selectedPaper} />
          )}

          {currentPage === 'trending' && (
            <TrendingPapersSection navigateTo={navigateTo} />
          )}
        </div>
      </div>
    </div>
  );
}