// components/LabelManager.tsx
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Label Classes</h2>
      
      <div className="space-y-2 mb-4">
        {labelClasses.map((lc) => (
          <div key={lc.name} className="flex items-center space-x-2">
            <input
              type="color"
              value={lc.color}
              onChange={(e) => updateLabelColor(lc.name, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            {editingLabel === lc.name ? (
              <input
                type="text"
                value={lc.name}
                onChange={(e) => {
                  onUpdate();
                  setLabelClasses(labelClasses.map(l => l.name === editingLabel ? { ...l, name: e.target.value } : l));
                }}
                onBlur={() => setEditingLabel(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingLabel(null)}
                autoFocus
                className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <span
                className="flex-1 text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-500"
                onDoubleClick={() => setEditingLabel(lc.name)}
              >
                {lc.name}
              </span>
            )}
            <button
              onClick={() => deleteLabel(lc.name)}
              className="text-red-500 hover:text-red-700 text-sm"
              title="Delete label"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newLabelName}
          onChange={(e) => setNewLabelName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addLabel()}
          placeholder="New label name..."
          className="flex-1 border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          onClick={addLabel}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default LabelManager;