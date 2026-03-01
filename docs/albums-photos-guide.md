# Flickr Album & Photo Management Guide

## Folder Structure Snapshot

```
backend/
├─ config/
│  └─ mediaConfig.js          # Centralized data path helpers
├─ controllers/
│  ├─ albumsController.js     # Album REST handlers
│  └─ photosController.js     # Photo REST handlers
├─ routes/
│  ├─ albums.js               # /api/albums endpoints
│  └─ photos.js               # /api/photos endpoints
├─ services/
│  ├─ albumsService.js        # File IO + normalization for albums.json
│  └─ photosService.js        # File IO + normalization for photo_*.json
├─ utils/
│  └─ jsonStorage.js          # Atomic JSON helpers (shared)
└─ data/
   ├─ albums.json             # Flickr album export
   └─ images/photo_<id>.json  # Individual photo exports (default dir configurable)

frontend/src/
├─ components/
│  ├─ AlbumEditor.jsx         # Metadata form for albums
│  ├─ PhotoCard.jsx           # Grid card for album photos
│  ├─ PhotoEditor.jsx         # Detailed photo editor (name, tags, review)
│  └─ StatusBadge.jsx         # Shared status pill for review state
├─ pages/
│  ├─ AlbumsPage.jsx          # /albums listing with search/sort
│  ├─ AlbumDetailPage.jsx     # /albums/:albumId with pagination + editor
│  └─ PhotoDetailPage.jsx     # /photos/:photoId with preview + editor
└─ services/api.js            # REST calls for new backend endpoints
```

## API Reference & Sample Responses

_All endpoints live under `/api`. Files are persisted atomically into `backend/data` (configurable through `MEDIA_DATA_ROOT` / `MEDIA_PHOTOS_DIR` environment variables)._

### GET /api/albums
Returns normalized album metadata.
```json
[
  {
    "id": "72177720314562250",
    "title": "01_Postkarten Wald",
    "description": "",
    "url": "https://www.flickr.com/photos/.../albums/72177720314562250",
    "cover_photo": "https://www.flickr.com/photos//0",
    "photo_count": 200,
    "created": 1707072841,
    "last_updated": 1772115681,
    "photos": ["53508710586", "54275930303", "54274801137", "..."]
  }
]
```

### GET /api/albums/:id
```json
{
  "id": "72177720314562250",
  "title": "01_Postkarten Wald",
  "description": "",
  "url": "https://www.flickr.com/photos/.../albums/72177720314562250",
  "cover_photo": "https://www.flickr.com/photos//0",
  "photo_count": 200,
  "created": 1707072841,
  "last_updated": 1772115681,
  "photos": ["53508710586", "54275930303", "..."]
}
```

### PUT /api/albums/:id
Body (editable fields only):
```json
{
  "title": "01_Postkarten Wald",
  "description": "Kurze Beschreibung",
  "cover_photo": "https://example.com/new-cover.jpg"
}
```
Response mirrors `GET /api/albums/:id` with updated fields.

### GET /api/albums/:id/photos
Resolves every `photo_<id>.json`. Missing files yield placeholder objects.
```json
[
  {
    "id": "53537183176",
    "name": "Feuerwehr 1989",
    "description": "",
    "date_taken": "1989-01-01 00:00:00",
    "original": "https://live.staticflickr.com/..._o.jpg",
    "license": "All Rights Reserved",
    "privacy": "friend & family",
    "tags": ["Feuerwehr"],
    "albums": [],
    "comments": [
      { "id": "72157720336320578", "date": "2024-02-18 10:36:21", "user": "199943033@N03", "comment": "1989" }
    ],
    "review": {
      "status": "pending",
      "reviewer": "",
      "reviewedAt": null,
      "comments": []
    },
    "missing": false
  }
]
```

### GET /api/photos/:id
Single normalized photo object (same shape as above). If `photo_<id>.json` is missing, payload contains `missing: true` and `error` describing the issue.

### PUT /api/photos/:id
Body supports `name`, `description`, `date_taken`, `tags` (array of strings), and `review` (`status`, `reviewer`, `reviewedAt`, `comments`). Example:
```json
{
  "name": "Feuerwehr 1989",
  "description": "Digitale Nachbearbeitung",
  "tags": ["wald", "feuerwehr"],
  "review": {
    "status": "approved",
    "reviewer": "Stefanie Grüner",
    "reviewedAt": "2026-02-27T10:00:00.000Z",
    "comments": ["Freigabe nach QS"]
  }
}
```
Response returns the updated normalized photo document.

### GET /api/photos/:id/albums
Lists every album referencing the given photo ID. Useful for the photo detail view.
```json
[
  {
    "id": "72177720314562250",
    "title": "01_Postkarten Wald",
    "photo_count": 200,
    "last_updated": 1772115681
  }
]
```

## Frontend Routes
- `/albums` – protected overview with search + title/last-updated sorting.
- `/albums/:albumId` – album metadata editor plus photo grid with search + pagination (24 per page) for large libraries.
- `/photos/:photoId` – full-screen preview, editable metadata/tags/review fields, derived album references, and Flickr comments.

## Notes
- Configure alternative data roots via `MEDIA_DATA_ROOT`, `MEDIA_ALBUMS_FILE`, and `MEDIA_PHOTOS_DIR` env vars before starting the backend (`npm run dev`).
- `frontend/src/services/api.js` now exposes `fetchAlbums`, `fetchAlbumById`, `fetchAlbumPhotos`, `fetchPhotoById`, `fetchPhotoAlbums`, `updateAlbum`, and `updatePhoto` for React hooks.
- The frontend lint run (`npm run lint`) currently reports one pre-existing warning in `Archive.jsx` (missing dependency). No new warnings/errors were introduced by these changes.
