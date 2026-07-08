// client/src/pages/ResetPasswordPage.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { resetPassword, clearResetStatus } from '../features/auth/authSlice';
import Button from '../components/common/Button';

const ResetPasswordPage = () => {
  const { token }   = useParams();
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const { resetStatus, resetError, isAuthenticated } = useSelector((s) => s.auth);

  const [form, setForm]         = useState({ password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState(null);

  // Reset slice status when the component unmounts.
  useEffect(() => () => { dispatch(clearResetStatus()); }, [dispatch]);

  // Redirect once the reset logs the user in automatically.
  useEffect(() => {
    if (resetStatus === 'succeeded' && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [resetStatus, isAuthenticated, navigate]);

  // No token in the URL — shouldn't happen via normal flow, but guard anyway.
  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4 text-center">
        <div>
          <p className="text-base font-bold text-neutral-100">Invalid reset link.</p>
          <Link to="/forgot-password" className="mt-2 block text-sm text-amber-400 hover:text-amber-300">
            Request a new one
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = resetStatus === 'loading';

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setLocalError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    dispatch(resetPassword({ token, password: form.password, confirmPassword: form.confirmPassword }));
  };

  const displayError = localError || resetError;

  const INPUT_CLASS = 'mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950">
      <header className="px-5 py-4">
        <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-neutral-100">Set a new password</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Choose something strong — at least 8 characters.
          </p>

          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-300">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-300">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className={INPUT_CLASS}
                />
              </div>

              {displayError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <svg className="mt-px h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-sm text-red-400">{displayError}</p>
                </div>
              )}

              {/* Link expired / invalid — show a clear path to recover */}
              {resetStatus === 'failed' && (
                <p className="text-center text-xs text-neutral-600">
                  Link expired?{' '}
                  <Link
                    to="/forgot-password"
                    className="font-semibold text-amber-400 hover:text-amber-300"
                  >
                    Request a new one
                  </Link>
                </p>
              )}

              <Button type="submit" isLoading={isLoading} size="lg" className="mt-1 w-full">
                Reset password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;