// components/NewSegmentModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { LabelClass } from '../types';
import { formatTime } from '../utils/timeFormat';

interface NewSegmentModalProps {
  time: number;
  labelClasses: LabelClass[];
  videoDuration: number;
  onAdd: (label: string, startTime: number, endTime: number) => void;
  onClose: () => void;
  fps: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onSeek?: (time: number) => void;
}

const NewSegmentModal: React.FC<NewSegmentModalProps> = ({
  time,
  labelClasses,
  videoDuration,
  onAdd,
  onClose,
  fps,
  videoRef,
  onSeek,
}) => {
  const [selectedLabel, setSelectedLabel] = useState(labelClasses[0]?.name || '');
  const [startTime, setStartTime] = useState(time);
  const [endTime, setEndTime] = useState(Math.min(time + 5, videoDuration));
  const [isSettingEndTime, setIsSettingEndTime] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(time);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for video time updates while setting end time
  useEffect(() => {
    if (isSettingEndTime && videoRef.current) {
      const updateTime = () => {
        if (videoRef.current) {
          setCurrentPlayTime(videoRef.current.currentTime);
        }
      };
      
      intervalRef.current = setInterval(updateTime, 100); // Update every 100ms
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isSettingEndTime, videoRef]);

  const handleStartSettingEndTime = () => {
    setIsSettingEndTime(true);
    // Seek to start time
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play().catch(console.error);
    }
  };

  const handleSetEndTimeNow = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      const currentEnd = videoRef.current.currentTime;
      if (currentEnd > startTime) {
        setEndTime(currentEnd);
      }
    }
    setIsSettingEndTime(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleCancelSettingEndTime = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsSettingEndTime(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLabel && endTime > startTime) {
      onAdd(selectedLabel, startTime, endTime);
    }
  };

  const handleSeekToStart = () => {
    if (videoRef.current && onSeek) {
      videoRef.current.currentTime = startTime;
      onSeek(startTime);
    }
  };

  const handleSeekToEnd = () => {
    if (videoRef.current && onSeek) {
      videoRef.current.currentTime = endTime;
      onSeek(endTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[500px] max-w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          New Segment
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Label Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Label Class
              </label>
              <select
                value={selectedLabel}
                onChange={(e) => setSelectedLabel(e.target.value)}
                className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {labelClasses.map((lc) => (
                  <option key={lc.name} value={lc.name}>
                    {lc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start Time
                </label>
                <button
                  type="button"
                  onClick={handleSeekToStart}
                  className="text-xs text-blue-500 hover:text-blue-600"
                  title="Seek to start time"
                >
                  Seek to Start
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={endTime - 0.1}
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="flex-1 border rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      setStartTime(videoRef.current.currentTime);
                    }
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="Use current video time as start"
                >
                  Now
                </button>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {formatTime(startTime)} (Frame: {Math.floor(startTime * fps)})
              </span>
            </div>

            {/* End Time */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  End Time
                </label>
                <button
                  type="button"
                  onClick={handleSeekToEnd}
                  className="text-xs text-blue-500 hover:text-blue-600"
                  title="Seek to end time"
                >
                  Seek to End
                </button>
              </div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  min={startTime + 0.1}
                  max={videoDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || videoDuration)}
                  className="flex-1 border rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      setEndTime(videoRef.current.currentTime);
                    }
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  title="Use current video time as end"
                >
                  Now
                </button>
              </div>
              <span className="text-xs text-gray-500 mt-1 block">
                {formatTime(endTime)} (Frame: {Math.floor(endTime * fps)})
              </span>
            </div>

            {/* Watch to Set End Time Section */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              {!isSettingEndTime ? (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Don't know the end time? Watch the video and set it visually:
                  </p>
                  <button
                    type="button"
                    onClick={handleStartSettingEndTime}
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>Watch & Set End Time</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      🎥 Video playing from start time
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      Current: {formatTime(currentPlayTime)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleSetEndTimeNow}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      Set End Here ({formatTime(currentPlayTime)})
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelSettingEndTime}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Click "Set End Here" when the action ends in the video
                  </p>
                </div>
              )}
            </div>

            {/* Duration Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded">
              <p>Duration: <strong>{(endTime - startTime).toFixed(2)}s</strong></p>
              <p>Frames: <strong>{Math.floor((endTime - startTime) * fps)}</strong></p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSettingEndTime}
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Segment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSegmentModal;