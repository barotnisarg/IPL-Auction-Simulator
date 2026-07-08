// client/src/pages/ForgotPasswordPage.jsx

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { forgotPassword, clearForgotStatus } from '../features/auth/authSlice';
import Button from '../components/common/Button';

const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const { forgotStatus, forgotError } = useSelector((s) => s.auth);

  const [email, setEmail] = useState('');

  // Reset slice status when the component unmounts so stale state doesn't
  // show on the next visit.
  useEffect(() => () => { dispatch(clearForgotStatus()); }, [dispatch]);

  const isLoading   = forgotStatus === 'loading';
  const isSucceeded = forgotStatus === 'succeeded';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    dispatch(forgotPassword({ email: email.trim() }));
  };

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950">
      <header className="px-5 py-4">
        <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Back */}
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to login
          </Link>

          <h1 className="text-2xl font-black text-neutral-100">Forgot password?</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {/* Success state — show confirmation, hide form */}
          {isSucceeded ? (
            <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-6 w-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.8 19.8 0 01.05 2.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-emerald-400">Check your inbox</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                If an account exists for <span className="font-medium text-neutral-300">{email}</span>,
                we&apos;ve sent a password reset link. It expires in 30 minutes.
              </p>
              <p className="mt-3 text-xs text-neutral-600">
                Didn&apos;t get it? Check your spam folder, or{' '}
                <button
                  type="button"
                  onClick={() => { dispatch(clearForgotStatus()); setEmail(''); }}
                  className="font-semibold text-amber-400 hover:text-amber-300"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neutral-300">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                {forgotError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                    <svg className="mt-px h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                    </svg>
                    <p className="text-sm text-red-400">{forgotError}</p>
                  </div>
                )}

                <Button type="submit" isLoading={isLoading} size="lg" className="mt-1 w-full">
                  Send reset link
                </Button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;