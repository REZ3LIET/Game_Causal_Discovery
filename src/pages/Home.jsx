import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllLevels } from '../levels/index.js'

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
    fetchAllLevels().then((lvls) => { setLevels(lvls); setStatus(getAllStatus()); setLoading(false) })
  }, [])

  useEffect(() => {
    const onFocus = () => setStatus(getAllStatus())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const total = levels.length
  const attempted = Object.values(status).filter((s) => s === 'completed' || s === 'failed').length
  const completed = Object.values(status).filter((s) => s === 'completed').length
  const isUnlocked = () => true

  const statusIcon = (levelId) => {
    const s = status[levelId]
    if (s === 'completed')   return <span className="text-xs font-mono text-success">✓</span>
    if (s === 'failed')      return <span className="text-xs font-mono text-danger">✗</span>
    if (s === 'in-progress') return <span className="text-xs font-mono text-warn">●</span>
    return null
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Title */}
        <h1 className="font-mono text-3xl font-medium tracking-tight mb-1">
          <span className="text-accent">Game of Causal Discovery</span>
          <span className="text-white/30">.</span>
        </h1>

        {/* About */}
        <div className="mt-6 mb-8 p-5 bg-surface border border-border rounded-xl text-base text-white/70 leading-relaxed space-y-2 max-w-2xl">
          <p>
            <span className="text-white font-medium">Causal discovery</span> is the task of inferring
            cause-and-effect relationships from data — not just correlations. Two variables can move
            together without one causing the other (a hidden common cause may explain both).
          </p>
          <p>
            In each level you are shown a set of variables and some observations about how they relate.
            Your goal is to draw the correct <span className="text-accent font-mono">directed acyclic graph (DAG)</span> showing
            which variables cause which.
          </p>
          <p>
            Use <span className="text-warn font-medium">interventions</span> (do-calculus) to break correlations
            and reveal true causal direction — setting a variable to a fixed value and observing what changes downstream.
            Submit your graph before your attempts run out.
          </p>
        </div>

        {/* Score bar */}
        {!loading && attempted > 0 && (
          <div className="flex items-center gap-6 mb-8 px-5 py-3 bg-surface border border-border rounded-xl w-fit">
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

        {/* Level grid */}
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-4">Levels</p>
        {loading ? (
          <p className="text-sm text-muted font-mono">loading levels...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {levels.map((level) => {
              const s = status[level.id]
              return (
                <button
                  key={level.id}
                  onClick={() => navigate(`/level/${level.id}`)}
                  className={`
                    text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer
                    ${s === 'completed' ? 'border-success/30 bg-surface hover:border-success/60'
                      : s === 'failed' ? 'border-danger/30 bg-surface hover:border-danger/60'
                      : s === 'in-progress' ? 'border-warn/30 bg-surface hover:border-warn/60'
                      : 'border-border bg-surface hover:border-accent/50 hover:bg-accent/5'}
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-mono text-xs text-muted">{level.title}</span>
                    {statusIcon(level.id)}
                  </div>
                  <p className="text-sm font-medium text-white/80 leading-snug">{level.subtitle}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-xs text-muted">{level.variables.length} vars</span>
                    <span className="text-muted/40">·</span>
                    <span className="text-xs text-muted">{level.interventionBudget} interventions</span>
                    {level.observations.length === 0 && (
                      <><span className="text-muted/40">·</span><span className="text-xs text-warn">no obs</span></>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && (
          <div className="flex items-center gap-5 mt-6 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5"><span className="text-success">✓</span> completed</span>
            <span className="flex items-center gap-1.5"><span className="text-danger">✗</span> failed</span>
            <span className="flex items-center gap-1.5"><span className="text-warn">●</span> in progress</span>
          </div>
        )}

        <footer className="mt-10 text-xs text-muted/50 font-mono">
          <button onClick={() => navigate('/admin')} className="hover:text-muted transition-colors cursor-pointer">
            level builder ↗
          </button>
        </footer>
      </div>
    </div>
  )
}