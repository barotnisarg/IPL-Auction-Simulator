// client/src/components/common/Button.jsx

const VARIANTS = {
  primary: [
    'bg-amber-500 text-neutral-950 font-bold',
    'hover:bg-amber-400',
    'active:bg-amber-600 active:scale-[0.98]',
    'focus-visible:ring-amber-400',
    'disabled:bg-amber-500/30 disabled:text-neutral-950/50',
  ].join(' '),

  secondary: [
    'bg-neutral-800 text-neutral-200 font-semibold',
    'border border-neutral-700',
    'hover:bg-neutral-700 hover:border-neutral-600',
    'active:bg-neutral-800 active:scale-[0.98]',
    'focus-visible:ring-neutral-500',
    'disabled:opacity-40',
  ].join(' '),

  danger: [
    'bg-red-600 text-white font-bold',
    'hover:bg-red-500',
    'active:bg-red-700 active:scale-[0.98]',
    'focus-visible:ring-red-400',
    'disabled:opacity-40',
  ].join(' '),

  ghost: [
    'text-neutral-400 font-semibold',
    'hover:text-neutral-100 hover:bg-neutral-800',
    'active:scale-[0.98]',
    'focus-visible:ring-neutral-500',
    'disabled:opacity-40',
  ].join(' '),
};

const SIZES = {
  sm: 'h-8  px-3   text-xs  gap-1.5 rounded-md',
  md: 'h-10 px-4   text-sm  gap-2   rounded-lg',
  lg: 'h-11 px-5   text-sm  gap-2   rounded-lg',
  xl: 'h-13 px-6   text-base gap-2  rounded-lg',
};

const Spinner = ({ className = 'h-4 w-4' }) => (
  <svg
    className={`animate-spin shrink-0 ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...rest
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || isLoading}
    className={[
      'inline-flex items-center justify-center',
      'transition-all duration-150 select-none',
      'focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900',
      'disabled:cursor-not-allowed disabled:pointer-events-none',
      VARIANTS[variant] ?? VARIANTS.primary,
      SIZES[size]       ?? SIZES.md,
      className,
    ].join(' ')}
    {...rest}
  >
    {isLoading && <Spinner />}
    {children}
  </button>
);

export { Spinner };
export default Button;