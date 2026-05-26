// components/NewSegmentModal.tsx
import React, { useState } from 'react';
import { LabelClass } from '../types';
import { formatTime } from '../utils/timeFormat';

interface NewSegmentModalProps {
  time: number;
  labelClasses: LabelClass[];
  videoDuration: number;
  onAdd: (label: string, startTime: number, endTime: number) => void;
  onClose: () => void;
  fps: number;
}

const NewSegmentModal: React.FC<NewSegmentModalProps> = ({
  time,
  labelClasses,
  videoDuration,
  onAdd,
  onClose,
  fps,
}) => {
  const [selectedLabel, setSelectedLabel] = useState(labelClasses[0]?.name || '');
  const [startTime, setStartTime] = useState(time);
  const [endTime, setEndTime] = useState(Math.min(time + 5, videoDuration));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLabel && endTime > startTime) {
      onAdd(selectedLabel, startTime, endTime);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-96">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Segment</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
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
                  <option key={lc.name} value={lc.name}>{lc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time (seconds)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max={endTime - 0.1}
                value={startTime}
                onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">{formatTime(startTime)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time (seconds)
              </label>
              <input
                type="number"
                step="0.1"
                min={startTime + 0.1}
                max={videoDuration}
                value={endTime}
                onChange={(e) => setEndTime(parseFloat(e.target.value) || videoDuration)}
                className="w-full border rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <span className="text-xs text-gray-500">{formatTime(endTime)}</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Start Frame: {Math.floor(startTime * fps)}</p>
              <p>End Frame: {Math.floor(endTime * fps)}</p>
              <p>Duration: {(endTime - startTime).toFixed(1)}s</p>
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
              className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
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