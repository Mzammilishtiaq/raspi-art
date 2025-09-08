/* -------------------- Helpers -------------------- */
export const USE_MOCK = true; // flip to false for live backend
export async function tryOrMock<T>(fn: () => Promise<T>, mock: T): Promise<T> {
  if (USE_MOCK) return structuredClone(mock);
  try {
    return await fn();
  } catch {
    return structuredClone(mock);
  }
}
