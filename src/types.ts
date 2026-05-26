export interface LabelClass {
  name: string;
  color: string;
}

export interface Segment {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  color: string;
}

export interface AnnotationData {
  video_file: string;
  duration_sec: number;
  fps: number;
  segments: {
    label: string;
    start_time: number;
    end_time: number;
    start_frame: number;
    end_frame: number;
  }[];
  label_classes: LabelClass[];
}

export interface UndoRedoState {
  segments: Segment[];
  labelClasses: LabelClass[];
}