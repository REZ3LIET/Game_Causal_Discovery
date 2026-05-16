import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNodesState, useEdgesState } from '@xyflow/react'
import { fetchLevel, fetchAllLevels } from '../levels/index.js'
import { interpretSCM, intervene, checkAnswer } from '../engine/scm'
import GraphEditor from '../components/GraphEditor'
import ObsPanel from '../components/ObsPanel'
import IntPanel from '../components/IntPanel'
import FeedbackOverlay from '../components/FeedbackOverlay'

const STATUS_KEY = 'causal_status'
const MAX_SUBMITS = 5

function getAllStatus() {
  try { return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}') } catch { return {} }
}
function setLevelStatus(id, status) {
  try {
    const all = getAllStatus()
    all[id] = status
    localStorage.setItem(STATUS_KEY, JSON.stringify(all))
  } catch {}
}

function buildInitialNodes(level) {
  return level.variables.map((v) => ({
    id: v, type: 'causal',
    position: level.nodePositions[v],
    data: { label: v, intervened: false },
    draggable: true,
  }))
}

const INSTRUCTIONS = [
  { icon: '①', text: 'Read the observations on the left to form a hypothesis about the causal structure.' },
  { icon: '②', text: 'Use interventions (do-calculus) to test your hypothesis — set a variable and observe what changes.' },
  { icon: '③', text: 'Click a node to start an edge, then click a second node to draw a directed arrow A → B.' },
  { icon: '④', text: 'Hover an edge and click ✕ to delete it. Drag nodes to rearrange.' },
  { icon: '⑤', text: 'When confident, submit your graph. Wrong submissions cost one attempt (5 total).' },
]

