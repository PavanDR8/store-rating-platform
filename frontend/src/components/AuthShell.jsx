import { Star } from 'lucide-react';

// Shared layout for login and signup pages.
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden flex-col justify-between bg-ink-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-xl font-extrabold"><Star className="h-6 w-6 fill-star text-star" /> Rollex</div>
        <div>
          <p className="text-4xl font-extrabold leading-tight">Every store,<br />rated by the people who shop there.</p>
          <p className="mt-4 max-w-sm text-slate-300">Browse stores, leave a 1 to 5 star rating, and change it whenever your opinion changes.</p>
        </div>
        <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="h-6 w-6 fill-star text-star" />)}</div>
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2 text-lg font-extrabold text-ink-900 lg:hidden">
            <Star className="h-5 w-5 fill-star text-star" /> Rollex
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
          <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        </div>
      </main>
    </div>
  );
}
