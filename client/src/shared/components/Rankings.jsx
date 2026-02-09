export default function Rankings({ finalRanking, className = '' }) {
  return (
    <ul className={`flex flex-col gap-3 w-full max-w-md ${className}`}>
      {finalRanking.map((r, i) => (
        <li
          key={r.id}
          className={`flex items-center gap-4 px-4 py-3 rounded-lg ${
            i === 0
              ? 'bg-accent/20 border border-accent'
              : 'bg-surface-light/50'
          }`}
        >
          <span className="text-xl font-bold text-muted w-8">#{i + 1}</span>
          <span className="flex-1 text-lg">{r.name}</span>
          <span className="text-xl font-bold text-accent">{r.score}</span>
        </li>
      ))}
    </ul>
  );
}
