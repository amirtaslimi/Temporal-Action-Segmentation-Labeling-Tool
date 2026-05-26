// App.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import LabelManager from './components/LabelManager';
import SegmentList from './components/SegmentList';
import ExportManager from './components/ExportManager';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Stats from './components/Stats';
import { LabelClass, Segment, AnnotationData, UndoRedoState } from './types';
import { saveToIndexedDB, loadFromIndexedDB, clearIndexedDB } from './utils/indexedDB';
import { formatTime } from './utils/timeFormat';

const App: React.FC = () => {
  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fps, setFps] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoError, setVideoError] = useState<string>('');

  // Label classes
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([
    { name: 'Walking', color: '#FF6B6B' },
    { name: 'Running', color: '#4ECDC4' },
    { name: 'Standing', color: '#45B7D1' },
    { name: 'Sitting', color: '#96CEB4' },
    { name: 'Opening Door', color: '#FFEAA7' },
  ]);

  // Segments
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [allowOverlap, setAllowOverlap] = useState(false);

  // Timeline
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);

  // Auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null!);

  // Load auto-saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const saved = await loadFromIndexedDB();
        if (saved) {
          setLabelClasses(saved.labelClasses);
          setSegments(saved.segments);
          setAllowOverlap(saved.allowOverlap || false);
          setFps(saved.fps || 30);
          // Note: video file can't be auto-loaded from IndexedDB due to File API limitations
        }
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (labelClasses.length > 0 || segments.length > 0) {
      autoSaveTimerRef.current = setInterval(() => {
        saveToIndexedDB({
          labelClasses,
          segments,
          allowOverlap,
          fps,
        });
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [labelClasses, segments, allowOverlap, fps]);

  // Push to undo stack before making changes
  const pushToUndo = useCallback(() => {
    setUndoStack((prev) => [
      ...prev,
      { segments: JSON.parse(JSON.stringify(segments)), labelClasses: JSON.parse(JSON.stringify(labelClasses)) },
    ]);
    setRedoStack([]);
  }, [segments, labelClasses]);

  // Undo
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [
      ...prev,
      { segments: JSON.parse(JSON.stringify(segments)), labelClasses: JSON.parse(JSON.stringify(labelClasses)) },
    ]);
    setSegments(previousState.segments);
    setLabelClasses(previousState.labelClasses);
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack, segments, labelClasses]);

  // Redo
  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [
      ...prev,
      { segments: JSON.parse(JSON.stringify(segments)), labelClasses: JSON.parse(JSON.stringify(labelClasses)) },
    ]);
    setSegments(nextState.segments);
    setLabelClasses(nextState.labelClasses);
    setRedoStack((prev) => prev.slice(0, -1));
  }, [redoStack, segments, labelClasses]);

  // Video file handling
  const handleVideoUpload = useCallback((file: File) => {
    setVideoError('');
    setIsLoading(true);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setIsLoading(false);
  }, []);

  // Video metadata loaded
  const handleVideoLoaded = useCallback((duration: number, videoFps: number) => {
    setVideoDuration(duration);
    setFps(videoFps);
    setIsLoading(false);
  }, []);

  // Add segment
  const addSegment = useCallback(
    (label: string, startTime: number, endTime: number) => {
      pushToUndo();
      const newSegment: Segment = {
        id: `segment-${Date.now()}-${Math.random()}`,
        label,
        startTime,
        endTime,
        color: labelClasses.find((lc) => lc.name === label)?.color || '#000000',
      };
      setSegments((prev) => [...prev, newSegment].sort((a, b) => a.startTime - b.startTime));
      setSelectedSegmentId(newSegment.id);
    },
    [labelClasses, pushToUndo]
  );

  // Update segment
  const updateSegment = useCallback(
    (segmentId: string, updates: Partial<Segment>) => {
      pushToUndo();
      setSegments((prev) =>
        prev.map((seg) =>
          seg.id === segmentId ? { ...seg, ...updates, color: updates.label ? labelClasses.find((lc) => lc.name === updates.label)?.color || seg.color : seg.color } : seg
        )
      );
    },
    [labelClasses, pushToUndo]
  );

  // Delete segment
  const deleteSegment = useCallback(
    (segmentId: string) => {
      pushToUndo();
      setSegments((prev) => prev.filter((seg) => seg.id !== segmentId));
      setSelectedSegmentId(null);
    },
    [pushToUndo]
  );

  // Merge adjacent segments with same label
  const mergeAdjacentSegments = useCallback(() => {
    pushToUndo();
    setSegments((prev) => {
      const merged: Segment[] = [];
      let current = prev[0];
      for (let i = 1; i < prev.length; i++) {
        if (current.label === prev[i].label && current.endTime === prev[i].startTime) {
          current = { ...current, endTime: prev[i].endTime };
        } else {
          merged.push(current);
          current = prev[i];
        }
      }
      merged.push(current);
      return merged;
    });
  }, [pushToUndo]);

  // Split segment at current time
  const splitSegmentAtCurrentTime = useCallback(() => {
    const segmentToSplit = segments.find(
      (seg) => currentTime > seg.startTime && currentTime < seg.endTime
    );
    if (!segmentToSplit) return;
    pushToUndo();
    setSegments((prev) => {
      const newSegments = prev.filter((seg) => seg.id !== segmentToSplit.id);
      newSegments.push({
        ...segmentToSplit,
        id: `segment-${Date.now()}-1`,
        endTime: currentTime,
      });
      newSegments.push({
        ...segmentToSplit,
        id: `segment-${Date.now()}-2`,
        startTime: currentTime,
      });
      return newSegments.sort((a, b) => a.startTime - b.startTime);
    });
  }, [segments, currentTime, pushToUndo]);

  // Export data
  const exportData = useCallback((): AnnotationData => {
    return {
      video_file: videoFile?.name || '',
      duration_sec: videoDuration,
      fps,
      segments: segments.map((seg) => ({
        label: seg.label,
        start_time: seg.startTime,
        end_time: seg.endTime,
        start_frame: Math.floor(seg.startTime * fps),
        end_frame: Math.floor(seg.endTime * fps),
      })),
      label_classes: labelClasses,
    };
  }, [videoFile, videoDuration, fps, segments, labelClasses]);

  // Import data
  const importData = useCallback(
    (data: AnnotationData) => {
      pushToUndo();
      setLabelClasses(data.label_classes);
      setSegments(
        data.segments.map((seg, index) => ({
          id: `segment-${Date.now()}-${index}`,
          label: seg.label,
          startTime: seg.start_time,
          endTime: seg.end_time,
          color: data.label_classes.find((lc) => lc.name === seg.label)?.color || '#000000',
        }))
      );
      setFps(data.fps);
    },
    [pushToUndo]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedSegmentId) {
          deleteSegment(selectedSegmentId);
        }
      } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitSegmentAtCurrentTime();
      } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        // Trigger new segment modal
        const event = new CustomEvent('openNewSegmentModal', { detail: { time: currentTime } });
        window.dispatchEvent(event);
      } else if (e.key === '?') {
        setShowKeyboardShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSegmentId, currentTime, handleUndo, handleRedo, deleteSegment, splitSegmentAtCurrentTime]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Temporal Action Segmentation
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowKeyboardShortcuts(true)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              title="Keyboard shortcuts"
            >
              ⌨️ Shortcuts
            </button>
            <ExportManager
              exportData={exportData}
              importData={importData}
              segments={segments}
              labelClasses={labelClasses}
            />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <LabelManager
              labelClasses={labelClasses}
              setLabelClasses={setLabelClasses}
              onUpdate={() => pushToUndo()}
            />
            <SegmentList
              segments={segments}
              selectedSegmentId={selectedSegmentId}
              onSelect={setSelectedSegmentId}
              onDelete={deleteSegment}
              onUpdate={updateSegment}
              currentTime={currentTime}
              onSeek={(time) => {
                setCurrentTime(time);
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                }
              }}
            />
            <Stats segments={segments} labelClasses={labelClasses} videoDuration={videoDuration} />
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <VideoPlayer
              videoUrl={videoUrl}
              onVideoUpload={handleVideoUpload}
              onVideoLoaded={handleVideoLoaded}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              fps={fps}
              videoError={videoError}
              isLoading={isLoading}
              videoRef={videoRef}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Timeline</h2>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTime(currentTime)} / {formatTime(videoDuration)}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={mergeAdjacentSegments}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    title="Merge adjacent segments with same label"
                  >
                    Merge Adjacent
                  </button>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={allowOverlap}
                      onChange={(e) => setAllowOverlap(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Allow overlap</span>
                  </label>
                </div>
              </div>
              <Timeline
                segments={segments}
                videoDuration={videoDuration}
                currentTime={currentTime}
                onTimeUpdate={(time) => {
                  setCurrentTime(time);
                  if (videoRef.current) {
                    videoRef.current.currentTime = time;
                  }
                }}
                zoom={timelineZoom}
                onZoomChange={setTimelineZoom}
                selectedSegmentId={selectedSegmentId}
                onSegmentSelect={setSelectedSegmentId}
                onSegmentUpdate={updateSegment}
                onSegmentDelete={deleteSegment}
                onAddSegment={addSegment}
                labelClasses={labelClasses}
                allowOverlap={allowOverlap}
                fps={fps}
                videoRef={videoRef} // Add this line
              />
            </div>
          </div>
        </div>
      </main>

      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
      )}
    </div>
  );
};

export default App;