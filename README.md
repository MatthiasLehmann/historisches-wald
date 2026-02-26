# Historisches Wald

Historisches Wald is a full-stack document archive for historical records from Wald. The frontend runs on React + Vite, the backend on Node/Express, and documents are stored as JSON.

## Frontend

- React + Vite application in `frontend/`
- Tailwind-based styling with utility classes
- Protected admin routes for document submission and review

### React Compiler

The React Compiler is disabled for faster builds. To enable it, follow the [official guide](https://react.dev/learn/react-compiler/installation).

## Backend

- Express server in `backend/`
- Persists documents in `backend/data/documents.json`
- Provides CRUD endpoints plus review workflow APIs

## PDF Export Script

Use `export_documents_pdf.py` in the repo root to generate a DIN A4 portrait PDF report from any `documents.json`.

### Dependencies

Install required Python packages (preferably in a virtual environment):

```bash
pip install reportlab pillow requests
```

### Usage

```bash
python export_documents_pdf.py --input ./backend/data/documents.json --output ./output/documents.pdf
```

- Downloads remote images with caching in `output/cache/`
- Embeds metadata, description, transcription, review info, and images per document
- Adds a table of contents, automatic page numbers, and page breaks

Output files/directories are created automatically if missing.
