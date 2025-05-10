import React, { useState, useRef, useEffect } from 'react';
import { Upload, File, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { API_ENDPOINT } from '../constants';

export default function UploadSection() {
  const [email, setEmail] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const uploadAreaRef = useRef(null);

  const handleFiles = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setStatus({ type: 'error', message: 'Please select a valid PDF file' });
      setFile(null);
      setFilePreview(null);
      return;
    }

    setFile(file);
    setFilePreview({
      name: file.name,
      size: formatFileSize(file.size),
      url: URL.createObjectURL(file),
    });

    window.dispatchEvent(new CustomEvent('filePreview', {
      detail: { url: URL.createObjectURL(file), name: file.name }
    }));

    setStatus({ type: '', message: '' });
  };

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    if (!file || !email) {
      setStatus({ type: 'error', message: 'Please select file and enter email' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'loading', message: 'Uploading...' });

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      const fileName = `${Date.now()}-${file.name}`;

      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: file.type,
          base64Data,
          email,
        }),
      })
        .then(res => res.json())
        .then(() => {
          setStatus({ type: 'success', message: 'Upload successful! Processing started.' });
          setIsUploading(false);
          setTimeout(() => window.dispatchEvent(new CustomEvent('refreshSummaries')), 1000);
        })
        .catch(() => {
          setStatus({ type: 'error', message: 'Upload failed. Try again.' });
          setIsUploading(false);
        });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const uploadArea = uploadAreaRef.current;
    if (!uploadArea) return;

    const preventDefaults = (e) => { e.preventDefault(); e.stopPropagation(); };
    const highlight = () => uploadArea.classList.add('bg-blue-50', 'border-blue-300');
    const unhighlight = () => uploadArea.classList.remove('bg-blue-50', 'border-blue-300');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
      uploadArea.addEventListener(event, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(event => uploadArea.addEventListener(event, highlight, false));
    ['dragleave', 'drop'].forEach(event => uploadArea.addEventListener(event, unhighlight, false));

    uploadArea.addEventListener('drop', (e) => {
      preventDefaults(e);
      unhighlight();
      handleFiles(e.dataTransfer.files[0]);
    }, false);

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        uploadArea.removeEventListener(event, preventDefaults);
      });
      ['dragenter', 'dragover'].forEach(event => uploadArea.removeEventListener(event, highlight));
      ['dragleave', 'drop'].forEach(event => uploadArea.removeEventListener(event, unhighlight));
    };
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Research Paper</h2>
      <input
        type="email"
        className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4"
        placeholder="Enter your email for notifications"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div
        ref={uploadAreaRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer mb-4"
        onClick={() => fileInputRef.current.click()}
      >
        <Upload className="text-gray-400 mx-auto mb-2" size={32} />
        <p className="text-gray-500">Drag & Drop PDF here or Click to Choose File</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files[0])}
        />
      </div>

      {filePreview && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center">
            <File className="text-blue-500 mr-2" size={20} />
            <div>
              <p className="font-medium text-gray-800">{filePreview.name}</p>
              <p className="text-sm text-gray-500">{filePreview.size}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className={`w-full py-2 px-4 rounded-md text-white font-medium transition ${
          !file || isUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        {isUploading ? 'Uploading...' : 'Upload Paper'}
      </button>

      {status.message && (
        <div className={`mt-4 p-3 rounded-md flex items-center ${
          status.type === 'error' ? 'bg-red-50 text-red-700' :
          status.type === 'success' ? 'bg-green-50 text-green-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {status.type === 'error' && <AlertCircle className="mr-2" size={20} />}
          {status.type === 'success' && <CheckCircle className="mr-2" size={20} />}
          {status.type === 'loading' && <Clock className="mr-2" size={20} />}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
