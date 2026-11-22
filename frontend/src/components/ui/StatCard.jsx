export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="rounded-lg bg-brand-50 p-3 text-brand-700"><Icon className="h-6 w-6" /></div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
