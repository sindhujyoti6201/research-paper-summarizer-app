import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CHAT_API_ENDPOINT } from '../constants';

export default function QAPage({ navigateTo, paper }) {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPaper, setCurrentPaper] = useState(paper);

  useEffect(() => {
    if (paper) {
      setCurrentPaper(paper);
      setAnswers([]);
    }
  }, [paper]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question })
      });
      const data = await response.json();

      const answerText = data.answer || "No answer found.";
      const newAnswer = {
        question: question,
        answer: answerText
      };
      setAnswers([newAnswer, ...answers]);
      setQuestion('');
    } catch (err) {
      console.error('❗ Error fetching answer:', err);
      alert('Error calling chatbot. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractFilename = (s3Key) => {
    if (!s3Key) return 'Research Paper';
    return s3Key.includes('-') ? s3Key.split('-').slice(1).join('-') : s3Key;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigateTo('home')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </div>

      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ask Questions</h2>
      {currentPaper && (
        <p className="text-sm text-gray-500 mb-6">
          Related to: <span className="font-medium text-gray-700">{extractFilename(currentPaper.s3_key)}</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
          placeholder="Type your question about this paper..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className={`w-full py-2 px-4 rounded-md font-medium text-white ${
            !question.trim() || isLoading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isLoading ? 'Submitting...' : 'Ask Question'}
        </button>
      </form>

      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Previous Q&A</h3>
        {answers.length > 0 ? (
          <ul className="space-y-4">
            {answers.map((item, index) => (
              <li key={index} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <p className="font-medium text-gray-800">Q: {item.question}</p>
                <p className="mt-2 text-gray-600">A: {item.answer}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No questions asked yet.</p>
        )}
      </div>
    </div>
  );
}
