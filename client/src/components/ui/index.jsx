import { forwardRef } from 'react';

export function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={`ui-card rounded-[20px] border p-4 transition-all ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--line)',
        color: 'var(--ink)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
  ...props
}) {
  let variantStyle = {
    backgroundColor: 'var(--brand)',
    color: 'var(--brand-ink)',
    border: 'none',
  };

  if (variant === 'ghost' || variant === 'outline') {
    variantStyle = {
      backgroundColor: 'transparent',
      color: 'var(--ink)',
      border: '1.5px solid var(--line)',
    };
  } else if (variant === 'danger') {
    variantStyle = {
      backgroundColor: 'var(--out-bg)',
      color: 'var(--out)',
      border: 'none',
    };
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-bold',
    md: 'px-4 py-2.5 text-sm rounded-[14px] font-bold',
    lg: 'px-4 py-3.5 text-base rounded-[14px] font-bold',
  };

  return (
    <button
      className={`ui-button ${variant === 'primary' ? 'ui-button--primary' : ''} inline-flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-[0.97] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.md} ${className}`}
      style={{ ...variantStyle, ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export const Input = forwardRef(function Input(
  { label, error, helperText, className = '', type = 'text', prefix, currency = false, ...props },
  ref
) {
  const inputType = currency ? 'text' : type;
  const handleCurrencyChange = (event) => {
    const digits = event.target.value.replace(/\D/g, '');
    props.onChange?.({ ...event, target: { ...event.target, value: digits } });
  };
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold mb-1.5 text-[var(--ink)]">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--muted)]">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`ui-input w-full py-3 px-3.5 border rounded-[14px] text-[15px] transition-colors focus:outline-none ${
            prefix || currency ? 'pl-11' : ''
          } ${className}`}
          style={{
            backgroundColor: 'var(--bg)',
            borderColor: error ? 'var(--out)' : 'var(--line)',
            color: 'var(--ink)',
          }}
          {...props}
          inputMode={currency ? 'numeric' : props.inputMode}
          value={currency && props.value !== '' && props.value != null
            ? Number(String(props.value).replace(/\D/g, '')).toLocaleString('id-ID')
            : props.value}
          onChange={currency ? handleCurrencyChange : props.onChange}
        />
        {currency && !prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--muted)]">Rp</span>
        )}
      </div>
      {error && <p className="text-xs font-semibold mt-1 text-[var(--out)]">{error}</p>}
      {helperText && !error && (
        <p className="text-xs mt-1 text-[var(--muted)]">{helperText}</p>
      )}
    </div>
  );
});

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-bold mb-1.5 text-[var(--ink)]">
          {label}
        </label>
      )}
      <select
        className={`ui-input w-full min-w-0 py-3 px-3.5 border rounded-[14px] text-[15px] focus:outline-none ${className}`}
        style={{
          backgroundColor: 'var(--surface)',
          borderColor: error ? 'var(--out)' : 'var(--line)',
          color: 'var(--ink)',
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}

export function CategorySelect({ value, onChange, categories, className = '' }) {
  const seenNames = new Set();
  const uniqueCategories = categories.filter((category) => {
    const normalizedName = category.name.trim().toLocaleLowerCase('id');
    if (seenNames.has(normalizedName)) return false;
    seenNames.add(normalizedName);
    return true;
  });

  return (
    <select
      value={value}
      onChange={onChange}
      className={`ui-input w-full min-w-0 px-3.5 py-3 rounded-[14px] border text-[15px] focus:outline-none ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--line)', color: 'var(--ink)' }}
    >
      <option value="" style={{ backgroundColor: 'var(--option-bg)', color: 'var(--option-ink)' }}>Pilih kategori...</option>
      {uniqueCategories.map((cat) => (
        <option key={cat.id} value={cat.id} style={{ backgroundColor: 'var(--option-bg)', color: 'var(--option-ink)' }}>
          {cat.name}
        </option>
      ))}
    </select>
  );
}

export function ProgressBar({ percent = 0, status = 'safe', className = '', style = {}, color }) {
  const clampedPercent = Math.min(100, Math.max(0, percent));

  let barColor = 'var(--brand)';
  if (status === 'over' || status === 'danger') {
    barColor = 'var(--out)';
  } else if (status === 'accent' || percent >= 100) {
    barColor = 'var(--accent)';
  }

  return (
    <div
      className={`h-2 rounded-full overflow-hidden w-full ${className}`}
      style={{ backgroundColor: 'var(--track)', ...style }}
      role="progressbar"
      aria-valuenow={clampedPercent}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${clampedPercent}%`, backgroundColor: color || barColor }}
      />
    </div>
  );
}

export function Dialog({ isOpen, onClose, title, subtitle, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ backgroundColor: 'rgba(8,20,15,0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] rounded-t-[26px] p-5 animate-slide-up max-h-[94vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--surface)', color: 'var(--ink)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-xl font-extrabold mb-1 text-[var(--ink)]">{title}</h2>
        )}
        {subtitle && <p className="text-sm text-[var(--muted)] mb-4">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  let bg = 'var(--track)';
  let text = 'var(--ink)';

  if (variant === 'safe' || variant === 'primary') {
    bg = 'var(--in-bg)';
    text = 'var(--brand)';
  } else if (variant === 'warning') {
    bg = '#F8E7E3';
    text = '#B3402F';
  } else if (variant === 'danger') {
    bg = '#F8E7E3';
    text = '#B3402F';
  }

  return (
    <span
      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {children}
    </span>
  );
}
