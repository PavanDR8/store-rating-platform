import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

// Clickable table header. Click toggles ASC / DESC (handled by useTableState.toggleSort).
export default function SortableTh({ label, sortKey, state, onSort, className = '' }) {
  const active = state.sortBy === sortKey;
  const Icon = !active ? ChevronsUpDown : state.order === 'asc' ? ChevronUp : ChevronDown;
  return (
    <th className={`th ${className}`} aria-sort={active ? (state.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button onClick={() => onSort(sortKey)} className="inline-flex items-center gap-1 font-semibold hover:text-slate-900">
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
      </button>
    </th>
  );
}
