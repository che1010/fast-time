import { useState, useEffect, useRef, useCallback } from 'react'

const SIZE = 260
const STROKE = 14
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function formatRemaining(ms) {
  if (ms <= 0) return 'Goal reached!'
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  return h > 0 ? `${h}h ${pad(m)}m remaining` : `${m}m remaining`
}

export function Timer({ fastStart, goalHours, onStart, onStop, onGoalReached }) {
  const [now, setNow] = useState(Date.now())
  const goalFiredRef = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const isFasting = !!fastStart
  const elapsedMs = isFasting ? now - new Date(fastStart).getTime() : 0
  const goalMs = goalHours * 3600 * 1000
  const progress = isFasting ? Math.min(elapsedMs / goalMs, 1) : 0
  const goalReached = isFasting && elapsedMs >= goalMs
  const remainingMs = goalMs - elapsedMs

  useEffect(() => {
    if (goalReached && !goalFiredRef.current) {
      goalFiredRef.current = true
      onGoalReached?.()
    }
    if (!isFasting) {
      goalFiredRef.current = false
    }
  }, [goalReached, isFasting, onGoalReached])

  const dashOffset = CIRC * (1 - progress)

  const ringColor = goalReached
    ? 'var(--green)'
    : isFasting
    ? 'var(--accent2)'
    : 'var(--border)'

  const statusLabel = !isFasting
    ? 'Not fasting'
    : goalReached
    ? 'Goal reached!'
    : 'Fasting...'

  return (
    <div style={styles.wrap}>
      <div style={styles.ringWrap}>
        <svg width={SIZE} height={SIZE} style={{ display: 'block' }}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease' }}
          />
        </svg>

        <div style={styles.center}>
          <div style={{ ...styles.elapsed, color: goalReached ? 'var(--green)' : 'var(--text)' }}>
            {formatElapsed(elapsedMs)}
          </div>
          <div style={styles.goal}>/ {goalHours}h goal</div>
          {isFasting && (
            <div style={{ ...styles.remaining, color: goalReached ? 'var(--green)' : 'var(--text-muted)' }}>
              {formatRemaining(remainingMs)}
            </div>
          )}
        </div>
      </div>

      <div style={styles.statusBadge(isFasting, goalReached)}>
        <span style={styles.dot(isFasting, goalReached)} />
        {statusLabel}
      </div>

      <button
        style={styles.btn(isFasting)}
        onClick={isFasting ? onStop : onStart}
      >
        {isFasting ? 'Stop Fast' : 'Start Fast'}
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  ringWrap: {
    position: 'relative',
    width: SIZE,
    height: SIZE,
  },
  center: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  elapsed: {
    fontSize: 42,
    fontWeight: 700,
    letterSpacing: '-1px',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  goal: {
    fontSize: 14,
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  remaining: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: (fasting, reached) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 16px',
    borderRadius: 999,
    background: 'var(--surface2)',
    color: reached ? 'var(--green)' : fasting ? 'var(--accent2)' : 'var(--text-muted)',
  }),
  dot: (fasting, reached) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: reached ? 'var(--green)' : fasting ? 'var(--accent2)' : 'var(--text-muted)',
    boxShadow: fasting ? `0 0 8px ${reached ? 'var(--green)' : 'var(--accent2)'}` : 'none',
  }),
  btn: (fasting) => ({
    padding: '14px 48px',
    borderRadius: 999,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '0.3px',
    background: fasting
      ? 'linear-gradient(135deg, #f87171, #ef4444)'
      : 'linear-gradient(135deg, #7c6af7, #a78bfa)',
    color: '#fff',
    boxShadow: fasting
      ? '0 4px 20px rgba(248,113,113,0.35)'
      : '0 4px 20px rgba(124,106,247,0.35)',
    transition: 'transform 0.1s, box-shadow 0.2s',
  }),
}
