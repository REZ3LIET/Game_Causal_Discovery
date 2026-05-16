/**
 * SCM engine — interprets declarative JSON SCM definitions.
 *
 * JSON SCM node schema:
 *   { "parents": [], "pTrue": 0.5 }                          — root node
 *   { "parents": ["A"], "pIfAll": 0.85, "pElse": 0.1 }      — all parents must be 1
 *   { "parents": ["A","B"], "pIfAny": 0.9, "pElse": 0.05 }  — any parent being 1 suffices
 *   { "parents": ["A","B"], "pIfAll": 0.8, "pElse": 0.1 }   — all parents must be 1 (AND gate)
 */

function bernoulli(p) {
  return Math.random() < p ? 1 : 0
}

/**
 * Convert a JSON SCM definition into a map of callable functions.
 */
export function interpretSCM(jsonScm) {
  const fns = {}
  for (const [varName, def] of Object.entries(jsonScm)) {
    fns[varName] = (vals) => {
      if (!def.parents || def.parents.length === 0) {
        return bernoulli(def.pTrue ?? 0.5)
      }
      const allOne = def.parents.every((p) => vals[p] === 1)
      const anyOne = def.parents.some((p) => vals[p] === 1)

      if (def.pIfAny !== undefined) {
        return bernoulli(anyOne ? def.pIfAny : def.pElse)
      }
      return bernoulli(allOne ? def.pIfAll : def.pElse)
    }
  }
  return fns
}

/**
 * Evaluate the full SCM with optional do-interventions.
 */
export function evaluate(scmFns, order, doVals = {}) {
  const result = {}
  for (const v of order) {
    result[v] = doVals[v] !== undefined ? doVals[v] : scmFns[v](result)
  }
  return result
}

/**
 * Run a do(variable=value) intervention.
 * Returns { varName: 'increased' | 'decreased' | 'unchanged' } for all other vars.
 */
export function intervene(scmFns, order, variable, value, sampleSize = 300) {
  const baseline = {}
  const intervened = {}
  for (const v of order) { baseline[v] = 0; intervened[v] = 0 }

  for (let i = 0; i < sampleSize; i++) {
    const obs = evaluate(scmFns, order)
    const intv = evaluate(scmFns, order, { [variable]: value })
    for (const v of order) {
      baseline[v] += obs[v]
      intervened[v] += intv[v]
    }
  }

  const results = {}
  for (const v of order) {
    if (v === variable) continue
    const delta = (intervened[v] - baseline[v]) / sampleSize
    results[v] = Math.abs(delta) < 0.05 ? 'unchanged' : delta > 0 ? 'increased' : 'decreased'
  }
  return results
}

/**
 * Check submitted edges against ground truth.
 */
export function checkAnswer(submitted, groundTruth) {
  const norm = (edges) => new Set(edges.map(([a, b]) => `${a}->${b}`))
  const gt = norm(groundTruth)
  const sub = norm(submitted)
  if (gt.size !== sub.size) return false
  for (const e of gt) if (!sub.has(e)) return false
  return true
}