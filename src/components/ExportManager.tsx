// components/ExportManager.tsx
import React, { useState } from 'react';
import { AnnotationData, LabelClass, Segment } from '../types';

interface ExportManagerProps {
  exportData: () => AnnotationData;
  importData: (data: AnnotationData) => void;
  segments: Segment[];
  labelClasses: LabelClass[];
}

const ExportManager: React.FC<ExportManagerProps> = ({ exportData, importData, segments, labelClasses }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${data.video_file || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const data = exportData();
    const csvContent = [
      ['label', 'start_sec', 'end_sec', 'start_frame', 'end_frame'].join(','),
      ...data.segments.map(seg => 
        [seg.label, seg.start_time, seg.end_time, seg.start_frame, seg.end_frame].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${data.video_file || 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string) as AnnotationData;
          importData(data);
        } catch (error) {
          alert('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const previewData = exportData();

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Preview
        </button>
        <button
          onClick={handleExportJSON}
          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export JSON
        </button>
        <button
          onClick={handleExportCSV}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export CSV
        </button>
        <label className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer">
          Import JSON
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded overflow-x-auto">
              <code>{JSON.stringify(previewData, null, 2)}</code>
            </pre>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Total segments: {previewData.segments.length}</p>
              <p>Label classes: {previewData.label_classes.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportManager;