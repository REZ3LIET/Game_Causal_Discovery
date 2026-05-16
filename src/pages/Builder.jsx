import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const VARIABLE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function buildEdgeKey(from, to) {
  return `${from}->${to}`
}

export default function Builder() {
  const navigate = useNavigate()

  const [numVars, setNumVars] = useState(3)
  const [edges, setEdges] = useState(new Set())
  const [observations, setObservations] = useState([''])
  const [budget, setBudget] = useState(4)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [hint, setHint] = useState('')
  const [copied, setCopied] = useState(false)

  const variables = VARIABLE_LETTERS.slice(0, numVars)

  function toggleEdge(from, to) {
    if (from === to) return
    const key = buildEdgeKey(from, to)
    setEdges((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function addObs() {
    setObservations((o) => [...o, ''])
  }

  function setObs(i, val) {
    setObservations((o) => o.map((v, idx) => (idx === i ? val : v)))
  }

  function removeObs(i) {
    setObservations((o) => o.filter((_, idx) => idx !== i))
  }

  function generateCode() {
    const edgeList = [...edges].map((e) => {
      const [from, to] = e.split('->')
      return [from, to]
    })

    const scm = {}
    variables.forEach((v, i) => {
      const parents = [...edges]
        .filter((e) => e.endsWith(`->${v}`))
        .map((e) => e.split('->')[0])
      if (parents.length === 0) {
        scm[v] = { parents: [], pTrue: 0.5 }
      } else if (parents.length === 1) {
        scm[v] = { parents, pIfAll: 0.85, pElse: 0.1 }
      } else {
        scm[v] = { parents, pIfAny: 0.9, pElse: 0.05 }
      }
    })

    const positions = {}
    variables.forEach((v, i) => {
      positions[v] = {
        x: numVars === 2 ? 220 : i % 2 === 0 ? 80 : 360,
        y: 80 + Math.floor(i / 2) * 180,
      }
    })

    const level = {
      id: 'N',
      title: title || 'Level N',
      subtitle: subtitle || 'Your subtitle here.',
      variables,
      order: variables,
      observations: observations.filter((o) => o.trim()),
      interventionBudget: budget,
      scm,
      groundTruth: edgeList,
      hint: hint || null,
      nodePositions: positions,
    }

    return JSON.stringify(level, null, 2)
  }

  function handleCopy() {
    navigator.clipboard.writeText(generateCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-border">
        <button onClick={() => navigate('/')} className="text-muted hover:text-white text-sm font-mono cursor-pointer">
          ← back
        </button>
        <h1 className="font-mono text-lg font-medium">Level Builder</h1>
      </header>

      <div className="flex gap-6 p-8 max-w-5xl">

        {/* Left: controls */}
        <div className="w-80 flex-shrink-0 space-y-5">

          {/* Meta */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Meta</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Level title (e.g. Level 6)"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle / description"
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </section>

          {/* Variables */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Variables</p>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">Count:</span>
              {[2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => { setNumVars(n); setEdges(new Set()) }}
                  className={`w-8 h-8 rounded-lg text-sm font-mono border transition-all cursor-pointer ${
                    numVars === n
                      ? 'bg-accent border-accent text-white'
                      : 'border-border text-muted hover:border-accent/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          {/* Edges — adjacency grid */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Edges (from → to)</p>
            <div className="bg-surface rounded-xl border border-border p-3">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <td className="text-muted text-xs pb-2 font-mono">from ↓ / to →</td>
                    {variables.map((v) => (
                      <td key={v} className="text-center text-muted text-xs pb-2 font-mono">{v}</td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variables.map((from) => (
                    <tr key={from}>
                      <td className="text-muted text-xs font-mono pr-2">{from}</td>
                      {variables.map((to) => (
                        <td key={to} className="text-center py-1">
                          {from === to ? (
                            <span className="text-muted/20">·</span>
                          ) : (
                            <button
                              onClick={() => toggleEdge(from, to)}
                              className={`w-6 h-6 rounded-md border text-xs transition-all cursor-pointer ${
                                edges.has(buildEdgeKey(from, to))
                                  ? 'bg-accent border-accent text-white'
                                  : 'border-border text-muted hover:border-accent/50'
                              }`}
                            >
                              {edges.has(buildEdgeKey(from, to)) ? '✓' : ''}
                            </button>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Observations */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Observations</p>
            <div className="space-y-2">
              {observations.map((obs, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={obs}
                    onChange={(e) => setObs(i, e.target.value)}
                    placeholder={`Observation ${i + 1}`}
                    className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={() => removeObs(i)}
                    className="text-muted hover:text-danger text-xs px-2 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addObs}
                className="text-xs text-accent font-mono hover:underline cursor-pointer"
              >
                + add observation
              </button>
            </div>
          </section>

          {/* Budget */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Intervention budget</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                min={1}
                max={20}
                className="w-20 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-accent"
              />
              <span className="text-sm text-muted">attempts</span>
            </div>
          </section>

          {/* Hint */}
          <section className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Hint (optional)</p>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="A hint shown on demand..."
              rows={2}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent resize-none"
            />
          </section>
        </div>

        {/* Right: generated code */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-muted">Generated level code</p>
            <button
              onClick={handleCopy}
              className="text-xs font-mono text-accent hover:underline cursor-pointer"
            >
              {copied ? '✓ copied!' : 'copy →'}
            </button>
          </div>
          <pre className="bg-surface border border-border rounded-xl p-4 text-xs font-mono text-white/80 overflow-auto max-h-[70vh] leading-relaxed whitespace-pre-wrap">
            {generateCode()}
          </pre>
          <p className="text-xs text-muted">
            Save as <code className="text-accent">public/levels/levelN.json</code>, set the correct <code className="text-accent">id</code>, adjust SCM probabilities if needed, then add an entry to <code className="text-accent">public/levels/index.json</code>.
          </p>
        </div>
      </div>
    </div>
  )
}