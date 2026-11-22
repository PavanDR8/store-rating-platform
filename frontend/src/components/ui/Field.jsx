// One form field: label + input/textarea/select + error message shown right under the field.
export default function Field({ label, name, error, as = 'input', options = [], hint, className = '', ...props }) {
  const common = {
    id: name,
    name,
    'aria-invalid': Boolean(error),
    className: `input ${error ? 'input-error' : ''}`,
    ...props,
  };
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {as === 'textarea' && <textarea rows={3} {...common} />}
      {as === 'select' && (
        <select {...common}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
      {as === 'input' && <input {...common} />}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}
