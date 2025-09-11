import api from '../../client';
import { tryOrMock} from '../../helper/helper';
import type { MotorId } from '../../api/motors/types/motortype';

export type CommandAction = 'start' | 'pause' | 'resume' | 'stop' | 'zero' | 'reverse';

export interface LastCommand {
  action: CommandAction;
  ts: number; // epoch seconds
}

/* -------------------- Mock State -------------------- */
const mockLastCommand: Record<MotorId, LastCommand> = {
  1: { action: 'stop',   ts: Math.floor(Date.now() / 1000) - 30 },
  2: { action: 'stop',   ts: Math.floor(Date.now() / 1000) - 30 },
  3: { action: 'stop',   ts: Math.floor(Date.now() / 1000) - 30 },
  4: { action: 'start',   ts: Math.floor(Date.now() / 1000) - 30 },
};

/* -------------------- API -------------------- */

// POST /api/motors/{motor_id}/command  { action: 'pause' }
export async function postCommand(motor_id: MotorId, action: CommandAction): Promise<void> {
  return tryOrMock(
    async () => {
      await api.post(`/motors/${motor_id}/command`, { action });
    },
    ((): void => {
      // mock: update last-command cache
      mockLastCommand[motor_id] = { action, ts: Math.floor(Date.now() / 1000) };
    })()
  );
}

// GET /api/motors/{motor_id}/command/last -> { last_command: { action, ts } }
export async function getLastCommand(motor_id: MotorId): Promise<LastCommand> {
  return tryOrMock(
    async () => {
      const { data } = await api.get<{ last_command: LastCommand }>(`/motors/${motor_id}/command/last`);
      return data.last_command;
    },
    mockLastCommand[motor_id]
  );
}
