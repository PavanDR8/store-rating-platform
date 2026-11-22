import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Field from '../../components/ui/Field';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { rules, validate } from '../../utils/validators';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function UpdatePassword() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form, {
      currentPassword: rules.required('Current password'),
      newPassword: rules.password,
      confirmPassword: (v) => (v !== form.newPassword ? 'Passwords do not match' : ''),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await api.patch('/auth/update-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      toast.success('Password updated');
      setForm(EMPTY);
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-extrabold text-slate-900">Change password</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">Choose a new password for your account.</p>
      <form onSubmit={onSubmit} noValidate className="card space-y-4 p-5">
        <Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={onChange} error={errors.currentPassword} />
        <Field label="New password" name="newPassword" type="password" autoComplete="new-password" value={form.newPassword} onChange={onChange} error={errors.newPassword} hint="8 to 16 characters, one uppercase letter and one special character" />
        <Field label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} />
        <button className="btn-primary" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
        </button>
      </form>
    </div>
  );
}
