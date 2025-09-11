import api from '../../client';
import { tryOrMock} from '../../helper/helper';
import type { MotorId, MotorSettingItem, MotorSetting } from './types/motortype';

/* -------------------- Mock Store -------------------- */
const mockSettings: Record<MotorId, MotorSettingItem[]> = {
  1: [
    { index: 1, items: { max_speed: 10000, acceleration: 100, invert: true, extra: {} } },
    { index: 2, items: { max_speed: 9000, acceleration: 100, invert: false, extra: {} } },
  ],
  2: [{ index: 1, items: { max_speed: 8000, acceleration: 80, invert: false, extra: { profile: 'soft' } } }],
  3: [{ index: 1, items: { max_speed: 8000, acceleration: 80, invert: true, extra: { profile: 'soft' } } }],
  4: [{ index: 1, items: { max_speed: 8000, acceleration: 80, invert: false, extra: { profile: 'soft' } } }],
};

/* -------------------- API Functions -------------------- */

// GET /api/motors/{motor_id}/settings
export async function listMotorSettings(motor_id: MotorId): Promise<MotorSettingItem[]> {
  return tryOrMock(
    async () => {
      const res = await api.get(`/motors/${motor_id}/settings`);
      return res.data.items;
    },
    structuredClone(mockSettings[motor_id] ?? [])
  );
}

// PUT /api/motors/{motor_id}/settings (bulk upsert)
export async function putMotorSettings(motor_id: MotorId, items: MotorSettingItem[]): Promise<void> {
  return tryOrMock(
    async () => {
      await api.put(`/motors/${motor_id}/settings`, { motor_id, items });
    },
    ((): void => {
      const arr = mockSettings[motor_id] ?? [];
      items.forEach(item => {
        const i = arr.findIndex(s => s.index === item.index);
        if (i >= 0) arr[i] = { index: item.index, items: structuredClone(item.items) };
        else arr.push({ index: item.index, items: structuredClone(item.items) });
      });
      mockSettings[motor_id] = arr.sort((a, b) => a.index - b.index);
    })()
  );
}

// GET /api/motors/{motor_id}/settings/{index}
export async function getMotorSetting(motor_id: MotorId, index: number): Promise<MotorSettingItem> {
  return tryOrMock(
    async () => {
      const res = await api.get(`/motors/${motor_id}/settings/${index}`);
      return res.data;
    },
    (() => {
      const item = (mockSettings[motor_id] ?? []).find(s => s.index === index);
      if (!item) throw new Error('Not found');
      return structuredClone(item);
    })()
  );
}

// PUT /api/motors/{motor_id}/settings/{index}
export async function putMotorSetting(motor_id: MotorId, index: number, settings: MotorSetting): Promise<void> {
  return tryOrMock(
    async () => {
      await api.put(`/motors/${motor_id}/settings/${index}`, { index, settings });
    },
    ((): void => {
      const arr = mockSettings[motor_id] ?? [];
      const i = arr.findIndex(s => s.index === index);
      if (i >= 0) arr[i] = { index, items: structuredClone(settings) };
      else arr.push({ index, items: structuredClone(settings) });
      mockSettings[motor_id] = arr.sort((a, b) => a.index - b.index);
    })()
  );
}

// DELETE /api/motors/{motor_id}/settings/{index}
export async function deleteMotorSetting(motor_id: MotorId, index: number): Promise<void> {
  return tryOrMock(
    async () => {
      await api.delete(`/motors/${motor_id}/settings/${index}`);
    },
    ((): void => {
      mockSettings[motor_id] = (mockSettings[motor_id] ?? []).filter(s => s.index !== index);
    })()
  );
}
