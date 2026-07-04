// client/src/pages/RegisterPage.jsx

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { register } from '../features/auth/authSlice';
import Button from '../components/common/Button';

const INPUT_CLASS = 'mt-1.5 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20';

const ErrorBanner = ({ message }) => (
  <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
    <svg className="mt-px h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
    </svg>
    <p className="text-sm text-red-400">{message}</p>
  </div>
);

const RegisterPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm]           = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState(null);
  const isLoading = status === 'loading';

  const set = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setLocalError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    try {
      const { name, email, password } = form;
      await dispatch(register({ name, email, password })).unwrap();
      navigate('/');
    } catch {
      // error lives in redux state
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-950">
      <header className="px-5 py-4 md:px-8">
        <Link to="/" className="text-sm font-bold tracking-tight text-neutral-100">
          Cric<span className="text-amber-400">Bid</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-neutral-100">Create your account</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign up to host or join an auction room.
          </p>

          <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-300">Name</label>
                <input id="name" type="text" autoComplete="name" required value={form.name} onChange={set('name')} placeholder="Rohit Sharma" className={INPUT_CLASS} />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-300">Email</label>
                <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className={INPUT_CLASS} />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-300">Password</label>
                <input id="password" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={set('password')} placeholder="••••••••" className={INPUT_CLASS} />
                <p className="mt-1 text-xs text-neutral-600">At least 8 characters.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-300">Confirm password</label>
                <input id="confirmPassword" type="password" autoComplete="new-password" required minLength={8} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••" className={INPUT_CLASS} />
              </div>

              {displayError && <ErrorBanner message={displayError} />}

              <Button type="submit" isLoading={isLoading} size="lg" className="mt-1 w-full">
                Create account
              </Button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-amber-400 hover:text-amber-300">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;