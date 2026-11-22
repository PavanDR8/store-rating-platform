import { useCallback, useEffect, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, Loader2, MapPin, Pencil, Star } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useTableState from '../../hooks/useTableState';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import StarRating from '../../components/ui/StarRating';
import { EmptyState, ErrorBox, Spinner } from '../../components/ui/States';
import { formatRating } from '../../utils/validators';

const SORTS = [
  { value: 'name', label: 'Store name' },
  { value: 'address', label: 'Address' },
  { value: 'avg_rating', label: 'Overall rating' },
  { value: 'my_rating', label: 'My rating' },
];

function RatingModal({ store, onClose, onSaved }) {
  const toast = useToast();
  const [value, setValue] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setValue(store?.my_rating || 0); setError(''); }, [store]);

  const save = async () => {
    if (value < 1) return setError('Select a rating from 1 to 5 stars');
    setSaving(true);
    try {
      const { data } = await api.post('/user/ratings', { storeId: store.id, rating: value });
      toast.success(data.message);
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={Boolean(store)} onClose={onClose} title={store?.my_rating ? 'Edit your rating' : 'Rate this store'}>
      {store && (
        <div>
          <p className="font-semibold text-slate-900">{store.name}</p>
          <p className="text-sm text-slate-500">{store.address}</p>
          <div className="my-5"><StarRating value={value} onChange={(n) => { setValue(n); setError(''); }} size="h-9 w-9" /></div>
          {error && <p className="mb-3 text-sm font-medium text-red-600" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} {store.my_rating ? 'Update rating' : 'Submit rating'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function UserStores() {
  const { state, setSearch, setPage, setSort } = useTableState({ sortBy: 'name', order: 'asc', limit: 9 });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/user/stores', { params: state });
      setRows(data.data); setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [state]);
  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Stores</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Find a store and rate it from 1 to 5 stars. You can change your rating any time.</p>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={state.search} onChange={setSearch} placeholder="Search by store name or address" />
        <div className="flex gap-2">
          <select className="input sm:w-44" value={state.sortBy} onChange={(e) => setSort(e.target.value, state.order)} aria-label="Sort stores by">
            {SORTS.map((s) => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
          </select>
          <button className="btn-secondary" onClick={() => setSort(state.sortBy, state.order === 'asc' ? 'desc' : 'asc')} aria-label={`Order: ${state.order === 'asc' ? 'ascending' : 'descending'}. Click to reverse`}>
            {state.order === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
            {state.order === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
        <div className="card"><EmptyState title="No stores found" message={state.search ? 'No store matches your search.' : 'No stores have been added yet.'} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((s) => (
            <article key={s.id} className="card flex flex-col p-5">
              <h2 className="text-lg font-bold text-slate-900">{s.name}</h2>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-slate-500"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {s.address}</p>

              <div className="mt-4 flex items-center gap-2">
                <StarRating value={s.avg_rating} />
                <span className="font-bold text-slate-900">{formatRating(s.avg_rating)}</span>
                <span className="text-xs text-slate-500">{s.rating_count ? `${s.rating_count} rating${s.rating_count === 1 ? '' : 's'}` : 'No ratings yet'}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-500">My rating</span>
                {s.my_rating ? <><StarRating value={s.my_rating} size="h-4 w-4" /><span className="font-semibold">{s.my_rating}</span></> : <span className="text-slate-500">Not rated yet</span>}
              </div>

              <button className={`mt-4 ${s.my_rating ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setRating(s)}>
                {s.my_rating ? <><Pencil className="h-4 w-4" /> Edit rating</> : <><Star className="h-4 w-4" /> Submit rating</>}
              </button>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && <div className="card mt-4"><Pagination pagination={pagination} onPage={setPage} /></div>}
      <RatingModal store={rating} onClose={() => setRating(null)} onSaved={load} />
    </div>
  );
}
