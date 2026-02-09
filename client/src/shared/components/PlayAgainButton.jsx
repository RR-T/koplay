import { useSocket } from '../context/SocketContext';

export default function PlayAgainButton({ className = '' }) {
  const { emit } = useSocket();

  return (
    <button
      className={`mt-6 px-8 py-3 bg-accent hover:bg-accent-hover text-white text-lg font-semibold rounded-lg transition-colors ${className}`}
      onClick={() => emit('game:action', { type: 'playAgain' })}
    >
      Play Again
    </button>
  );
}
