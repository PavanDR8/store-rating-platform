import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Store, Users } from 'lucide-react';
import api, { getErrorMessage } from '../../api/client';
import StatCard from '../../components/ui/StatCard';
import { ErrorBox, Spinner } from '../../components/ui/States';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.get('/admin/dashboard').then((r) => setStats(r.data.data)).catch((e) => setError(getErrorMessage(e)));
  };
  useEffect(load, []);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!stats) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Live totals from the platform database.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Registered users" value={stats.total_users} />
        <StatCard icon={Store} label="Registered stores" value={stats.total_stores} />
        <StatCard icon={Star} label="Submitted ratings" value={stats.total_ratings} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/admin/users" className="btn-primary">Manage users</Link>
        <Link to="/admin/stores" className="btn-secondary">Manage stores</Link>
      </div>
    </div>
  );
}
