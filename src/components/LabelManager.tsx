import React, { useState } from 'react';
import { LabelClass } from '../types';

interface LabelManagerProps {
  labelClasses: LabelClass[];
  setLabelClasses: (classes: LabelClass[]) => void;
  onUpdate: () => void;
}

const LabelManager: React.FC<LabelManagerProps> = ({ labelClasses, setLabelClasses, onUpdate }) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [editingLabel, setEditingLabel] = useState<string | null>(null);

  const addLabel = () => {
    if (newLabelName.trim() && !labelClasses.find(lc => lc.name === newLabelName.trim())) {
      onUpdate();
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      const randomColor = colors[labelClasses.length % colors.length];
      setLabelClasses([...labelClasses, { name: newLabelName.trim(), color: randomColor }]);
      setNewLabelName('');
    }
  };

  const deleteLabel = (name: string) => {
    onUpdate();
    setLabelClasses(labelClasses.filter(lc => lc.name !== name));
  };

  const updateLabelColor = (name: string, color: string) => {
    onUpdate();
    setLabelClasses(labelClasses.map(lc => lc.name === name ? { ...lc, color } : lc));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Labels</h2>
      
      <div className="space-y-1 mb-2 max-h-48 overflow-y-auto">
        {labelClasses.map((lc) => (
          <div key={lc.name} className="flex items-center space-x-1.5">
            <input
              type="color"
              value={lc.color}
              onChange={(e) => updateLabelColor(lc.name, e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            />
            {editingLabel === lc.name ? (
              <input
                type="text"
                value={lc.name}
                onChange={(e) => {
                  setLabelClasses(labelClasses.map(l => l.name === editingLabel ? { ...l, name: e.target.value } : l));
                }}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
                className="flex-1 border rounded px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <span
                className="flex-1 text-xs text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 truncate"
                onDoubleClick={() => setEditingLabel(lc.name)}
              >
                {lc.name}
              </span>
            )}
            <button
              onClick={() => deleteLabel(lc.name)}
              className="text-red-500 hover:text-red-700 text-xs px-1"
              title="Delete label"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-1">
        <input
          type="text"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLabel()}
          placeholder="New label..."
          className="flex-1 border rounded px-1.5 py-0.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={addLabel}
          className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default LabelManager;