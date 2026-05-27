import React from 'react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space', description: 'Play/Pause video' },
    { key: '←/→', description: 'Seek -5s / +5s' },
    { key: 'Shift + ←/→', description: 'Previous/Next frame' },
    { key: 'N', description: 'Start/End segment while watching' },
    { key: 'Esc', description: 'Cancel current segment' },
    { key: 'S', description: 'Split segment at current time' },
    { key: 'Delete/Backspace', description: 'Delete selected segment' },
    { key: 'Ctrl/Cmd + Z', description: 'Undo' },
    { key: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
    { key: 'Ctrl/Cmd + N', description: 'New session' },
    { key: '?', description: 'Toggle this shortcuts overlay' },
    { key: 'Double-click timeline', description: 'Add segment at position' },
    { key: 'Right-click segment', description: 'Delete segment' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded border border-gray-300 dark:border-gray-600">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;