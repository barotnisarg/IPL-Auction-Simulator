// client/src/components/common/Loader.jsx

import { Spinner } from './Button';

const SIZES = {
  sm: 'h-4 w-4',
  md: 'h-7 w-7',
  lg: 'h-10 w-10',
};

const Loader = ({ fullScreen = false, label = 'Loading...', size = 'md' }) => {
  const inner = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <span className={`text-amber-500 ${SIZES[size]}`}>
        <Spinner className={SIZES[size]} />
      </span>
      {label && (
        <p className="text-sm font-medium tracking-wide text-neutral-500">{label}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-neutral-950">
        {inner}
      </div>
    );
  }

  return inner;
};

export default Loader;