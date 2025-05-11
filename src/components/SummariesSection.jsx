import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { SUMMARIES_API_ENDPOINT, SEARCH_API_ENDPOINT } from '../constants';
import AudioPlayer from './AudioPlayer';

export default function SummariesSection({ navigateTo }) {
  const [summaries, setSummaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummaries();
    const handleRefresh = () => loadSummaries();
    window.addEventListener('refreshSummaries', handleRefresh);
    return () => window.removeEventListener('refreshSummaries', handleRefresh);
  }, []);

  const loadSummaries = () => {
    setIsLoading(true);
    fetch(SUMMARIES_API_ENDPOINT)
      .then(res => res.json())
      .then(data => {
        setSummaries(data);    
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return loadSummaries();
    setStatus({ type: 'loading', message: 'Searching...' });

    fetch(SEARCH_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery }),
    })
      .then(res => res.json())
      .then(data => {
        setStatus({ type: '', message: '' });
        setSummaries(
          (data.results || []).map(item => ({
              s3_key: item.s3_url,          
              s: item.summary                
          }))
        );
      })
      .catch(() => setStatus({ type: 'error', message: 'Search failed. Try again.' }));
  };

  const extractFilename = (s3Key) => {
    if (!s3Key) return 'Research Paper';
    return s3Key.includes('-') ? s3Key.split('-').slice(1).join('-') : s3Key;
  };

  return (
    <div className="mt-12 bg-white bg-opacity-90 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Research Paper Summaries</h2>

      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
              placeholder="Search papers by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
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

        {status.message && (
          <div className={`mt-2 p-2 rounded-md flex items-center text-sm ${
            status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status.type === 'error' && <AlertCircle className="mr-2" size={16} />}
            {status.type === 'loading' && <Clock className="mr-2" size={16} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : summaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaries.slice(0, 6).map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md overflow-hidden">
              <h3 className="font-medium text-gray-800 mb-2 truncate" title={extractFilename(item.s3_key)}>
                {extractFilename(item.s3_key)}
              </h3>
              <div className="text-gray-600 text-sm overflow-y-auto max-h-48 mb-4">
                <p>{item.s}</p>
              </div>
              <div className="flex justify-between items-center">
                <AudioPlayer text={item.s} />
                <button
                  onClick={() => navigateTo('qa', item)}
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <MessageSquare size={16} />
                  Ask Question
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No research paper summaries found.</p>
        </div>
      )}
    </div>
  );
}
