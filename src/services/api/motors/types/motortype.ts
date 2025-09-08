export interface MotorSetting {
  max_speed: number;
  acceleration: number;
  invert: boolean;
  extra: Record<string, any>;
}

export interface MotorSettingItem {
  index: number;
  items: MotorSetting;
}

export type MotorId = 1 | 2 | 3 | 4;

export type CommandAction = 'start' | 'pause' | 'resume' | 'stop' | 'zero' | 'reverse';

export type MotorState = 'idle' | 'running' | 'paused' | 'stopped' | 'error';

export interface MotorStatus {
  state: MotorState;
  step_index: number | null; // 1-based current step
  elapsed_s: number;         // elapsed in current step
  position_deg: number;      // absolute encoder angle
  speed: number;             // signed RPM
  message: string | null;
}


export interface Program {
  mode: ProgramMode;
  steps: ProgramStep[];
  summary: ProgramSummary;
}
export type ProgramMode = 'sequence';
export interface ProgramStep {
  index: number;        // 1..N
  duration_s: number;   // seconds
  rpm: number;          // +CW, -CCW, 0 dwell
}
export interface ProgramSummary {
  mode: ProgramMode;
  total_duration_s: number;
  steps_count: number;
}
