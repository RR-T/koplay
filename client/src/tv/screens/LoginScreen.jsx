import { useState } from 'react';

export default function LoginScreen({ onLogin, error }) {
  const [token, setToken] = useState('');
  const [pending, setPending] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;
    setPending(true);
    onLogin(t);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-8 p-8"
      style={{ background: '#0f0f1a' }}
    >
      <div className="flex flex-col items-center gap-2">
        <p className="text-5xl font-black text-white">KoPlay</p>
        <p className="text-xl" style={{ color: '#a0a0c0' }}>Screen Access</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="password"
          value={token}
          onChange={(e) => { setToken(e.target.value); setPending(false); }}
          placeholder="Access code"
          autoFocus
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl text-white text-lg"
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.2)',
            outline: 'none',
          }}
        />
        {error && (
          <p className="text-sm text-center" style={{ color: '#f87171' }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={!token.trim() || pending}
          className="w-full py-3 text-white text-lg font-bold rounded-xl"
          style={{
            background: pending || !token.trim() ? '#444' : '#6366f1',
            cursor: pending || !token.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          Connect
        </button>
      </form>
    </div>
  );
}
