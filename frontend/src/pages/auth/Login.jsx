import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../../components/AuthShell';
import Field from '../../components/ui/Field';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { homePathFor, rules, validate } from '../../utils/validators';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homePathFor(user.role)} replace />;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(form, { email: rules.email, password: rules.required('Password') });
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const loggedIn = await login(form.email.trim(), form.password);
      navigate(homePathFor(loggedIn.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your stores, ratings and dashboard."
      footer={<>New here? <Link className="font-semibold text-brand-700 hover:underline" to="/signup">Create an account</Link></>}
    >
      {location.state?.message && (
        <p className="mb-4 rounded-lg bg-brand-50 p-3 text-sm text-brand-700" role="status">{location.state.message}</p>
      )}
      {serverError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{serverError}</p>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password} onChange={onChange} error={errors.password} />
        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
        </button>
      </form>
    </AuthShell>
  );
}
