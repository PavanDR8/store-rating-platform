import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

export const Spinner = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500" role="status">
    <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> {label}
  </div>
);

export const EmptyState = ({ title, message, action }) => (
  <div className="flex flex-col items-center px-4 py-12 text-center">
    <Inbox className="h-10 w-10 text-slate-300" />
    <p className="mt-3 font-semibold text-slate-800">{title}</p>
    {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex flex-col items-center px-4 py-10 text-center" role="alert">
    <AlertCircle className="h-9 w-9 text-red-500" />
    <p className="mt-3 text-sm font-medium text-slate-800">{message}</p>
    {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>}
  </div>
);
