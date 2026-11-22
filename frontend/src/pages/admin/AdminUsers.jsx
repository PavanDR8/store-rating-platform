import { useCallback, useEffect, useState } from 'react';
import { Eye, Loader2, Plus } from 'lucide-react';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import useTableState from '../../hooks/useTableState';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Field from '../../components/ui/Field';
import SearchInput from '../../components/ui/SearchInput';
import SortableTh from '../../components/ui/SortableTh';
import Pagination from '../../components/ui/Pagination';
import StarRating from '../../components/ui/StarRating';
import { EmptyState, ErrorBox, Spinner } from '../../components/ui/States';
import { formatDateTime, formatRating, roleLabel, rules, validate } from '../../utils/validators';

const ROLE_OPTIONS = [
  { value: 'USER', label: 'Normal user' },
  { value: 'STORE_OWNER', label: 'Store owner' },
  { value: 'ADMIN', label: 'Administrator' },
];
const SCHEMA = { name: rules.name, email: rules.email, address: rules.address, password: rules.password, role: rules.role };
const EMPTY = { name: '', email: '', address: '', password: '', role: 'USER' };

function AddUserModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) { setForm(EMPTY); setErrors({}); } }, [open]);
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, SCHEMA);
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    try {
      await api.post('/admin/users', form);
      toast.success('User created');
      onCreated();
      onClose();
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add user">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Full name" name="name" value={form.name} onChange={onChange} error={errors.name} hint="20 to 60 characters" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Address" name="address" as="textarea" value={form.address} onChange={onChange} error={errors.address} />
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} hint="8 to 16 characters, one uppercase letter and one special character" />
        <Field label="Role" name="role" as="select" options={ROLE_OPTIONS} value={form.role} onChange={onChange} error={errors.role} />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />} Create user</button>
        </div>
      </form>
    </Modal>
  );
}

function UserDetailsModal({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setUser(null); setError('');
    if (!userId) return;
    api.get(`/admin/users/${userId}`).then((r) => setUser(r.data.data)).catch((e) => setError(getErrorMessage(e)));
  }, [userId]);

  const rows = user && [
    ['Name', user.name], ['Email', user.email], ['Address', user.address],
    ['Role', roleLabel(user.role)], ['Created', formatDateTime(user.created_at)],
  ];

  return (
    <Modal open={Boolean(userId)} onClose={onClose} title="User details">
      {error && <ErrorBox message={error} />}
      {!user && !error && <Spinner />}
      {user && (
        <div>
          <dl className="divide-y divide-slate-100 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-2 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="col-span-2 break-words font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          {user.role === 'STORE_OWNER' && (
            <div className="mt-4 rounded-lg bg-brand-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Associated store</p>
              {user.store ? (
                <>
                  <p className="mt-1 text-sm text-slate-700">{user.store.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StarRating value={user.store.avg_rating} />
                    <span className="text-sm font-semibold">{formatRating(user.store.avg_rating)}</span>
                    <span className="text-xs text-slate-500">({user.store.rating_count} rating{user.store.rating_count === 1 ? '' : 's'})</span>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-600">No store linked yet.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function AdminUsers() {
  const { state, setSearch, setPage, setFilter, toggleSort } = useTableState({ sortBy: 'name', order: 'asc', role: '' });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [detailsId, setDetailsId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/users', { params: state });
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Administrators, store owners and normal users.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add user</button>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search name, email or address" />
          <select className="input sm:w-48" value={state.role} onChange={(e) => setFilter('role', e.target.value)} aria-label="Filter by role">
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
          <EmptyState title="No users found" message="Try a different search or role filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTh label="Name" sortKey="name" state={state} onSort={toggleSort} />
                  <SortableTh label="Email" sortKey="email" state={state} onSort={toggleSort} />
                  <SortableTh label="Address" sortKey="address" state={state} onSort={toggleSort} />
                  <SortableTh label="Role" sortKey="role" state={state} onSort={toggleSort} />
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900">{u.name}</td>
                    <td className="td">{u.email}</td>
                    <td className="td max-w-xs truncate" title={u.address}>{u.address}</td>
                    <td className="td">
                      {roleLabel(u.role)}
                      {u.role === 'STORE_OWNER' && <span className="ml-2 text-xs text-slate-500">Rating {formatRating(u.rating)}</span>}
                    </td>
                    <td className="td text-right">
                      <button className="btn-ghost px-2 py-1" onClick={() => setDetailsId(u.id)}><Eye className="h-4 w-4" /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>

      <AddUserModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={load} />
      <UserDetailsModal userId={detailsId} onClose={() => setDetailsId(null)} />
    </div>
  );
}
