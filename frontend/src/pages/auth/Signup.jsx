import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Field from '../../components/ui/Field';
import api, { getErrorMessage, getFieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { homePathFor, rules, validate } from '../../utils/validators';

const SCHEMA = { name: rules.name, email: rules.email, address: rules.address, password: rules.password };

export default function Signup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form, SCHEMA);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await api.post('/auth/signup', { ...form, name: form.name.trim(), email: form.email.trim() });
      navigate('/login', { state: { message: 'Account created. You can log in now.' } });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Sign up as a normal user to rate stores."
      footer={<>Already registered? <Link className="font-semibold text-brand-700 hover:underline" to="/login">Log in</Link></>}
    >
      {serverError && !Object.keys(errors).length && (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" name="name" value={form.name} onChange={onChange} error={errors.name} hint="20 to 60 characters" autoComplete="name" />
        <Field label="Email" name="email" type="email" value={form.email} onChange={onChange} error={errors.email} autoComplete="email" />
        <Field label="Address" name="address" as="textarea" value={form.address} onChange={onChange} error={errors.address} hint="Up to 400 characters" autoComplete="street-address" />
        <Field label="Password" name="password" type="password" value={form.password} onChange={onChange} error={errors.password} hint="8 to 16 characters, one uppercase letter and one special character" autoComplete="new-password" />
        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </button>
      </form>
    </AuthShell>
  );
}
