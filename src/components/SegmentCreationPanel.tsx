import React, { useEffect, useState } from 'react';
import { LabelClass } from '../types';
import { formatTime } from '../utils/timeFormat';

interface SegmentCreationPanelProps {
  isCreating: boolean;
  segmentStartTime: number;
  currentTime: number;
  selectedLabel: string;
  labelClasses: LabelClass[];
  onLabelChange: (label: string) => void;
  onEndSegment: () => void;
  onCancelSegment: () => void;
  onStartSegment: () => void;
  fps: number;
}

const SegmentCreationPanel: React.FC<SegmentCreationPanelProps> = ({
  isCreating,
  segmentStartTime,
  currentTime,
  selectedLabel,
  labelClasses,
  onLabelChange,
  onEndSegment,
  onCancelSegment,
  onStartSegment,
  fps,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isCreating) {
      const interval = setInterval(() => {
        setElapsedTime(currentTime - segmentStartTime);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setElapsedTime(0);
    }
  }, [isCreating, currentTime, segmentStartTime]);

  return (
    <div className="w-80 flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 transition-all duration-300 ${
          isCreating 
            ? 'border-green-500 dark:border-green-400 shadow-green-100 dark:shadow-green-900/20' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Segment Creator
              </h3>
              {isCreating && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1.5"></span>
                  Recording
                </span>
              )}
            </div>

            {!isCreating ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Press <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">N</kbd> or click below to start a new segment while watching the video.
                </p>
                <button
                  onClick={onStartSegment}
                  className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  <span>Start Segment</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Action Label
                  </label>
                  <select
                    value={selectedLabel}
                    onChange={(e) => onLabelChange(e.target.value)}
                    className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  >
                    {labelClasses.map((lc) => (
                      <option key={lc.name} value={lc.name}>
                        {lc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Start:</span>
                    <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                      {formatTime(segmentStartTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Current:</span>
                    <span className="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">
                      {formatTime(currentTime)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="text-lg font-mono font-bold text-green-600 dark:text-green-400">
                        {elapsedTime >= 0 ? formatTime(elapsedTime) : '0:00'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-500">Frames:</span>
                      <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
                        {Math.floor(elapsedTime * fps)}
                      </span>
                    </div>
                  </div>
                </div>

                <div 
                  className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, ${labelClasses.find(lc => lc.name === selectedLabel)?.color || '#3B82F6'} 0%, ${labelClasses.find(lc => lc.name === selectedLabel)?.color || '#3B82F6'}40 ${Math.min((elapsedTime / 10) * 100, 100)}%, transparent ${Math.min((elapsedTime / 10) * 100, 100)}%)`
                  }}
                />

                <div className="space-y-2">
                  <button
                    onClick={onEndSegment}
                    className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 19c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2v10c0 1.1.9 2 2 2zm6-12v10c0 1.1.9 2 2 2s2-.9 2-2V7c0-1.1-.9-2-2-2s-2 .9-2 2z"/>
                    </svg>
                    <span>End Segment (N)</span>
                  </button>
                  <button
                    onClick={onCancelSegment}
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                  >
                    Cancel (Esc)
                  </button>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Video continues playing • Press N to end segment
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">
            💡 Quick Tips
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">N</kbd> to start/end segment</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded">Esc</kbd> to cancel</li>
            <li>• Video keeps playing while marking</li>
            <li>• Change label anytime during segment</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SegmentCreationPanel;