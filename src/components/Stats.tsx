// components/Stats.tsx
import React, { useMemo } from 'react';
import { Segment, LabelClass } from '../types';

interface StatsProps {
  segments: Segment[];
  labelClasses: LabelClass[];
  videoDuration: number;
}

const Stats: React.FC<StatsProps> = ({ segments, labelClasses, videoDuration }) => {
  const stats = useMemo(() => {
    const labelStats: Record<string, { count: number; totalDuration: number }> = {};
    
    labelClasses.forEach(lc => {
      labelStats[lc.name] = { count: 0, totalDuration: 0 };
    });

    segments.forEach(seg => {
      if (labelStats[seg.label]) {
        labelStats[seg.label].count++;
        labelStats[seg.label].totalDuration += seg.endTime - seg.startTime;
      }
    });

    return labelStats;
  }, [segments, labelClasses]);

  const totalAnnotated = segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0);
  const annotationCoverage = videoDuration > 0 ? (totalAnnotated / videoDuration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Total Segments:</span>
          <span className="font-medium text-gray-900 dark:text-white">{segments.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Coverage:</span>
          <span className="font-medium text-gray-900 dark:text-white">{annotationCoverage.toFixed(1)}%</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Per Label</h3>
          {Object.entries(stats).map(([label, data]) => (
            <div key={label} className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: labelClasses.find(lc => lc.name === label)?.color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
              </div>
              <span className="text-gray-600 dark:text-gray-400">
                {data.count} seg, {(data.totalDuration).toFixed(1)}s
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;