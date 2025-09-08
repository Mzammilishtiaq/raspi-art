import { MotorId, MotorSettingItem, MotorSetting } from './types/motortype';
import api from '../../client';
const USE_MOCK = true;
// mock store (only used when USE_MOCK = true)

const mockSettings: Record<MotorId, MotorSettingItem[]> = {
    1: [
        { index: 1, items: { max_speed: 10000, acceleration: 100, invert: false, extra: {} } },
        { index: 2, items: { max_speed: 9000, acceleration: 100, invert: false, extra: {} } },
    ],
    2: [{ index: 1, items: { max_speed: 8000, acceleration: 80, invert: false, extra: { profile: 'soft' } } }],
    3: [],
    4: [],
};

// GET /api/motors/{motor_id}/settings
export async function listMotorSettings(motor_id: number): Promise<MotorSettingItem[]> {
    if (USE_MOCK) return structuredClone(mockSettings[motor_id as MotorId] ?? []);
    const res = await api.get(`/motors/${motor_id}/settings`);
    return res.data.items;  // assuming controller returns { motor_id, items: [...] }
}

// PUT /api/motors/{motor_id}/settings (bulk upsert)
export async function putMotorSettings(motor_id: MotorId, items: MotorSettingItem[]): Promise<void> {
    if (USE_MOCK) {
        const arr = mockSettings[motor_id] ?? [];
        items.forEach(item => {
            const i = arr.findIndex(s => s.index === item.index);
            if (i >= 0) arr[i] = { index: item.index, items: structuredClone(item.items) };
            else arr.push({ index: item.index, items: structuredClone(item.items) });
        });
        mockSettings[motor_id] = arr.sort((a, b) => a.index - b.index);
        return;
    }
    await api.put(`/motors/${motor_id}/settings`, { motor_id, items });
}

// GET /api/motors/{motor_id}/settings/{index}
export async function getMotorSetting(motor_id: MotorId, index: number): Promise<MotorSettingItem> {
    if (USE_MOCK) {
        const item = (mockSettings[motor_id] ?? []).find(s => s.index === index);
        if (!item) throw new Error('Not found');
        return structuredClone(item);
    }
    const res = await api.get(`/motors/${motor_id}/settings/${index}`);
    return res.data;
}

// PUT /api/motors/{motor_id}/settings/{index}
export async function putMotorSetting(motor_id: MotorId, index: number, settings: MotorSetting): Promise<void> {
    if (USE_MOCK) {
        const arr = mockSettings[motor_id] ?? [];
        const i = arr.findIndex(s => s.index === index);
        if (i >= 0) arr[i] = { index, items: structuredClone(settings) };
        else arr.push({ index, items: structuredClone(settings) });
        mockSettings[motor_id] = arr.sort((a, b) => a.index - b.index);
        return;
    }
    await api.put(`/motors/${motor_id}/settings/${index}`, { index, settings });
}

// DELETE /api/motors/{motor_id}/settings/{index}
export async function deleteMotorSetting(motor_id: MotorId, index: number): Promise<void> {
    if (USE_MOCK) {
        mockSettings[motor_id] = (mockSettings[motor_id] ?? []).filter(s => s.index !== index);
        return;
    }
    await api.delete(`/motors/${motor_id}/settings/${index}`);
}