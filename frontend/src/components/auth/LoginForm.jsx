import { useState } from 'react';

export default function LoginForm({ onSubmit, error, loading }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!loading) {
      onSubmit(username, password);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium leading-normal text-ink">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Masukkan username"
          autoComplete="username"
          required
          className="rounded-sm border border-hairline bg-canvas px-4 py-3 text-base leading-normal text-ink outline-none transition-colors placeholder:text-ink/40 focus:ring-2 focus:ring-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium leading-normal text-ink">
          Kata Sandi
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi"
            autoComplete="current-password"
            required
            className="w-full rounded-sm border border-hairline bg-canvas px-4 py-3 pr-16 text-base leading-normal text-ink outline-none transition-colors placeholder:text-ink/40 focus:ring-2 focus:ring-ink"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-sm font-medium text-ink/60 hover:text-ink focus:outline-none focus:ring-2 focus:ring-ink rounded-sm"
            tabIndex={-1}
          >
            {showPassword ? 'Sembunyi' : 'Lihat'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="min-h-11 rounded-pill bg-ink px-6 py-3 text-base font-medium text-on-ink transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
      >
        {loading ? 'Masuk...' : 'Masuk'}
      </button>
    </form>
  );
}