import { useNavigate } from 'react-router-dom'

export default function FeedbackOverlay({ type, onDismiss, nextLevelId, totalLevels, groundTruth }) {
  const navigate = useNavigate()

  if (!type) return null

  const isCorrect = type === 'correct'
  const isFailed = type === 'failed'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm rounded-xl">
      <div className="bg-surface border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4 shadow-2xl">

        {isCorrect && (
          <>
            <div className="text-4xl">✦</div>
            <h2 className="text-lg font-medium text-white">Correct graph!</h2>
            <p className="text-sm text-muted">You identified the causal structure.</p>
            <div className="flex gap-3 pt-2">
              {nextLevelId && nextLevelId <= totalLevels ? (
                <button
                  onClick={() => navigate(`/level/${nextLevelId}`)}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  Next level →
                </button>
              ) : (
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent/80 transition-colors cursor-pointer"
                >
                  Back to levels
                </button>
              )}
              <button
                onClick={onDismiss}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-white hover:border-white/20 transition-colors cursor-pointer"
              >
                Review
              </button>
            </div>
          </>
        )}

        {isFailed && (
          <>
            <div className="text-4xl">✗</div>
            <h2 className="text-lg font-medium text-white">Out of attempts</h2>
            <p className="text-sm text-muted">You've used all your interventions without finding the correct graph.</p>

            {/* Solution */}
            <div className="text-left bg-bg rounded-xl border border-border p-3 space-y-1.5">
              <p className="text-xs font-mono uppercase tracking-widest text-muted mb-2">Solution</p>
              {groundTruth.map(([from, to]) => (
                <div key={`${from}-${to}`} className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-white/70">{from}</span>
                  <span className="text-accent">→</span>
                  <span className="text-white/70">{to}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-2.5 rounded-xl bg-surface border border-border text-sm text-muted hover:text-white hover:border-white/20 transition-colors cursor-pointer"
              >
                Back to levels
              </button>
              {nextLevelId && nextLevelId <= totalLevels && (
                <button
                  onClick={() => navigate(`/level/${nextLevelId}`)}
                  className="flex-1 py-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent text-sm hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  Next level →
                </button>
              )}
            </div>
          </>
        )}

        {!isCorrect && !isFailed && (
          <>
            <div className="text-4xl">✗</div>
            <h2 className="text-lg font-medium text-white">Not quite</h2>
            <p className="text-sm text-muted">The graph doesn't match. Try again — you lost one intervention attempt.</p>
            <button
              onClick={onDismiss}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted hover:text-white hover:border-white/20 transition-colors cursor-pointer"
            >
              Keep trying
            </button>
          </>
        )}

      </div>
    </div>
  )
}