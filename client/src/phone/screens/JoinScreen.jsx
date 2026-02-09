import { useState } from 'react';
import AVATARS from '../../shared/avatars';
import SOUNDS from '../../shared/sounds';
import PixelAvatar from '../../shared/components/PixelAvatar';

export default function JoinScreen({ onJoin, error, takenAvatars = [], takenNoises = [] }) {
  const [step, setStep] = useState('name'); // 'name' | 'avatar' | 'noise'
  const [name, setName] = useState('');
  const [avatarId, setAvatarId] = useState(null);
  const [noiseId, setNoiseId] = useState(null);

  function handleNameSubmit(e) {
    e.preventDefault();
    if (name.trim()) setStep('avatar');
  }

  function handleAvatarSelect(id) {
    if (takenAvatars.includes(id)) return;
    setAvatarId(id);
  }

  function handleNoiseSelect(sound) {
    if (takenNoises.includes(sound.id)) return;
    sound.play();
    setNoiseId(sound.id);
  }

  function handleJoin() {
    if (name.trim() && avatarId && noiseId) {
      onJoin(name.trim(), avatarId, noiseId);
    }
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-bold text-center mb-8">KoPlay</h1>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              autoFocus
              className="w-full px-4 py-3 bg-surface-light border border-muted/30 rounded-lg text-center text-lg text-white placeholder-muted focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Next
            </button>
            {error && (
              <p className="text-error text-center text-sm">{error}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (step === 'avatar') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-2">Choose Avatar</h2>
          <p className="text-muted-light text-center text-sm mb-6">Pick your character</p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {AVATARS.map((avatar) => {
              const taken = takenAvatars.includes(avatar.id);
              const selected = avatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  disabled={taken}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                    taken
                      ? 'opacity-25 border-muted/20 cursor-not-allowed'
                      : selected
                        ? 'border-accent bg-accent/20'
                        : 'border-muted/20 hover:border-muted/50'
                  }`}
                >
                  <PixelAvatar avatar={avatar} size={40} />
                  <span className="text-xs text-muted-light">{avatar.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('name')}
              className="flex-1 py-3 bg-surface-light border border-muted/30 text-muted-light text-lg font-semibold rounded-lg transition-colors hover:bg-surface-light/80"
            >
              Back
            </button>
            <button
              onClick={() => avatarId && setStep('noise')}
              disabled={!avatarId}
              className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
          {error && (
            <p className="text-error text-center text-sm mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  if (step === 'noise') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-2">Choose Sound</h2>
          <p className="text-muted-light text-center text-sm mb-6">Tap to preview, pick your noise</p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {SOUNDS.map((sound) => {
              const taken = takenNoises.includes(sound.id);
              const selected = noiseId === sound.id;
              return (
                <button
                  key={sound.id}
                  onClick={() => handleNoiseSelect(sound)}
                  disabled={taken}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    taken
                      ? 'opacity-25 border-muted/20 cursor-not-allowed'
                      : selected
                        ? 'border-accent bg-accent/20'
                        : 'border-muted/20 hover:border-muted/50'
                  }`}
                >
                  <span className="text-2xl">🔊</span>
                  <span className="text-xs text-muted-light">{sound.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('avatar')}
              className="flex-1 py-3 bg-surface-light border border-muted/30 text-muted-light text-lg font-semibold rounded-lg transition-colors hover:bg-surface-light/80"
            >
              Back
            </button>
            <button
              onClick={handleJoin}
              disabled={!noiseId}
              className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Join Game
            </button>
          </div>
          {error && (
            <p className="text-error text-center text-sm mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
