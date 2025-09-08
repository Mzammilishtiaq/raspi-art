import api from '../../client';
import { MotorId,Program,ProgramSummary }  from '../motors/types/motortype';
import { tryOrMock} from '../../helper/helper';
export type CommandAction = 'start' | 'pause' | 'resume' | 'stop' | 'zero' | 'reverse';

/* -------------------- Mock Data -------------------- */
const mockPrograms: Record<MotorId, Program> = {
  1: { mode: 'sequence', steps: [{ index: 1, duration_s: 2.0, rpm: 5000 }, { index: 2, duration_s: 3.5, rpm: -7000 }], summary: { mode: 'sequence', total_duration_s: 5.5, steps_count: 2 } },
  2: { mode: 'sequence', steps: [{ index: 1, duration_s: 1.0, rpm: 0 }, { index: 2, duration_s: 1.5, rpm: 2500 }], summary: { mode: 'sequence', total_duration_s: 2.5, steps_count: 2 } },
  3: { mode: 'sequence', steps: [{ index: 1, duration_s: 2.0, rpm: 1000 }], summary: { mode: 'sequence', total_duration_s: 2.0, steps_count: 1 } },
  4: { mode: 'sequence', steps: [], summary: { mode: 'sequence', total_duration_s: 0, steps_count: 0 } },
};


// POST /sequence/quick
export async function postQuickSequence(
  motor_id: MotorId,
  payload: { duration_s: number; rpm: number }
): Promise<ProgramSummary> {
  return tryOrMock(
    async () => {
      const { data } = await api.post<{ ok: true; summary: ProgramSummary }>(
        `/motors/${motor_id}/sequence/quick`,
        payload
      );
      return data.summary;
    },
    {
      mode: 'sequence',
      total_duration_s: payload.duration_s,
      steps_count: 1,
    }
  );
}

// PUT /program
export async function putProgram(motor_id: MotorId, program: Program): Promise<ProgramSummary> {
  return tryOrMock(
    async () => {
      const { data } = await api.put<{ ok: true; summary: ProgramSummary }>(`/motors/${motor_id}/program`, program);
      return data.summary;
    },
    {
      mode: 'sequence',
      total_duration_s: program.steps.reduce((a, b) => a + b.duration_s, 0),
      steps_count: program.steps.length,
    }
  );
}

// GET /program
export async function getProgram(motor_id: MotorId): Promise<{ program: Program; summary: ProgramSummary }> {
  return tryOrMock(
    async () => {
      const { data } = await api.get<{ program: Program; summary: ProgramSummary }>(`/motors/${motor_id}/program`);
      return data;
    },
    {
      program: mockPrograms[motor_id],
      summary: {
        mode: 'sequence',
        total_duration_s: mockPrograms[motor_id].steps.reduce((a, b) => a + b.duration_s, 0),
        steps_count: mockPrograms[motor_id].steps.length,
      },
    }
  );
}

// GET /program/total-duration
export async function getProgramTotalDuration(motor_id: MotorId): Promise<number> {
  return tryOrMock(
    async () => {
      const { data } = await api.get<{ total_duration_s: number }>(`/motors/${motor_id}/program/total-duration`);
      return data.total_duration_s;
    },
    mockPrograms[motor_id].steps.reduce((a, b) => a + b.duration_s, 0)
  );
}