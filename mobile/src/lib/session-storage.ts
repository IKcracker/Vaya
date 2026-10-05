export type SessionStorage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const KEY = 'vaya.passenger.session';
const INDEX = `${KEY}.parts`;
type Parts = { prefix: string; count: number };

async function readParts(storage: SessionStorage): Promise<Parts | null> {
  const value = await storage.getItemAsync(INDEX);
  if (!value) return null;
  try {
    const parts = JSON.parse(value) as Parts;
    if (/^vaya\.passenger\.session\.[a-z0-9]+$/.test(parts.prefix) && Number.isInteger(parts.count) && parts.count > 0 && parts.count <= 64) return parts;
  } catch {
    // Ignore incomplete storage metadata and fall back to the legacy key.
  }
  return null;
}

async function removeParts(storage: SessionStorage, parts: Parts | null) {
  if (parts) await Promise.all(Array.from({ length: parts.count }, (_, i) => storage.deleteItemAsync(`${parts.prefix}.${i}`)));
}

export async function readSession(storage: SessionStorage) {
  const parts = await readParts(storage);
  if (!parts) return storage.getItemAsync(KEY);
  const values = await Promise.all(Array.from({ length: parts.count }, (_, i) => storage.getItemAsync(`${parts.prefix}.${i}`)));
  return values.every((value) => value !== null) ? values.join('') : null;
}

export async function writeSession(storage: SessionStorage, value: string | null) {
  const old = await readParts(storage);
  if (!value) {
    await storage.deleteItemAsync(KEY);
    await storage.deleteItemAsync(INDEX);
    await removeParts(storage, old);
    return;
  }
  // Auth cookies are ASCII. Keep each encrypted entry below iOS keychain limits.
  const parts = { prefix: `${KEY}.${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`, count: Math.ceil(value.length / 1800) };
  if (parts.count > 64) throw new Error('The authentication session is too large to save securely.');
  try {
    for (let i = 0; i < parts.count; i++) await storage.setItemAsync(`${parts.prefix}.${i}`, value.slice(i * 1800, (i + 1) * 1800));
    await storage.setItemAsync(INDEX, JSON.stringify(parts));
  } catch (error) {
    await removeParts(storage, parts).catch(() => {});
    throw error;
  }
  // The new index is committed; cleanup must not undo a successful sign-in.
  await storage.deleteItemAsync(KEY).catch(() => {});
  await removeParts(storage, old).catch(() => {});
}
