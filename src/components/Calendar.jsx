import { useState, useMemo } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function toDateKey(isoStr) {
  return isoStr.slice(0, 10) // YYYY-MM-DD
}

export function Calendar({ sessions, fastStart }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // Build a map: dateKey -> { goalMet, count }
  const dayMap = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      const key = toDateKey(s.start)
      if (!map[key]) map[key] = { goalMet: false, count: 0 }
      map[key].count++
      if (s.goalMet) map[key].goalMet = true
    }
    // Mark today if currently fasting
    if (fastStart) {
      const key = toDateKey(fastStart)
      if (!map[key]) map[key] = { goalMet: false, count: 0 }
      map[key].active = true
    }
    return map
  }, [sessions, fastStart])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toDateKey(today.toISOString())

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <button style={styles.navBtn} onClick={prevMonth}>‹</button>
        <span style={styles.monthLabel}>{MONTHS[month]} {year}</span>
        <button style={styles.navBtn} onClick={nextMonth}>›</button>
      </div>

      <div style={styles.grid}>
        {DAYS.map(d => (
          <div key={d} style={styles.dayHeader}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const info = dayMap[key]
          const isToday = key === todayKey
          return (
            <div
              key={key}
              title={info ? `${info.count} fast session(s)${info.goalMet ? ' — goal met' : ''}` : undefined}
              style={styles.cell(isToday, info)}
            >
              <span style={styles.dayNum(isToday)}>{day}</span>
              {info && <span style={styles.dot(info)} />}
            </div>
          )
        })}
      </div>

      <div style={styles.legend}>
        <LegendItem color="var(--green)" label="Goal met" />
        <LegendItem color="var(--yellow)" label="Partial fast" />
        <LegendItem color="var(--accent2)" label="Active fast" />
      </div>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--surface)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    padding: 20,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text)',
  },
  navBtn: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: 4,
  },
  dayHeader: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textAlign: 'center',
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cell: (isToday, info) => ({
    aspectRatio: '1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 2,
    background: isToday ? 'var(--surface2)' : 'transparent',
    border: isToday ? '1px solid var(--accent)' : '1px solid transparent',
    cursor: info ? 'default' : 'default',
  }),
  dayNum: (isToday) => ({
    fontSize: 13,
    fontWeight: isToday ? 700 : 400,
    color: isToday ? 'var(--accent2)' : 'var(--text)',
    lineHeight: 1,
  }),
  dot: (info) => ({
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: info.active
      ? 'var(--accent2)'
      : info.goalMet
      ? 'var(--green)'
      : 'var(--yellow)',
  }),
  legend: {
    display: 'flex',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
}
