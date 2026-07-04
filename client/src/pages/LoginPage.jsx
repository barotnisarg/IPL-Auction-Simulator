// client/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../features/auth/authSlice';
import Button from '../components/common/Button';

const ErrorBanner = ({ message }) => (
  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
    <svg className="mt-px h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
    <p className="text-sm text-red-400">{message}</p>
  </div>
);

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const isLoading = status === 'loading';

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login(form)).unwrap();
      navigate('/');
    } catch {
      // error lives in redux state
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950">
      <header className="px-5 py-4 md:px-8">
        <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-neutral-100">Welcome back</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Log in to create or join an auction room.
          </p>

          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@example.com"
                  className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className="mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              {error && <ErrorBanner message={error} />}

              <Button type="submit" isLoading={isLoading} size="lg" className="mt-1 w-full">
                Log in
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            No account?{' '}
            <Link to="/register" className="font-semibold text-amber-400 hover:text-amber-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;