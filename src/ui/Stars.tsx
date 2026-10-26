interface StarsProps {
  value: number;
  /** Without onChange the stars only show a rating. */
  onChange?(value: number): void;
  label: string;
}

/** Five stars in gold (#d4af37); with onChange each one is a button that sets that rating. */
export function Stars({ value, onChange, label }: StarsProps) {
  return (
    <div className="ap-stars" role={onChange ? 'radiogroup' : 'img'} aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (onChange
        ? (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} de 5`}
                  className={`ap-star${n <= value ? ' on' : ''}`} onClick={() => onChange(n)}>★</button>
        )
        : <span key={n} aria-hidden="true" className={`ap-star${n <= Math.round(value) ? ' on' : ''}`}>★</span>))}
    </div>
  );
}
