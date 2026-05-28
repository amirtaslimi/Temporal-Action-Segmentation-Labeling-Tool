import React, { useEffect } from 'react';
import { Segment, LabelClass } from '../types';

interface NewSessionDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  segments: Segment[];
  labelClasses: LabelClass[];
  videoFileName: string;
}

const NewSessionDialog: React.FC<NewSessionDialogProps> = ({
  onConfirm,
  onCancel,
  segments,
  labelClasses,
  videoFileName,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  const hasData = segments.length > 0 || labelClasses.length > 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              New Session
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will clear all current annotations and start fresh with a new video.
          </p>

          {hasData && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30 rounded-lg p-3">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                Current session will be saved automatically:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                <li>• Video: {videoFileName || 'None'}</li>
                <li>• Segments: {segments.length}</li>
                <li>• Labels: {labelClasses.length}</li>
              </ul>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 You can export your current annotations before starting a new session.
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSessionDialog;