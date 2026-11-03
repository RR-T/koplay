import { useState } from 'react';

export default function JoinScreen({ onJoin, error, requireAuth }) {
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    if (requireAuth && !accessCode) return;
    onJoin(name.trim(), requireAuth ? accessCode : undefined);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-8">KoPlay</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {requireAuth && (
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Access code"
              autoFocus
              className="w-full px-4 py-3 bg-surface-light border border-muted/30 rounded-lg text-center text-lg text-white placeholder-muted focus:border-accent focus:outline-none"
            />
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={20}
            autoFocus={!requireAuth}
            className="w-full px-4 py-3 bg-surface-light border border-muted/30 rounded-lg text-center text-lg text-white placeholder-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim() || (requireAuth && !accessCode)}
            className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Join
          </button>
          {error && (
            <p className="text-error text-center text-sm">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
