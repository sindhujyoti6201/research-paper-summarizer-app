import React, { useState, useEffect } from 'react';

export default function PDFPreviewSection() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfName, setPdfName] = useState('');

  useEffect(() => {
    const handleFilePreview = (e) => {
      setPdfUrl(e.detail.url);
      setPdfName(e.detail.name);
    };

    window.addEventListener('filePreview', handleFilePreview);

    return () => {
      window.removeEventListener('filePreview', handleFilePreview);
    };
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${!pdfUrl ? 'hidden lg:block' : ''}`}>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">PDF Preview</h2>

      {pdfUrl ? (
        <>
          <div className="mb-2 pb-2 border-b border-gray-200">
            <h3 className="text-gray-600 truncate">{pdfName || 'Document Preview'}</h3>
          </div>
          <div className="h-96 w-full">
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              className="w-full h-full border-0"
            />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-96 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-gray-400">No PDF selected for preview</p>
        </div>
      )}
    </div>
  );
}
