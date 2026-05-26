// components/VideoPlayer.tsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { formatTime } from '../utils/timeFormat';

interface VideoPlayerProps {
  videoUrl: string;
  onVideoUpload: (file: File) => void;
  onVideoLoaded: (duration: number, fps: number) => void;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  fps: number;
  videoError: string;
  isLoading: boolean;
  videoRef: React.RefObject<HTMLVideoElement>; // Changed to allow null
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  onVideoUpload,
  onVideoLoaded,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onPlayPause,
  fps,
  videoError,
  isLoading,
  videoRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [localVideoError, setLocalVideoError] = useState(''); // Add local error state

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setLocalVideoError(''); // Clear any previous errors
      onVideoUpload(file);
    } else if (file) {
      setLocalVideoError('Please select a valid video file');
    }
  };

 // components/VideoPlayer.tsx - Update handleLoadedMetadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      // Try to get FPS from video track
      let videoFps = 30;
      try {
        const videoElement = videoRef.current as any;
        if ('captureStream' in videoElement) {
          const stream = videoElement.captureStream();
          const tracks = stream.getVideoTracks();
          if (tracks.length > 0) {
            const settings = tracks[0].getSettings();
            if (settings.frameRate) {
              videoFps = Math.round(settings.frameRate);
            }
          }
        }
      } catch (e) {
        console.log('Could not detect FPS, using default 30');
      }
      onVideoLoaded(duration, videoFps);
    }
  }, [onVideoLoaded, videoRef]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  }, [onTimeUpdate, videoRef]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          setLocalVideoError('Failed to play video: ' + err.message);
        });
      }
      onPlayPause(!isPlaying);
    }
  };

  const seekBy = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  const stepFrame = (direction: number) => {
    if (videoRef.current) {
      const frameTime = 1 / fps;
      const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + direction * frameTime));
      videoRef.current.currentTime = newTime;
      onTimeUpdate(newTime);
    }
  };

  const handleVideoError = () => {
    setLocalVideoError('Failed to load video. Please try a different file.');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          stepFrame(-1);
        } else {
          seekBy(-5);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          stepFrame(1);
        } else {
          seekBy(5);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, fps]);

  const displayError = videoError || localVideoError;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {!videoUrl ? (
        <div className="p-12 text-center">
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Upload Video File</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Click to browse or drag and drop</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Supports MP4, WebM, AVI</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
          {displayError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {displayError}
            </div>
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            preload="metadata"
          />
          <div className="p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
            {/* Progress bar */}
            <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const time = percentage * (videoRef.current?.duration || 0);
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                  onTimeUpdate(time);
                }
              }}
            >
              <div
                className="absolute h-full bg-blue-500 rounded"
                style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  {isPlaying ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>

                {/* Frame step */}
                <button onClick={() => stepFrame(-1)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Previous frame">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                  </svg>
                </button>
                <button onClick={() => stepFrame(1)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Next frame">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 18h2V6h-2zm-11-7l8.5-6v12z"/>
                  </svg>
                </button>

                {/* Time display */}
                <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                  {formatTime(currentTime)} / {formatTime(videoRef.current?.duration || 0)}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {/* Volume */}
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      setVolume(vol);
                      if (videoRef.current) videoRef.current.volume = vol;
                    }}
                    className="w-20 h-1"
                  />
                </div>

                {/* Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const speed = parseFloat(e.target.value);
                    setPlaybackRate(speed);
                    if (videoRef.current) videoRef.current.playbackRate = speed;
                  }}
                  className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  <option value="0.25">0.25x</option>
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VideoPlayer;