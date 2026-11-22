import { useState } from 'react';
import { Star } from 'lucide-react';

// Read-only when no onChange is given. Interactive 1-5 stars otherwise.
export default function StarRating({ value = 0, onChange, size = 'h-5 w-5' }) {
  const [hover, setHover] = useState(0);
  const shown = hover || Math.round(value || 0);
  return (
    <div className="inline-flex items-center gap-0.5" role={onChange ? 'radiogroup' : 'img'} aria-label={`Rating ${value || 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const star = <Star className={`${size} ${n <= shown ? 'fill-star text-star' : 'text-slate-300'}`} />;
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded p-0.5"
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
