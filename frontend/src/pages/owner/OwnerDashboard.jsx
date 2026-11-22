import { useCallback, useEffect, useState } from 'react';
import { MapPin, Star, Users } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import useTableState from '../../hooks/useTableState';
import SortableTh from '../../components/ui/SortableTh';
import Pagination from '../../components/ui/Pagination';
import StarRating from '../../components/ui/StarRating';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, ErrorBox, Spinner } from '../../components/ui/States';
import { formatDateTime, formatRating } from '../../utils/validators';

export default function OwnerDashboard() {
  const { state, setPage, toggleSort } = useTableState({ sortBy: 'date', order: 'desc' });
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noStore, setNoStore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/owner/dashboard', { params: state });
      setData(res.data.data); setPagination(res.data.pagination); setNoStore(false);
    } catch (err) {
      if (err.response?.status === 404) setNoStore(true);
      else setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [state]);
  useEffect(() => { load(); }, [load]);

  if (loading && !data) return <Spinner />;
  if (noStore) return <div className="card"><EmptyState title="No store linked yet" message="An administrator needs to link a store to your account." /></div>;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const { store, ratings } = data;
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">{store.name}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {store.address} <span className="text-slate-300">|</span> {store.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard icon={Star} label="Average rating" value={formatRating(store.avg_rating)} hint={store.rating_count ? 'out of 5' : 'No ratings yet'} />
        <StatCard icon={Users} label="Total ratings" value={store.rating_count} />
      </div>

      <div className="card mt-6">
        <div className="border-b border-slate-200 p-4"><h2 className="font-bold text-slate-900">Users who rated your store</h2></div>
        {ratings.length === 0 ? (
          <EmptyState title="No ratings yet" message="Ratings will appear here as soon as users rate your store." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTh label="User name" sortKey="name" state={state} onSort={toggleSort} />
                  <SortableTh label="User email" sortKey="email" state={state} onSort={toggleSort} />
                  <SortableTh label="Rating" sortKey="rating" state={state} onSort={toggleSort} />
                  <SortableTh label="Submitted on" sortKey="date" state={state} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ratings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900">{r.user_name}</td>
                    <td className="td">{r.user_email}</td>
                    <td className="td"><div className="flex items-center gap-2"><StarRating value={r.rating} size="h-4 w-4" /><span className="font-semibold">{r.rating}</span></div></td>
                    <td className="td">{formatDateTime(r.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
    </div>
  );
}
