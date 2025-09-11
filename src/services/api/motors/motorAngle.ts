import { tryOrMock} from '../../helper/helper';
import api from '../../client'
export type MotorId = string;

export interface AngleData {
  position_deg: number;
}

export interface AngleUpdate {
  target_deg: number;
  rpm: number;
}

export interface AnglePutResponse {
  ok: boolean;
  request: AngleUpdate & { ts: number };
}

export interface ZeroResponse {
  ok: boolean;
}

// Mock storage
const mockAngleData: Record<MotorId, AngleData> = {};
const mockZeroData: Record<MotorId, ZeroResponse> = {};

/* -------------------- API Functions -------------------- */

// GET current absolute angle
export async function getAngle(motor_id: MotorId): Promise<AngleData> {
  return tryOrMock(
    async () => {
      const res = await api.get(`/motors/${motor_id}/angle`);
      return res.data;
    },
    mockAngleData[motor_id] ?? { position_deg: 0 }
  );
}

// PUT absolute target angle
export async function putAngle(motor_id: MotorId, data: AngleUpdate): Promise<AnglePutResponse> {
  return tryOrMock(
    async () => {
      const res = await api.put(`/motors/${motor_id}/angle`, data);
      return res.data;
    },
    {
      ok: true,
      request: { ...data, ts: Math.floor(Date.now() / 1000) },
    }
  );
}

// POST zero angle
export async function postZero(motor_id: MotorId): Promise<ZeroResponse> {
  return tryOrMock(
    async () => {
      const res = await api.post(`/motors/${motor_id}/angle/zero`);
      return res.data;
    },
    mockZeroData[motor_id] ?? { ok: true }
  );
}
