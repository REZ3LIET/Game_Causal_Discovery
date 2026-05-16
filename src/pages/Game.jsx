import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNodesState, useEdgesState } from '@xyflow/react'
import { fetchLevel, fetchAllLevels } from '../levels/index.js'
import { interpretSCM, intervene, checkAnswer } from '../engine/scm'
import GraphEditor from '../components/GraphEditor'
import ObsPanel from '../components/ObsPanel'
import IntPanel from '../components/IntPanel'
import FeedbackOverlay from '../components/FeedbackOverlay'

// Storage: { [levelId]: 'completed' | 'failed' | 'in-progress' }
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
    id: v,
    type: 'causal',
    position: level.nodePositions[v],
    data: { label: v, intervened: false },
    draggable: true,
  }))
}

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
  const [feedback, setFeedback] = useState(null)   // 'correct'|'wrong'|'failed'
  const [showHint, setShowHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)

  useEffect(() => {
    setLoading(true)
    setFeedback(null)
    setLastResult(null)
    setInterventionHistory([])
    setShowHint(false)
    setShowSolution(false)
    setEdges([])
    setSubmitLeft(MAX_SUBMITS)

    Promise.all([fetchLevel(id), fetchAllLevels()]).then(([lvl, all]) => {
      if (!lvl) { setLoading(false); return }
      setLevel(lvl)
      setScmFns(interpretSCM(lvl.scm))
      setTotalLevels(all.length)
      setNodes(buildInitialNodes(lvl))
      setBudgetLeft(lvl.interventionBudget)
      // Mark as in-progress when entering (only if not already completed)
      const status = getAllStatus()
      if (status[lvl.id] !== 'completed') {
        setLevelStatus(lvl.id, 'in-progress')
      }
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
    const submittedEdges = edges.map((e) => [e.source, e.target])
    const correct = checkAnswer(submittedEdges, level.groundTruth)
    const newSubmitLeft = submitLeft - 1
    setSubmitLeft(newSubmitLeft)

    if (correct) {
      setLevelStatus(level.id, 'completed')
      setFeedback('correct')
    } else if (newSubmitLeft === 0) {
      setLevelStatus(level.id, 'failed')
      setFeedback('failed')
      setShowSolution(true)   // auto-show solution on fail
    } else {
      setFeedback('wrong')
    }
  }, [edges, level, submitLeft])

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted font-mono text-sm">
      loading level...
    </div>
  )

  if (!level) return (
    <div className="min-h-screen bg-bg flex items-center justify-center text-muted">
      Level not found.{' '}
      <button onClick={() => navigate('/')} className="ml-2 text-accent underline cursor-pointer">Go home</button>
    </div>
  )

  const gameOver = feedback === 'correct' || feedback === 'failed'

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-muted hover:text-white transition-colors text-sm font-mono cursor-pointer">← back</button>
          <span className="text-white/20">|</span>
          <span className="font-mono text-sm text-white/70">{level.title}</span>
        </div>
        <p className="text-sm text-muted hidden sm:block">{level.subtitle}</p>
        <div className="w-24" />
      </header>

      <div className="flex-1 flex gap-4 p-4 min-h-0">
        <aside className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <ObsPanel observations={level.observations} />
          <IntPanel
            level={level}
            budgetLeft={budgetLeft}
            lastResult={lastResult}
            onIntervene={handleIntervene}
            disabled={gameOver}
          />

          {/* Solution panel — always accessible after fail */}
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
        </aside>

        <div className="flex-1 relative min-h-[500px]">
          <GraphEditor
            level={level}
            interventions={interventionHistory}
            nodes={nodes}
            edges={edges}
            setNodes={setNodes}
            setEdges={setEdges}
          />

          {/* Submit button + counter */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3">
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
                px-6 py-2.5 rounded-xl text-sm font-medium font-mono transition-all duration-200
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