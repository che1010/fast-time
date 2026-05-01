import { useCallback, useEffect, useRef, useState } from 'react'
import { useFastStore } from './hooks/useFastStore'
import { Timer } from './components/Timer'
import { Calendar } from './components/Calendar'
import { Log } from './components/Log'
import { Settings } from './components/Settings'
import './App.css'

function requestNotifPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

function fireNotification(goalHours) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  new Notification('Fast complete! 🎉', {
    body: `You've reached your ${goalHours}-hour fasting goal. Great work!`,
    icon: '/vite.svg',
  })
}

const TABS = ['Timer', 'Calendar', 'Log']

export default function App() {
  const store = useFastStore()
  const [tab, setTab] = useState('Timer')
  const notifiedRef = useRef(false)

  useEffect(() => {
    requestNotifPermission()
  }, [])

  // Reset notification flag when fast starts/stops
  useEffect(() => {
    notifiedRef.current = false
  }, [store.fastStart])

  const handleGoalReached = useCallback(() => {
    if (notifiedRef.current) return
    notifiedRef.current = true
    fireNotification(store.goalHours)
  }, [store.goalHours])

  const stats = calcStats(store.sessions)

  if (store.authError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, padding: '0 24px', textAlign: 'center' }}>
        <span style={{ fontSize: 36 }}>🔥</span>
        <p style={{ color: 'var(--red)', fontSize: 15, fontWeight: 600 }}>Firebase setup required</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 420, lineHeight: 1.6 }}>{store.authError}</p>
      </div>
    )
  }

  if (store.loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <div style={spinnerStyle} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Connecting to Firebase…</p>
      </div>
    )
  }

  return (
    <div style={layout.app}>
      {/* Header */}
      <header style={layout.header}>
        <div style={layout.brand}>
          <span style={layout.brandIcon}>⏱</span>
          <span style={layout.brandName}>FastTime</span>
        </div>
        <nav style={layout.nav}>
          {TABS.map(t => (
            <button
              key={t}
              style={layout.tab(tab === t)}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      {/* Stats bar */}
      <div style={layout.statsBar}>
        <Stat label="Total fasts" value={stats.total} />
        <Stat label="Goals met" value={stats.goalsMet} />
        <Stat label="Best streak" value={`${stats.bestStreak}d`} />
        <Stat label="Total fasted" value={formatTotalHours(stats.totalMs)} />
      </div>

      {/* Main content */}
      <main style={layout.main}>
        {tab === 'Timer' && (
          <div style={layout.timerLayout}>
            <div style={layout.timerCard}>
              <Timer
                fastStart={store.fastStart}
                goalHours={store.goalHours}
                onStart={store.startFast}
                onStop={store.stopFast}
                onGoalReached={handleGoalReached}
              />
            </div>
            <div style={layout.sideCard}>
              <SectionTitle>Goal Settings</SectionTitle>
              <Settings
                goalHours={store.goalHours}
                onSave={store.setGoalHours}
                disabled={!!store.fastStart}
              />
              {store.fastStart && (
                <div style={layout.startedNote}>
                  Fast started {formatTimeAgo(store.fastStart)}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Calendar' && (
          <div>
            <SectionTitle style={{ marginBottom: 16 }}>Fasting Calendar</SectionTitle>
            <Calendar sessions={store.sessions} fastStart={store.fastStart} />
          </div>
        )}

        {tab === 'Log' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <SectionTitle>Session Log</SectionTitle>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {store.sessions.length} session{store.sessions.length !== 1 ? 's' : ''}
              </span>
            </div>
            <Log sessions={store.sessions} onDelete={store.deleteSession} />
          </div>
        )}
      </main>
    </div>
  )
}

function SectionTitle({ children, style }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, ...style }}>
      {children}
    </h2>
  )
}

function Stat({ label, value }) {
  return (
    <div style={layout.stat}>
      <div style={layout.statValue}>{value}</div>
      <div style={layout.statLabel}>{label}</div>
    </div>
  )
}

function calcStats(sessions) {
  const total = sessions.length
  const goalsMet = sessions.filter(s => s.goalMet).length
  const totalMs = sessions.reduce((acc, s) => acc + s.durationMs, 0)

  // Best streak: consecutive calendar days with at least one fast
  const days = [...new Set(sessions.map(s => s.start.slice(0, 10)))].sort()
  let best = 0, cur = 0, prev = null
  for (const d of days) {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000
      cur = diff === 1 ? cur + 1 : 1
    } else {
      cur = 1
    }
    best = Math.max(best, cur)
    prev = d
  }

  return { total, goalsMet, totalMs, bestStreak: best }
}

function formatTotalHours(ms) {
  const h = Math.floor(ms / 3600000)
  if (h < 1) return '<1h'
  return `${h}h`
}

function formatTimeAgo(isoStr) {
  const ms = Date.now() - new Date(isoStr).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m ago`
  return `${m}m ago`
}

const layout = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    fontSize: 24,
    lineHeight: 1,
  },
  brandName: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  nav: {
    display: 'flex',
    gap: 4,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: 4,
  },
  tab: (active) => ({
    padding: '7px 18px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'background 0.15s, color 0.15s',
  }),
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  stat: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text-muted)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: 500,
  },
  main: {
    minHeight: 400,
  },
  timerLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: 20,
    alignItems: 'start',
  },
  timerCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
  },
  sideCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  startedNote: {
    fontSize: 12,
    color: 'var(--text-muted)',
    textAlign: 'center',
    padding: '10px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
}

const spinnerStyle = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: '3px solid var(--border)',
  borderTopColor: 'var(--accent)',
  animation: 'spin 0.8s linear infinite',
}