export default function Game() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [level, setLevel] = useState(null)
  const [scmFns, setScmFns] = useState(null)
  const [totalLevels, setTotalLevels] = useState(0)
  const [loading, setLoading] = useState(true)

  const [nodes, setNodes] = useNodesState([])
  const [edges, setEdges] = useEdgesState([])

  const [budgetLeft, setBudgetLeft] = useState(0)
  const [submitLeft, setSubmitLeft] = useState(MAX_SUBMITS)

  const [interventionHistory, setInterventionHistory] = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  // Mobile sidebar — open by default on mobile, closed on desktop
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    setLoading(true); setFeedback(null); setLastResult(null)
    setInterventionHistory([]); setShowHint(false); setShowSolution(false)
    setEdges([]); setSubmitLeft(MAX_SUBMITS); setSidebarOpen(window.innerWidth < 768)

    Promise.all([fetchLevel(id), fetchAllLevels()]).then(([lvl, all]) => {
      if (!lvl) { setLoading(false); return }
      setLevel(lvl); setScmFns(interpretSCM(lvl.scm))
      setTotalLevels(all.length); setNodes(buildInitialNodes(lvl))
      setBudgetLeft(lvl.interventionBudget)
      const s = getAllStatus()
      if (s[lvl.id] !== 'completed') setLevelStatus(lvl.id, 'in-progress')
      setLoading(false)
    })
  }, [id])

  const handleIntervene = useCallback((variable, value) => {
    if (budgetLeft <= 0 || !scmFns) return
    const outcomes = intervene(scmFns, level.order, variable, value)
    setLastResult({ variable, value, outcomes })
    setInterventionHistory((h) => [...h, { variable, value, outcomes }])
    setBudgetLeft((b) => b - 1)
  }, [budgetLeft, scmFns, level])

  const handleSubmit = useCallback(() => {
    if (submitLeft <= 0) return
    const correct = checkAnswer(edges.map((e) => [e.source, e.target]), level.groundTruth)
    const newLeft = submitLeft - 1
    setSubmitLeft(newLeft)
    if (correct) { setLevelStatus(level.id, 'completed'); setFeedback('correct') }
    else if (newLeft === 0) { setLevelStatus(level.id, 'failed'); setFeedback('failed'); setShowSolution(true) }
    else setFeedback('wrong')
  }, [edges, level, submitLeft])

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted font-mono text-sm">loading level...</div>
  )
  if (!level) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted">
      Level not found. <button onClick={() => navigate('/')} className="ml-2 text-accent underline cursor-pointer">Go home</button>
    </div>
  )

  const gameOver = feedback === 'correct' || feedback === 'failed'

  const sidebar = (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pb-4">

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-muted mb-3">How to play</p>
        <div className="space-y-2">
          {INSTRUCTIONS.map((ins) => (
            <div key={ins.icon} className="flex gap-2 text-xs text-white/60 leading-relaxed">
              <span className="text-accent font-mono flex-shrink-0">{ins.icon}</span>
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>

      <ObsPanel observations={level.observations} />

      <IntPanel
        level={level}
        budgetLeft={budgetLeft}
        lastResult={lastResult}
        onIntervene={handleIntervene}
        disabled={gameOver}
      />

      {/* Solution */}
      {(feedback === 'failed' || showSolution) && (
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-danger mb-3">Solution</p>
          <div className="space-y-1.5">
            {level.groundTruth.map(([from, to]) => (
              <div key={`${from}-${to}`} className="flex items-center gap-2 font-mono text-sm">
                <span className="text-white/70">{from}</span>
                <span className="text-accent">→</span>
                <span className="text-white/70">{to}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint */}
      {level.hint && !gameOver && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <button
            onClick={() => setShowHint((s) => !s)}
            className="text-xs font-mono uppercase tracking-widest text-muted hover:text-white transition-colors w-full text-left cursor-pointer"
          >
            {showHint ? 'hide hint ↑' : 'show hint ↓'}
          </button>
          {showHint && <p className="text-sm text-white/60 mt-2 leading-relaxed">{level.hint}</p>}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted hover:text-white transition-colors text-sm font-mono cursor-pointer">← back</button>
          <span className="text-white/20">|</span>
          <span className="font-mono text-sm text-white/70">{level.title}</span>
        </div>
        <p className="text-sm text-muted hidden md:block truncate mx-4">{level.subtitle}</p>
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="md:hidden text-xs font-mono px-3 py-1.5 rounded-lg border border-border text-muted hover:text-white transition-colors cursor-pointer"
        >
          {sidebarOpen ? 'hide panel ✕' : 'panel ☰'}
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Sidebar — desktop: always visible, mobile: drawer overlay */}
        <>
          {/* Desktop sidebar */}
          <aside className="hidden md:flex flex-col w-72 flex-shrink-0 p-3 border-r border-border overflow-y-auto">
            {sidebar}
          </aside>

          {/* Mobile drawer — fixed to viewport so overflow-hidden doesn't clip it */}
          {sidebarOpen && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
              {/* Panel */}
              <aside className="relative z-50 w-80 max-w-[90vw] bg-bg border-r border-border p-3 overflow-y-auto h-full flex flex-col gap-3">
                {sidebar}
              </aside>
            </div>
          )}
        </>

        {/* Graph canvas */}
        <div className="flex-1 relative p-3 min-h-0 pb-20 md:pb-3" style={{ minHeight: 0 }}>
          <div className="w-full h-full" style={{ minHeight: '400px' }}>
            <GraphEditor
              level={level}
              interventions={interventionHistory}
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
            />
          </div>

          {/* Submit row — fixed on mobile to stay above nav tray, absolute on desktop */}
          <div className="
            fixed bottom-0 left-0 right-0 z-30
            md:absolute md:bottom-6 md:right-6 md:left-auto
            flex items-center justify-end gap-3
            md:bg-transparent md:border-0 md:p-0
            bg-bg/95 border-t border-border px-4 py-3
            safe-area-inset-bottom
          " style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <span className={`text-xs font-mono px-2 py-1 rounded-full border ${
              submitLeft <= 1 ? 'text-danger border-danger/40 bg-danger/10'
              : submitLeft <= 2 ? 'text-warn border-warn/40 bg-warn/10'
              : 'text-muted border-border'
            }`}>
              {submitLeft} submit{submitLeft !== 1 ? 's' : ''} left
            </span>
            <button
              onClick={handleSubmit}
              disabled={edges.length === 0 || gameOver || submitLeft === 0}
              className={`
                px-5 py-2 rounded-xl text-sm font-medium font-mono transition-all duration-200
                ${edges.length > 0 && !gameOver && submitLeft > 0
                  ? 'bg-accent text-white hover:bg-accent/80 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(124,106,247,0.4)]'
                  : 'bg-surface border border-border text-muted cursor-not-allowed opacity-50'
                }
              `}
            >
              submit graph →
            </button>
          </div>

          {feedback && (
            <FeedbackOverlay
              type={feedback}
              onDismiss={() => setFeedback(null)}
              nextLevelId={level.id + 1}
              totalLevels={totalLevels}
              groundTruth={level.groundTruth}
            />
          )}
        </div>
      </div>
    </div>
  )
}