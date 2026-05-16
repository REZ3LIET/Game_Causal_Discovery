const resultIcon = {
  increased: { symbol: '↑', color: 'text-success', label: 'increased' },
  decreased: { symbol: '↓', color: 'text-danger', label: 'decreased' },
  unchanged: { symbol: '—', color: 'text-muted', label: 'unchanged' },
}

export default function IntPanel({ level, budgetLeft, lastResult, onIntervene, disabled }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-4">

      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest text-muted">Interventions</p>
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
          budgetLeft === 0 ? 'text-danger border-danger/40 bg-danger/10'
          : budgetLeft === 1 ? 'text-warn border-warn/40 bg-warn/10'
          : 'text-accent border-accent/30 bg-accent/10'
        }`}>
          {budgetLeft} left
        </span>
      </div>

      {/* Intervention buttons */}
      <div className="space-y-2">
        {level.variables.map((v) => (
          <div key={v} className="space-y-1">
            {/* <span className="font-mono text-xs text-white/40">{v}</span> */}
            <div className="flex gap-1.5">
              {[0, 1].map((val) => (
                <button
                  key={val}
                  onClick={() => onIntervene(v, val)}
                  disabled={disabled || budgetLeft === 0}
                  className={`
                    flex-1 text-xs font-mono py-1.5 rounded-lg border transition-all duration-150
                    ${disabled || budgetLeft === 0
                      ? 'border-border text-muted cursor-not-allowed opacity-40'
                      : 'border-accent/30 text-accent hover:bg-accent/10 hover:border-accent active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  do({v}={val})
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Last result */}
      {lastResult ? (
        <div className="border-t border-border pt-3 space-y-2">
          <p className="text-xs font-mono text-muted">
            Result of <span className="text-accent">do({lastResult.variable}={lastResult.value})</span>
          </p>
          <div className="space-y-1.5">
            {Object.entries(lastResult.outcomes).map(([v, outcome]) => {
              const { symbol, color, label } = resultIcon[outcome]
              return (
                <div key={v} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-white/70 truncate max-w-[45%]">{v}</span>
                  <span className={`font-mono font-bold text-sm ${color}`}>{symbol}</span>
                  <span className={`font-mono ${color} text-right`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted italic border-t border-border pt-3">
          No interventions yet.
        </p>
      )}
    </div>
  )
}