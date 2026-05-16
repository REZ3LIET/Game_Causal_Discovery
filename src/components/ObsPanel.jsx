export default function ObsPanel({ observations }) {
  if (!observations || observations.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Observations</p>
        <p className="text-sm text-muted italic">No observations provided for this level.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-mono uppercase tracking-widest text-muted mb-3">Observations</p>
      <ul className="space-y-2">
        {observations.map((obs, i) => (
          <li key={i} className="flex gap-2 text-sm text-white/80">
            <span className="text-accent font-mono mt-0.5">—</span>
            <span>{obs}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
