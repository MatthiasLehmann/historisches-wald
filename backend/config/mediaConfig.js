import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolvePath = (target) => (path.isAbsolute(target) ? target : path.resolve(process.cwd(), target));

const DATA_ROOT = process.env.MEDIA_DATA_ROOT
  ? resolvePath(process.env.MEDIA_DATA_ROOT)
  : path.join(__dirname, '..', 'data');

const PHOTOS_SUBDIR = process.env.MEDIA_PHOTOS_DIR || 'images';

const ALBUMS_FILE = process.env.MEDIA_ALBUMS_FILE
  ? resolvePath(process.env.MEDIA_ALBUMS_FILE)
  : path.join(DATA_ROOT, 'albums.json');

export const getDataRoot = () => DATA_ROOT;
export const getAlbumsFilePath = () => ALBUMS_FILE;
export const getPhotosDir = () => path.join(DATA_ROOT, PHOTOS_SUBDIR);
export const getPhotoFilePath = (photoId) => path.join(getPhotosDir(), `photo_${photoId}.json`);
