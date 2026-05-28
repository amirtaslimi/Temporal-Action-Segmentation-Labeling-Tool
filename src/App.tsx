import React, { useState, useCallback, useRef, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import Timeline from './components/Timeline';
import LabelManager from './components/LabelManager';
import SegmentList from './components/SegmentList';
import ExportManager from './components/ExportManager';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import Stats from './components/Stats';
import SegmentCreationPanel from './components/SegmentCreationPanel';
import NewSessionDialog from './components/NewSessionDialog';
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
    { name: 'Incision', color: '#4ECDC4' },
    { name: 'Viscoelastic', color: '#f6ff46' },
    { name: 'Capsulorhexis', color: '#96CEB4' },
    { name: 'Hydrodissection', color: '#FFEAA7' },
        { name: 'Phacoemulsification', color: '#6bffb3' },
    { name: 'IrrigationAspiration', color: '#5bd613' },
    { name: 'CapsulePolishing', color: '#45B7D1' },
    { name: 'LensImplantation', color: '#9730a2' },
            { name: 'LensPositioning', color: '#366b50' },
    { name: 'ViscoelasticSuction', color: '#ff3dcb' },
    { name: 'AnteriorChamberFlushing', color: '#ff0000' },
    { name: 'TonifyingAntibiotics', color: '#848484' },
    { name: 'Idle', color: '#FF6B6B' },
  ]);

  // Segments
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [allowOverlap, setAllowOverlap] = useState(false);

  // Segment creation state
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [segmentStartTime, setSegmentStartTime] = useState(0);
  const [selectedLabelForSegment, setSelectedLabelForSegment] = useState('');

  // Timeline
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  
  // UI State
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [videoFitMode, setVideoFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');

  // Undo/Redo
  const [undoStack, setUndoStack] = useState<UndoRedoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoRedoState[]>([]);

  // Auto-save
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

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
      if (prev.length === 0) return prev;
      const merged: Segment[] = [];
      let current = prev[0];
      for (let i = 1; i < prev.length; i++) {
        if (current.label === prev[i].label && Math.abs(current.endTime - prev[i].startTime) < 0.001) {
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

  // Start creating a new segment (mark in point)
  const handleStartSegment = useCallback(() => {
    const currentVideoTime = videoRef.current?.currentTime || currentTime;
    setSegmentStartTime(currentVideoTime);
    setSelectedLabelForSegment(labelClasses[0]?.name || '');
    setIsCreatingSegment(true);
  }, [currentTime, labelClasses, videoRef]);

  // End the current segment (mark out point)
  const handleEndSegment = useCallback(() => {
    if (isCreatingSegment && selectedLabelForSegment) {
      const currentVideoTime = videoRef.current?.currentTime || currentTime;
      if (currentVideoTime > segmentStartTime) {
        addSegment(selectedLabelForSegment, segmentStartTime, currentVideoTime);
      }
    }
    setIsCreatingSegment(false);
  }, [isCreatingSegment, selectedLabelForSegment, segmentStartTime, currentTime, addSegment]);

  // Cancel segment creation
  const handleCancelSegment = useCallback(() => {
    setIsCreatingSegment(false);
  }, []);

  // New Session
  const handleNewSession = useCallback(() => {
    // Save current session before clearing
    if (segments.length > 0 || labelClasses.length > 0) {
      saveToIndexedDB({
        labelClasses,
        segments,
        allowOverlap,
        fps,
      }).then(() => {
        console.log('Session saved before new session');
      });
    }
    
    // Clear video
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl('');
    setVideoFile(null);
    setVideoDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setVideoError('');
    
    // Reset segments and labels
    setSegments([]);
    setSelectedSegmentId(null);
    setLabelClasses([
    { name: 'Incision', color: '#4ECDC4' },
    { name: 'Viscoelastic', color: '#f6ff46' },
    { name: 'Capsulorhexis', color: '#96CEB4' },
    { name: 'Hydrodissection', color: '#FFEAA7' },
        { name: 'Phacoemulsification', color: '#6bffb3' },
    { name: 'IrrigationAspiration', color: '#5bd613' },
    { name: 'CapsulePolishing', color: '#45B7D1' },
    { name: 'LensImplantation', color: '#9730a2' },
            { name: 'LensPositioning', color: '#366b50' },
    { name: 'ViscoelasticSuction', color: '#ff3dcb' },
    { name: 'AnteriorChamberFlushing', color: '#ff0000' },
    { name: 'TonifyingAntibiotics', color: '#848484' },
    { name: 'Idle', color: '#FF6B6B' },
    ]);
    
    // Reset segment creation
    setIsCreatingSegment(false);
    setSegmentStartTime(0);
    setSelectedLabelForSegment('');
    
    // Reset undo/redo
    setUndoStack([]);
    setRedoStack([]);
    
    // Reset timeline zoom
    setTimelineZoom(1);
    
    setShowNewSessionDialog(false);
  }, [videoUrl, segments, labelClasses, allowOverlap, fps]);

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
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowNewSessionDialog(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedSegmentId) {
          deleteSegment(selectedSegmentId);
        }
      } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        splitSegmentAtCurrentTime();
      } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!isCreatingSegment) {
          handleStartSegment();
        } else {
          handleEndSegment();
        }
      } else if (e.key === 'Escape') {
        if (isCreatingSegment) {
          handleCancelSegment();
        }
      } else if (e.key === '?') {
        setShowKeyboardShortcuts((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedSegmentId,
    currentTime,
    handleUndo,
    handleRedo,
    deleteSegment,
    splitSegmentAtCurrentTime,
    isCreatingSegment,
    handleStartSegment,
    handleEndSegment,
    handleCancelSegment
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Temporal Action Segmentation
            </h1>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Toggle left panel"
              >
                {leftPanelCollapsed ? '◀' : '◁'}
              </button>
              <button
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Toggle right panel"
              >
                {rightPanelCollapsed ? '▶' : '▷'}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewSessionDialog(true)}
              className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors flex items-center space-x-1"
              title="Start new session with different video"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Session</span>
            </button>
            
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

      <main className="h-[calc(100vh-3.5rem)] flex gap-2 p-2">
        {!leftPanelCollapsed && (
          <div className="w-72 flex-shrink-0 space-y-2 overflow-y-auto">
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
        )}

        <div className="flex-1 flex flex-col min-w-0 space-y-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden flex-shrink-0">
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
              videoFitMode={videoFitMode}
              onVideoFitModeChange={setVideoFitMode}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Timeline</h2>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={mergeAdjacentSegments}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  title="Merge adjacent segments with same label"
                >
                  Merge
                </button>
                <label className="flex items-center space-x-1 text-xs">
                  <input
                    type="checkbox"
                    checked={allowOverlap}
                    onChange={(e) => setAllowOverlap(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Overlap</span>
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
              videoRef={videoRef}
              isCreatingSegment={isCreatingSegment}
              segmentStartTime={segmentStartTime}
            />
          </div>
        </div>

        {!rightPanelCollapsed && (
          <div className="w-72 flex-shrink-0 overflow-y-auto">
            <SegmentCreationPanel
              isCreating={isCreatingSegment}
              segmentStartTime={segmentStartTime}
              currentTime={currentTime}
              selectedLabel={selectedLabelForSegment}
              labelClasses={labelClasses}
              onLabelChange={setSelectedLabelForSegment}
              onEndSegment={handleEndSegment}
              onCancelSegment={handleCancelSegment}
              onStartSegment={handleStartSegment}
              fps={fps}
            />
          </div>
        )}
      </main>

      {showKeyboardShortcuts && (
        <KeyboardShortcuts onClose={() => setShowKeyboardShortcuts(false)} />
      )}

      {showNewSessionDialog && (
        <NewSessionDialog
          onConfirm={handleNewSession}
          onCancel={() => setShowNewSessionDialog(false)}
          segments={segments}
          labelClasses={labelClasses}
          videoFileName={videoFile?.name || ''}
        />
      )}
    </div>
  );
};

export default App;