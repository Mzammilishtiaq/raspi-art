// src/api/motorStatus.ts
import api from '../../client';
import { tryOrMock, USE_MOCK } from '../../helper/helper';
import type { MotorId,MotorStatus } from '../../api/motors/types/motortype';


/* -------------------- Mock Store -------------------- */
const mockStatus: Record<MotorId, MotorStatus> = {
  1: { state: 'running', step_index: 1, elapsed_s: 0.4, position_deg: 12.0, speed: 5000,  message: null },
  2: { state: 'paused',  step_index: 2, elapsed_s: 1.1, position_deg: 90.0, speed: 0,     message: 'Waiting user input' },
  3: { state: 'idle',    step_index: 3, elapsed_s: 0, position_deg: 0.0,  speed: 0,     message: null },
  4: { state: 'stopped',   step_index: 4, elapsed_s: 0, position_deg: 45.0, speed: 0,     message: 'Driver overcurrent' },
};

// simple mock “telemetry” tick so running motors feel alive
if (USE_MOCK) {
  setInterval(() => {
    (Object.keys(mockStatus) as unknown as MotorId[]).forEach((id) => {
      const s = mockStatus[id];
      if (s.state === 'running') {
        s.elapsed_s = +(s.elapsed_s + 1).toFixed(1);
        const degPerSec = (s.speed / 60) * 360;
        s.position_deg = (s.position_deg + degPerSec) % 360;
        if (s.elapsed_s > 3) { // fake step change every ~3s
          s.step_index = (s.step_index ?? 0);
          s.elapsed_s = 0;
        }
      }
    });
  }, 1000);
}

/* -------------------- API -------------------- */

// GET /api/motors/{motor_id}/status -> { status: {...} }
export async function getStatus(motor_id: MotorId): Promise<MotorStatus> {
  return tryOrMock(
    async () => {
      const { data } = await api.get<{ status: MotorStatus }>(`/motors/${motor_id}/status`);
      return data.status;
    },
    mockStatus[motor_id]
  );
}

// PUT /api/motors/{motor_id}/status  (controller pushes live telemetry; GUI rarely calls this)
export async function putStatus(motor_id: MotorId, status: MotorStatus): Promise<void> {
  return tryOrMock(
    async () => {
      await api.put(`/motors/${motor_id}/status`, { status });
    },
    ((): void => {
      // update local mock so UI reflects it immediately
      mockStatus[motor_id] = { ...status };
    })()
  );
}
