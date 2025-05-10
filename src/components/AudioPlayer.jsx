import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2, Play, Pause } from 'lucide-react';
import { TEXT_TO_SPEECH_API_ENDPOINT } from '../constants';

export default function AudioPlayer({ text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [audio] = useState(new Audio());

  const handlePlay = async () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audio.src = audioUrl;
      audio.play();
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching audio...');
      const response = await fetch(`${TEXT_TO_SPEECH_API_ENDPOINT}?text=${encodeURIComponent(text)}`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Get the base64-encoded audio data
      const base64Audio = await response.text();
      console.log('Base64 audio length:', base64Audio.length);
      
      if (!base64Audio) {
        throw new Error('Received empty audio data');
      }

      // Convert base64 to blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
      
      console.log('Audio blob size:', audioBlob.size);
      console.log('Audio blob type:', audioBlob.type);

      // Create object URL
      const url = URL.createObjectURL(audioBlob);
      
      // Test if the audio can be played
      const testAudio = new Audio();
      testAudio.src = url;
      
      await new Promise((resolve, reject) => {
        testAudio.oncanplaythrough = () => {
          console.log('Audio can play through');
          resolve();
        };
        testAudio.onerror = (e) => {
          console.error('Audio error:', e);
          reject(new Error(`Audio format not supported: ${testAudio.error?.message || 'Unknown error'}`));
        };
        testAudio.load();
      });

      setAudioUrl(url);
      audio.src = url;
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error.message);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  audio.onended = () => {
    setIsPlaying(false);
  };

  // Cleanup audio URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="animate-spin" size={16} />
        ) : isPlaying ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
      </button>
      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
} 