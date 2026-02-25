import fs from 'fs';
import path from 'path';

let loaded = false;

const parseLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const [key, ...rest] = trimmed.split('=');
  if (!key) {
    return null;
  }

  const value = rest.join('=').trim();
  return { key: key.trim(), value };
};

const loadEnv = () => {
  if (loaded) {
    return;
  }

  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    loaded = true;
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const entry = parseLine(line);
    if (!entry) {
      return;
    }

    if (typeof process.env[entry.key] === 'undefined') {
      process.env[entry.key] = entry.value;
    }
  });

  loaded = true;
};

export default loadEnv;
