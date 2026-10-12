import { Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ArchiveSearch({ onSubmit }) {
    const navigate = useNavigate();
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('q') || '';

    return (
        <form role="search" aria-label="Archiv durchsuchen" className="flex min-w-0 items-center rounded-sm border border-parchment-dark bg-parchment-light" onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get('q').trim();
            if (!value) return;
            navigate(`/archive?${new URLSearchParams({ q: value })}`);
            onSubmit?.();
        }}>
            <input key={`${location.pathname}${location.search}`} name="q" type="search" aria-label="Suchbegriff im Archiv" defaultValue={query} placeholder="Archiv durchsuchen…" className="w-full min-w-0 bg-transparent px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent" />
            <button type="submit" aria-label="Suche starten" className="shrink-0 p-2 text-accent hover:bg-parchment-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
                <Search size={20} aria-hidden="true" />
            </button>
        </form>
    );
}
