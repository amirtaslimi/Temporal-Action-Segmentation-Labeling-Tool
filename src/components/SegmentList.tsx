import React from 'react';
import { Segment } from '../types';
import { formatTime } from '../utils/timeFormat';

interface SegmentListProps {
  segments: Segment[];
  selectedSegmentId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Segment>) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

const SegmentList: React.FC<SegmentListProps> = ({
  segments,
  selectedSegmentId,
  onSelect,
  onDelete,
  onUpdate,
  currentTime,
  onSeek,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Segments ({segments.length})
      </h2>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {segments.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            Double-click timeline to add
          </p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`p-2 rounded border cursor-pointer transition-colors ${
                segment.id === selectedSegmentId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                onSelect(segment.id);
                onSeek(segment.endTime);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="inline-block px-1.5 py-0.5 text-xs font-medium rounded"
                  style={{ backgroundColor: segment.color + '40', color: segment.color }}
                >
                  {segment.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(segment.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span>{formatTime(segment.startTime)} - {formatTime(segment.endTime)}</span>
                <span className="ml-1">({(segment.endTime - segment.startTime).toFixed(1)}s)</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SegmentList;