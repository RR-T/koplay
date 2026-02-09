import { useTimer } from '../hooks/useTimer';

export default function Timer({ endsAt, className = '' }) {
  const remaining = useTimer(endsAt);

  if (!endsAt) return null;

  return (
    <div className={`text-4xl font-bold text-accent ${className}`}>
      {remaining}s
    </div>
  );
}
