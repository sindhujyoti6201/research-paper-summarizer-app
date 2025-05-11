import React, { useState } from "react";
import { ArrowLeft, Search, BookOpen } from "lucide-react";
import { SEARCH_API_ENDPOINT } from "../constants";

export default function SearchSimilarPapersPage({ navigateTo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    fetch(SEARCH_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((res) => res.json())
      .then((data) => {
        const mappedResults = (data.results || []).map(item => ({
          title: item.s3_url,
          authors: [],
          summary: item.summary,
          paper_url: item.s3_url
        }));
        setResults(mappedResults);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigateTo("home")}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Search Similar Research Papers
      </h2>

      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
            placeholder="Enter keywords to search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search
            className="absolute left-3 top-2.5 text-gray-400"
            size={20}
          />
        </div>
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600"
        >
          Search
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((paper, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-md"
            >
              <h3
                className="text-lg font-medium text-gray-800 mb-3 truncate"
                title={paper.title}
              >
                {paper.title}
              </h3>
              <p className="text-gray-500 text-xs mb-1">
                {paper.authors ? paper.authors.join(", ") : "Unknown authors"}
              </p>
              <div className="text-gray-600 text-sm overflow-y-auto max-h-32 mb-4">
                <p>{paper.summary}</p>
              </div>
              <a
                href={paper.paper_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <BookOpen size={16} />
                View Paper
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg">No similar papers found.</p>
          <p className="text-sm mt-2">Try a different keyword.</p>
        </div>
      )}
    </div>
  );
}
