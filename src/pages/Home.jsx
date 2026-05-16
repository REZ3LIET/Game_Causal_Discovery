import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllLevels } from '../levels/index.js'

// Storage: { [levelId]: 'completed' | 'failed' | 'in-progress' }
const STATUS_KEY = 'causal_status'

function getAllStatus() {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}') } catch { return {} }
}

export default function Home() {
  const navigate = useNavigate()
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({})

  useEffect(() => {
    fetchAllLevels().then((lvls) => {
      setLevels(lvls)
      setStatus(getAllStatus())
      setLoading(false)
    })
  }, [])

  // Reread status every time page is focused (after returning from a level)
  useEffect(() => {
    const onFocus = () => setStatus(getAllStatus())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const total = levels.length
  const attempted = Object.values(status).filter((s) => s === 'completed' || s === 'failed').length
  const completed = Object.values(status).filter((s) => s === 'completed').length

  const statusIcon = (levelId) => {
    const s = status[levelId]
    if (s === 'completed')   return <span className="text-xs font-mono text-success">✓</span>
    if (s === 'failed')      return <span className="text-xs font-mono text-danger">✗</span>
    if (s === 'in-progress') return <span className="text-xs font-mono text-warn">●</span>
    return null
  }

  const isUnlocked = (_idx) => true

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <header className="px-8 pt-12 pb-6">
        <h1 className="font-mono text-3xl font-medium tracking-tight">
          <span className="text-accent">causal</span>
          <span className="text-white/30">.</span>
        </h1>
        <p className="text-muted text-sm mt-2">
          Discover the hidden causal graph. Use interventions wisely.
        </p>

        {/* Score bar */}
        {!loading && attempted > 0 && (
          <div className="flex items-center gap-6 mt-5 px-5 py-3 bg-surface border border-border rounded-xl w-fit">
            <div className="text-center">
              <p className="text-xs font-mono text-muted uppercase tracking-widest">Total</p>
              <p className="text-lg font-mono font-medium text-white">{total}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-xs font-mono text-muted uppercase tracking-widest">Attempted</p>
              <p className="text-lg font-mono font-medium text-white">{attempted}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-xs font-mono text-muted uppercase tracking-widest">Score</p>
              <p className="text-lg font-mono font-medium text-accent">{completed}/{attempted}</p>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 px-8 py-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-6">Levels</p>

        {loading ? (
          <p className="text-sm text-muted font-mono">loading levels...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            {levels.map((level, idx) => {
              const unlocked = isUnlocked(idx)
              const s = status[level.id]

              return (
                <button
                  key={level.id}
                  onClick={() => unlocked && navigate(`/level/${level.id}`)}
                  disabled={!unlocked}
                  className={`
                    text-left p-5 rounded-xl border transition-all duration-200
                    ${unlocked
                      ? s === 'completed'
                        ? 'border-success/30 bg-surface hover:border-success/50 cursor-pointer'
                        : s === 'failed'
                        ? 'border-danger/30 bg-surface hover:border-danger/50 cursor-pointer'
                        : s === 'in-progress'
                        ? 'border-warn/30 bg-surface hover:border-warn/50 cursor-pointer'
                        : 'border-border bg-surface hover:border-accent/50 hover:bg-accent/5 cursor-pointer'
                      : 'border-border/40 bg-surface/40 cursor-not-allowed opacity-40'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs text-muted">{level.title}</span>
                    <span>{statusIcon(level.id)}</span>
                    {!unlocked && <span className="text-xs text-muted">🔒</span>}
                  </div>
                  <p className="text-sm font-medium text-white/80 leading-snug">{level.subtitle}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs text-muted">{level.variables.length} vars</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs text-muted">{level.interventionBudget} interventions</span>
                    {level.observations.length === 0 && (
                      <>
                        <span className="text-muted/40">·</span>
                        <span className="text-xs text-warn">no observations</span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && (
          <div className="flex items-center gap-5 mt-8 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5"><span className="text-success">✓</span> completed</span>
            <span className="flex items-center gap-1.5"><span className="text-danger">✗</span> failed</span>
            <span className="flex items-center gap-1.5"><span className="text-warn">●</span> in progress</span>
          </div>
        )}
      </main>

      <footer className="px-8 py-6 text-xs text-muted/50 font-mono">
        <button onClick={() => navigate('/admin')} className="hover:text-muted transition-colors cursor-pointer">
          level builder ↗
        </button>
      </footer>
    </div>
  )
}