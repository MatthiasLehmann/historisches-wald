import { promises as fs } from 'fs';
import path from 'path';

const ensureDirectory = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const writeFileAtomic = async (filePath, data) => {
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  await ensureDirectory(filePath);
  await fs.writeFile(tempPath, data, 'utf8');
  await fs.rename(tempPath, filePath);
};

export const readJsonFile = async (filePath, fallback = null) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    if (!content) {
      return fallback;
    }
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await ensureDirectory(filePath);
      if (fallback !== null) {
        await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
        return fallback;
      }
      return fallback;
    }
    throw error;
  }
};

export const readJsonArray = async (filePath) => {
  const data = await readJsonFile(filePath, []);
  return Array.isArray(data) ? data : [];
};

export const writeJsonArray = async (filePath, payload) => {
  const serialized = JSON.stringify(payload, null, 2);
  await writeFileAtomic(filePath, serialized);
};
