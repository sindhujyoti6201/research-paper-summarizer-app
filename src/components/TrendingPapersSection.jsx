import React, { useState, useEffect } from "react";
import { TrendingUp, MessageSquare, RefreshCw, ExternalLink, ArrowLeft } from "lucide-react";
import { TRENDING_PAPERS_API_ENDPOINT } from "../constants";

export default function TrendingPapersSection({ navigateTo }) {
  const [papers, setPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrendingPapers = () => {
    setIsLoading(true);
    fetch(TRENDING_PAPERS_API_ENDPOINT)
      .then((res) => res.json())
      .then((data) => {
        setPapers(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching trending papers:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTrendingPapers();
  }, []);

  return (
    <div className="mt-12 bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigateTo("home")}
          className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp size={22} /> Trending Research Papers
        </h2>
        <button
          onClick={fetchTrendingPapers}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {papers.map((paper, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-gray-800 mb-2">
                {paper.title}
              </h3>
              <p className="text-gray-500 text-xs mb-3 italic">
                {paper.authors && paper.authors.length > 0
                  ? paper.authors.join(", ")
                  : "Unknown authors"}
              </p>
              <div className="text-gray-600 text-sm overflow-y-auto max-h-32 mb-4 pr-1">
                <p>{paper.summary}</p>
              </div>
              <div className="flex justify-between items-center">
                <a
                  href={paper.paper_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <ExternalLink size={16} />
                  View Paper
                </a>
                <button
                  onClick={() => navigateTo("qa", paper)}
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <MessageSquare size={16} />
                  Ask Question
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
