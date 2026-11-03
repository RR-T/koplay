import { useState } from 'react';

export default function CodeEntryScreen({ onCode, error }) {
  const [value, setValue] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const code = value.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch(`/api/code/${code}`);
      if (!res.ok) {
        onCode(null, 'Game code not found');
        return;
      }
      onCode(code);
    } catch {
      onCode(null, 'Connection error');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">KoPlay</h1>
        <p className="text-muted text-center mb-8">Enter the game code shown on the TV</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder="Game code"
            maxLength={5}
            autoFocus
            className="w-full px-4 py-3 bg-surface-light border border-muted/30 rounded-lg text-center text-2xl font-mono tracking-widest text-white placeholder-muted focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-lg transition-colors"
          >
            Join
          </button>
          {error && <p className="text-error text-center text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
