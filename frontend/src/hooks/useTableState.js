import { useCallback, useState } from 'react';

// Keeps search / sort / page state for a list page. Clicking the same header again flips ASC <-> DESC.
export default function useTableState(defaults = { sortBy: 'name', order: 'asc' }) {
  const [state, setState] = useState({ search: '', page: 1, limit: 10, ...defaults });

  const setSearch = useCallback((search) => setState((s) => ({ ...s, search, page: 1 })), []);
  const setPage = useCallback((page) => setState((s) => ({ ...s, page })), []);
  const setFilter = useCallback((key, value) => setState((s) => ({ ...s, [key]: value, page: 1 })), []);
  const setSort = useCallback((sortBy, order) => setState((s) => ({ ...s, sortBy, order, page: 1 })), []);
  const toggleSort = useCallback(
    (key) =>
      setState((s) => ({
        ...s,
        sortBy: key,
        order: s.sortBy === key && s.order === 'asc' ? 'desc' : 'asc',
        page: 1,
      })),
    []
  );

  return { state, setSearch, setPage, setFilter, setSort, toggleSort };
}
