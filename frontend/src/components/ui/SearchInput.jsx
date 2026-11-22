import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

// Waits 400ms after typing stops, then tells the page (so we don't call the API on every key press).
export default function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    if (local === value) return undefined;
    const t = setTimeout(() => onChange(local), 400);
    return () => clearTimeout(t);
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        className="input pl-9"
        placeholder={placeholder}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
}
