import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Segment, LabelClass } from '../types';
import { formatTime } from '../utils/timeFormat';
import NewSegmentModal from './NewSegmentModal';

interface TimelineProps {
  segments: Segment[];
  videoDuration: number;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  selectedSegmentId: string | null;
  onSegmentSelect: (id: string | null) => void;
  onSegmentUpdate: (id: string, updates: Partial<Segment>) => void;
  onSegmentDelete: (id: string) => void;
  onAddSegment: (label: string, startTime: number, endTime: number) => void;
  labelClasses: LabelClass[];
  allowOverlap: boolean;
  fps: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCreatingSegment?: boolean;
  segmentStartTime?: number;
}

const Timeline: React.FC<TimelineProps> = ({
  segments,
  videoDuration,
  currentTime,
  onTimeUpdate,
  zoom,
  onZoomChange,
  selectedSegmentId,
  onSegmentSelect,
  onSegmentUpdate,
  onSegmentDelete,
  onAddSegment,
  labelClasses,
  allowOverlap,
  fps,
  videoRef,
  isCreatingSegment,
  segmentStartTime,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingSegment, setDraggingSegment] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ segmentId: string; edge: 'left' | 'right' } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; time: number } | null>(null);
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [newSegmentTime, setNewSegmentTime] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; segmentId: string } | null>(null);
  const [showLabelChangeMenu, setShowLabelChangeMenu] = useState<{ 
    x: number; 
    y: number; 
    segmentId: string;
    currentLabel: string;
  } | null>(null);

  const pixelsPerSecond = 100 * zoom;
  const totalWidth = videoDuration * pixelsPerSecond;

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent;
      setNewSegmentTime(customEvent.detail.time);
      setShowNewSegmentModal(true);
    };
    window.addEventListener('openNewSegmentModal', handleOpenModal);
    return () => window.removeEventListener('openNewSegmentModal', handleOpenModal);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const newZoom = Math.max(0.5, Math.min(10, zoom + (e.deltaY > 0 ? -0.5 : 0.5)));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const xToTime = useCallback((x: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollLeft = timelineRef.current.scrollLeft;
    const relativeX = x - rect.left + scrollLeft;
    return Math.max(0, Math.min(videoDuration, relativeX / pixelsPerSecond));
  }, [pixelsPerSecond, videoDuration]);

  const timeToX = useCallback((time: number): number => {
    return time * pixelsPerSecond;
  }, [pixelsPerSecond]);

  const handleSegmentMouseDown = (e: React.MouseEvent, segmentId: string, edge?: 'left' | 'right') => {
    e.stopPropagation();
    e.preventDefault();
    onSegmentSelect(segmentId);

    if (edge) {
      setResizing({ segmentId, edge });
    } else {
      setDraggingSegment(segmentId);
    }

    const segment = segments.find(s => s.id === segmentId);
    if (segment) {
      setDragStart({ x: e.clientX, time: edge === 'left' ? segment.startTime : segment.endTime });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart || (!draggingSegment && !resizing)) return;
      
      const currentTime = xToTime(e.clientX);
      const timeDelta = currentTime - xToTime(dragStart.x);
      
      if (resizing) {
        const segment = segments.find(s => s.id === resizing.segmentId);
        if (!segment) return;

        if (resizing.edge === 'left') {
          const newStart = Math.max(0, segment.startTime + timeDelta);
          if (newStart < segment.endTime) {
            if (!allowOverlap) {
              const prevSegment = segments.find(s => s.endTime <= newStart && s.id !== segment.id);
              if (prevSegment && newStart < prevSegment.endTime) return;
            }
            onSegmentUpdate(segment.id, { startTime: newStart });
          }
        } else {
          const newEnd = Math.min(videoDuration, segment.endTime + timeDelta);
          if (newEnd > segment.startTime) {
            if (!allowOverlap) {
              const nextSegment = segments.find(s => s.startTime >= newEnd && s.id !== segment.id);
              if (nextSegment && newEnd > nextSegment.startTime) return;
            }
            onSegmentUpdate(segment.id, { endTime: newEnd });
          }
        }
      } else if (draggingSegment) {
        const segment = segments.find(s => s.id === draggingSegment);
        if (!segment) return;

        const duration = segment.endTime - segment.startTime;
        let newStart = segment.startTime + timeDelta;
        let newEnd = segment.endTime + timeDelta;

        if (newStart < 0) {
          newStart = 0;
          newEnd = duration;
        }
        if (newEnd > videoDuration) {
          newEnd = videoDuration;
          newStart = videoDuration - duration;
        }

        if (!allowOverlap) {
          const overlapping = segments.some(s => 
            s.id !== segment.id && 
            ((newStart >= s.startTime && newStart < s.endTime) ||
             (newEnd > s.startTime && newEnd <= s.endTime) ||
             (newStart <= s.startTime && newEnd >= s.endTime))
          );
          if (overlapping) return;
        }

        onSegmentUpdate(segment.id, { startTime: newStart, endTime: newEnd });
      }
    };

    const handleMouseUp = () => {
      setDraggingSegment(null);
      setResizing(null);
      setDragStart(null);
    };

    if (draggingSegment || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStart, draggingSegment, resizing, segments, xToTime, onSegmentUpdate, videoDuration, allowOverlap]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (draggingSegment || resizing) return;
    
    const time = xToTime(e.clientX);
    onTimeUpdate(time);
    onSegmentSelect(null);

    const clickedOnSegment = segments.some(seg => time >= seg.startTime && time <= seg.endTime);
    if (!clickedOnSegment && e.detail === 1) {
      onTimeUpdate(time);
    }
  };

  const handleTimelineDoubleClick = (e: React.MouseEvent) => {
    const time = xToTime(e.clientX);
    setNewSegmentTime(time);
    setShowNewSegmentModal(true);
  };

  const handleContextMenu = (e: React.MouseEvent, segmentId: string) => {
    e.preventDefault();
    
    // Calculate position - menu appears above the click point
    const menuHeight = 150; // Approximate height of context menu
    const menuX = e.clientX;
    const menuY = e.clientY - menuHeight;
    
    // Ensure menu stays within viewport
    const finalY = Math.max(10, menuY); // At least 10px from top
    
    setContextMenu({ x: menuX, y: finalY, segmentId });
  };

  const handleDeleteSegment = (segmentId: string) => {
    onSegmentDelete(segmentId);
    setContextMenu(null);
  };

  const handleChangeLabel = (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (segment && contextMenu) {
      // Position the label submenu to the right of the context menu
      const labelMenuHeight = 300; // Approximate max height of label menu
      const labelMenuX = contextMenu.x + 200;
      const labelMenuY = contextMenu.y - 200;
      
      setShowLabelChangeMenu({
        x: labelMenuX,
        y: labelMenuY,
        segmentId: segmentId,
        currentLabel: segment.label,
      });
    }
    setContextMenu(null);
  };

  const handleLabelSelect = (segmentId: string, newLabel: string, newColor: string) => {
    onSegmentUpdate(segmentId, { 
      label: newLabel,
      color: newColor 
    });
    setShowLabelChangeMenu(null);
  };

  const handleCloseAllMenus = () => {
    setContextMenu(null);
    setShowLabelChangeMenu(null);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={() => onZoomChange(Math.max(0.5, zoom - 0.5))}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Zoom Out
        </button>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          className="w-24"
        />
        <button
          onClick={() => onZoomChange(Math.min(10, zoom + 0.5))}
          className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Zoom In
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">{zoom}x</span>
      </div>

      <div
        ref={timelineRef}
        className="relative overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 cursor-crosshair"
        style={{ height: '120px' }}
        onClick={handleTimelineClick}
        onDoubleClick={handleTimelineDoubleClick}
        onWheel={handleWheel}
      >
        <div className="relative" style={{ width: `${totalWidth}px`, height: '100%' }}>
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-gray-300 dark:border-gray-600">
            {Array.from({ length: Math.ceil(videoDuration) + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-400 pl-1"
                style={{ left: `${timeToX(i)}px` }}
              >
                {formatTime(i)}
              </div>
            ))}
          </div>

          <div className="absolute top-6 left-0 right-0 bottom-0">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className={`absolute top-2 bottom-2 rounded border-2 cursor-move transition-shadow ${
                  segment.id === selectedSegmentId ? 'ring-2 ring-blue-500 shadow-lg' : ''
                } ${draggingSegment === segment.id ? 'opacity-75' : ''}`}
                style={{
                  left: `${timeToX(segment.startTime)}px`,
                  width: `${timeToX(segment.endTime - segment.startTime)}px`,
                  backgroundColor: segment.color + '40',
                  borderColor: segment.color,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSegmentSelect(segment.id);
                  onTimeUpdate(segment.startTime);
                }}
                onMouseDown={(e) => handleSegmentMouseDown(e, segment.id)}
                onContextMenu={(e) => handleContextMenu(e, segment.id)}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20 rounded-l"
                  onMouseDown={(e) => handleSegmentMouseDown(e, segment.id, 'left')}
                />
                
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20 rounded-r"
                  onMouseDown={(e) => handleSegmentMouseDown(e, segment.id, 'right')}
                />

                <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2">
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {segment.label}
                    <br />
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                    </span>
                  </span>
                </div>
              </div>
            ))}

            {isCreatingSegment && segmentStartTime !== undefined && (
              <div
                className="absolute top-2 bottom-2 rounded border-2 border-dashed border-green-500 bg-green-500/10 animate-pulse"
                style={{
                  left: `${timeToX(segmentStartTime)}px`,
                  width: `${timeToX(currentTime - segmentStartTime)}px`,
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    Recording...
                  </span>
                </div>
              </div>
            )}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: `${timeToX(currentTime)}px` }}
            >
              <div className="absolute top-0 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu - Positioned above the click point */}
      {contextMenu && (
        <>
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center space-x-2"
              onClick={() => handleChangeLabel(contextMenu.segmentId)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Change Label</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center space-x-2"
              onClick={() => handleDeleteSegment(contextMenu.segmentId)}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Segment</span>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center space-x-2"
              onClick={handleCloseAllMenus}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Cancel</span>
            </button>
          </div>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseAllMenus}
          />
        </>
      )}

      {/* Label Change Submenu */}
      {showLabelChangeMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 max-h-80 overflow-y-auto min-w-[200px]"
          style={{ left: showLabelChangeMenu.x, top: showLabelChangeMenu.y }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            Select New Label
          </div>
          {labelClasses.map((labelClass) => (
            <button
              key={labelClass.name}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                labelClass.name === showLabelChangeMenu.currentLabel 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : ''
              }`}
              onClick={() => handleLabelSelect(
                showLabelChangeMenu.segmentId, 
                labelClass.name, 
                labelClass.color
              )}
            >
              <span
                className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: labelClass.color }}
              />
              <span className={`flex-1 ${
                labelClass.name === showLabelChangeMenu.currentLabel 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {labelClass.name}
              </span>
              {labelClass.name === showLabelChangeMenu.currentLabel && (
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      {showNewSegmentModal && (
        <NewSegmentModal
          time={newSegmentTime}
          labelClasses={labelClasses}
          videoDuration={videoDuration}
          onAdd={(label, startTime, endTime) => {
            onAddSegment(label, startTime, endTime);
            setShowNewSegmentModal(false);
          }}
          onClose={() => setShowNewSegmentModal(false)}
          fps={fps}
          videoRef={videoRef}
          onSeek={onTimeUpdate}
        />
      )}
    </div>
  );
};

export default Timeline;