import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, BookOpen, ArrowLeft } from 'lucide-react';
import { SUMMARIES_API_ENDPOINT } from '../constants';
import AudioPlayer from './AudioPlayer';

export default function PreviousUploadsPage({ navigateTo }) {
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(SUMMARIES_API_ENDPOINT)
      .then(res => res.json())
      .then(data => {
        setPapers(data);
        setFilteredPapers(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const extractFilename = (s3Key) => {
    if (!s3Key) return 'Research Paper';
    return s3Key.includes('-') ? s3Key.split('-').slice(1).join('-') : s3Key;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredPapers(papers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = papers.filter(paper =>
      extractFilename(paper.s3_key).toLowerCase().includes(query) ||
      paper.s.toLowerCase().includes(query)
    );
    setFilteredPapers(filtered);
  };

  return (
    <div className="bg-white bg-opacity-90 rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigateTo('home')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Previous Uploads</h2>

      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              placeholder="Search your papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map((paper, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-md overflow-hidden">
              <h3 className="text-lg font-medium text-gray-800 mb-3 truncate" title={extractFilename(paper.s3_key)}>
                {extractFilename(paper.s3_key)}
              </h3>
              <div className="text-gray-600 text-sm overflow-y-auto max-h-32 mb-4">
                <p>{paper.s}</p>
              </div>
              <div className="flex justify-between mt-4 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {new Date(parseInt(paper.s3_key.split('-')[0])).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-4">
                  <AudioPlayer text={paper.s} />
                  <button
                    onClick={() => navigateTo('qa', paper)}
                    className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md hover:bg-blue-600 flex items-center gap-1"
                  >
                    <MessageSquare size={14} />
                    Ask Questions
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No research papers found.</p>
          <p className="text-sm mt-2">Try uploading a new paper from the home page.</p>
        </div>
      )}
    </div>
  );
}
