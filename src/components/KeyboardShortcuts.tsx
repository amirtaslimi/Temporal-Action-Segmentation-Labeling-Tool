// components/KeyboardShortcuts.tsx
import React from 'react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Space', description: 'Play/Pause video' },
    { key: '←/→', description: 'Seek -5s / +5s' },
    { key: 'Shift + ←/→', description: 'Previous/Next frame' },
    { key: 'N', description: 'New segment at current time' },
    { key: 'S', description: 'Split segment at current time' },
    { key: 'Delete/Backspace', description: 'Delete selected segment' },
    { key: 'Ctrl/Cmd + Z', description: 'Undo' },
    { key: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
    { key: '?', description: 'Toggle this shortcuts overlay' },
    { key: 'Double-click timeline', description: 'Add segment at position' },
    { key: 'Right-click segment', description: 'Delete segment' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ×
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