export default function Rankings({ finalRanking, className = '' }) {
  return (
    <ul className={`flex flex-col gap-4 w-full max-w-lg ${className}`}>
      {finalRanking.map((r, i) => (
        <li
          key={r.id}
          className={`flex items-center gap-6 px-6 py-4 rounded-lg ${
            i === 0
              ? 'bg-accent/20 border border-accent'
              : 'bg-surface-light/50'
          }`}
        >
          <span className="text-2xl font-bold text-muted w-8">#{i + 1}</span>
          <span className="flex-1 text-2xl">{r.name}</span>
          <span className="text-2xl font-bold text-accent">{r.score}</span>
        </li>
      ))}
    </ul>
  );
}
