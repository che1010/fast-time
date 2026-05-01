function formatDuration(ms) {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}m`
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function Log({ sessions, onDelete }) {
  if (sessions.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 32 }}>🍽️</span>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No fasting sessions yet. Start your first fast!</p>
      </div>
    )
  }

  return (
    <div style={styles.list}>
      {sessions.map(s => (
        <div key={s.id} style={styles.row}>
          <div style={styles.badge(s.goalMet)}>
            {s.goalMet ? '✓ Goal met' : '~ Partial'}
          </div>

          <div style={styles.info}>
            <div style={styles.date}>{formatDate(s.start)}</div>
            <div style={styles.times}>
              {formatTime(s.start)} → {formatTime(s.end)}
            </div>
          </div>

          <div style={styles.right}>
            <div style={styles.duration}>{formatDuration(s.durationMs)}</div>
            <div style={styles.goalLabel}>/ {s.goalHours}h goal</div>
          </div>

          <button style={styles.del} onClick={() => onDelete(s.id)} title="Delete session">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

const styles = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    flexWrap: 'wrap',
  },
  badge: (met) => ({
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 999,
    background: met ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
    color: met ? 'var(--green)' : 'var(--yellow)',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  info: {
    flex: 1,
    minWidth: 0,
  },
  date: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  times: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
  right: {
    textAlign: 'right',
    flexShrink: 0,
  },
  duration: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
  },
  goalLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  del: {
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 12,
    padding: '4px 6px',
    borderRadius: 6,
    flexShrink: 0,
    transition: 'color 0.15s, background 0.15s',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '40px 20px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    textAlign: 'center',
  },
}
