// components/SegmentList.tsx
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Segments</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {segments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No segments yet. Double-click on the timeline to add one.
          </p>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                segment.id === selectedSegmentId
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => {
                onSelect(segment.id);
                onSeek(segment.startTime);
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="inline-block px-2 py-1 text-xs font-medium rounded"
                  style={{ backgroundColor: segment.color + '40', color: segment.color }}
                >
                  {segment.label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(segment.id);
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ×
                </button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Start: {formatTime(segment.startTime)}</div>
                <div>End: {formatTime(segment.endTime)}</div>
                <div>Duration: {(segment.endTime - segment.startTime).toFixed(1)}s</div>
                {segment.id === selectedSegmentId && (
                  <div className="mt-2 space-y-1">
                    <input
                      type="number"
                      step="0.1"
                      value={segment.startTime}
                      onChange={(e) => onUpdate(segment.id, { startTime: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={segment.endTime}
                      onChange={(e) => onUpdate(segment.id, { endTime: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-xs"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SegmentList;