export default function Scoreboard({ scores, players, className = '' }) {
  const entries = players
    .map((p) => ({ name: p.name, score: scores[p.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className={`mt-4 ${className}`}>
      <h3 className="text-lg font-semibold text-muted-light mb-2">Scores</h3>
      <ul className="flex flex-wrap gap-4 justify-center">
        {entries.map((e) => (
          <li key={e.name} className="flex items-center gap-2">
            <span className="text-muted-light">{e.name}</span>
            <span className="font-bold text-accent">{e.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
