import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
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
import { formatRating, rules, validate } from '../../utils/validators';

const EMPTY = {
  name: '', email: '', address: '', ownerMode: 'existing', ownerId: '',
  'owner.name': '', 'owner.email': '', 'owner.address': '', 'owner.password': '',
};

function AddStoreModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY); setErrors({});
    api.get('/admin/owners').then((r) => setOwners(r.data.data)).catch((e) => toast.error(getErrorMessage(e)));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isNew = form.ownerMode === 'new';

  const submit = async (e) => {
    e.preventDefault();
    const schema = { name: rules.storeName, email: rules.email, address: rules.address };
    if (isNew) {
      Object.assign(schema, {
        'owner.name': rules.name, 'owner.email': rules.email,
        'owner.address': rules.address, 'owner.password': rules.password,
      });
    } else {
      schema.ownerId = rules.required('Store owner');
    }
    const found = validate(form, schema);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = { name: form.name, email: form.email, address: form.address };
    if (isNew) {
      payload.owner = { name: form['owner.name'], email: form['owner.email'], address: form['owner.address'], password: form['owner.password'] };
    } else {
      payload.ownerId = Number(form.ownerId);
    }

    setLoading(true);
    try {
      await api.post('/admin/stores', payload);
      toast.success('Store created');
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
    <Modal open={open} onClose={onClose} title="Add store" size="lg">
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Store name" name="name" value={form.name} onChange={onChange} error={errors.name} hint="3 to 60 characters" />
        <Field label="Store email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Store address" name="address" as="textarea" value={form.address} onChange={onChange} error={errors.address} />

        <fieldset className="rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Store owner</legend>
          <div className="mb-3 flex gap-4 text-sm">
            {[['existing', 'Pick an existing owner'], ['new', 'Create a new owner']].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input type="radio" name="ownerMode" value={value} checked={form.ownerMode === value} onChange={onChange} /> {label}
              </label>
            ))}
          </div>
          {!isNew ? (
            <Field
              label="Owner" name="ownerId" as="select" value={form.ownerId} onChange={onChange} error={errors.ownerId}
              options={[{ value: '', label: owners.length ? 'Select an owner' : 'No owners without a store' }, ...owners.map((o) => ({ value: o.id, label: `${o.name} (${o.email})` }))]}
              hint="Only store owners who do not have a store yet are listed."
            />
          ) : (
            <div className="space-y-4">
              <Field label="Owner full name" name="owner.name" value={form['owner.name']} onChange={onChange} error={errors['owner.name']} hint="20 to 60 characters" />
              <Field label="Owner email" name="owner.email" type="email" value={form['owner.email']} onChange={onChange} error={errors['owner.email']} />
              <Field label="Owner address" name="owner.address" as="textarea" value={form['owner.address']} onChange={onChange} error={errors['owner.address']} />
              <Field label="Owner password" name="owner.password" type="password" value={form['owner.password']} onChange={onChange} error={errors['owner.password']} hint="8 to 16 characters, one uppercase letter and one special character" />
            </div>
          )}
        </fieldset>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />} Create store</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminStores() {
  const { state, setSearch, setPage, toggleSort } = useTableState({ sortBy: 'name', order: 'asc' });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/admin/stores', { params: state });
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
          <h1 className="text-2xl font-extrabold text-slate-900">Stores</h1>
          <p className="mt-1 text-sm text-slate-500">Every store belongs to one store owner account.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add store</button>
      </div>

      <div className="card">
        <div className="border-b border-slate-200 p-4">
          <SearchInput value={state.search} onChange={setSearch} placeholder="Search name, email or address" />
        </div>
        {loading ? <Spinner /> : error ? <ErrorBox message={error} onRetry={load} /> : rows.length === 0 ? (
          <EmptyState title="No stores found" message="Add a store or change your search." action={<button className="btn-primary" onClick={() => setShowAdd(true)}>Add store</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-50">
                <tr>
                  <SortableTh label="Store name" sortKey="name" state={state} onSort={toggleSort} />
                  <SortableTh label="Email" sortKey="email" state={state} onSort={toggleSort} />
                  <SortableTh label="Address" sortKey="address" state={state} onSort={toggleSort} />
                  <SortableTh label="Average rating" sortKey="avg_rating" state={state} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-900">{s.name}<div className="text-xs font-normal text-slate-500">Owner: {s.owner_name}</div></td>
                    <td className="td">{s.email}</td>
                    <td className="td max-w-xs truncate" title={s.address}>{s.address}</td>
                    <td className="td">
                      {s.rating_count ? (
                        <div className="flex items-center gap-2"><StarRating value={s.avg_rating} size="h-4 w-4" /><span className="font-semibold">{formatRating(s.avg_rating)}</span><span className="text-xs text-slate-500">({s.rating_count})</span></div>
                      ) : <span className="text-slate-500">No ratings yet</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pagination={pagination} onPage={setPage} />
      </div>
      <AddStoreModal open={showAdd} onClose={() => setShowAdd(false)} onCreated={load} />
    </div>
  );
}
