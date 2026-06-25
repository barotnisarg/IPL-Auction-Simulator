// client/src/components/common/Loader.jsx

const SIZE_STYLES = {
  sm: 'h-5 w-5',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const Spinner = ({ size }) => (
  <svg
    className={`animate-spin text-amber-400 ${SIZE_STYLES[size]}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Loader = ({ fullScreen = false, label = 'Loading...', size = 'md' }) => {
  const content = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
    >
      <Spinner size={size} />
      {label && <p className="text-sm text-neutral-400">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-neutral-950">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;