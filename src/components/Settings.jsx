import { useState } from 'react'

const PRESETS = [12, 14, 16, 18, 20, 24]

export function Settings({ goalHours, onSave, disabled }) {
  const [value, setValue] = useState(String(goalHours))
  const [saved, setSaved] = useState(false)

  function handleSave() {
    const n = parseFloat(value)
    if (!n || n < 1 || n > 72) return
    onSave(n)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.label}>Fasting goal (hours)</div>

      <div style={styles.presets}>
        {PRESETS.map(p => (
          <button
            key={p}
            style={styles.preset(goalHours === p)}
            onClick={() => { setValue(String(p)); onSave(p) }}
            disabled={disabled}
          >
            {p}h
          </button>
        ))}
      </div>

      <div style={styles.custom}>
        <input
          type="number"
          min={1}
          max={72}
          step={0.5}
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={styles.input}
          disabled={disabled}
        />
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>hours</span>
        <button style={styles.saveBtn} onClick={handleSave} disabled={disabled}>
          {saved ? '✓ Saved' : 'Set'}
        </button>
      </div>

      {disabled && (
        <p style={styles.note}>Stop the current fast to change the goal.</p>
      )}
    </div>
  )
}

const styles = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
  },
  presets: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  preset: (active) => ({
    padding: '6px 14px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: active ? 'var(--accent)' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--text-muted)',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    transition: 'background 0.15s, color 0.15s',
  }),
  custom: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    width: 72,
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  saveBtn: {
    padding: '7px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    background: 'var(--surface2)',
    color: 'var(--accent2)',
    border: '1px solid var(--border)',
  },
  note: {
    fontSize: 12,
    color: 'var(--yellow)',
    margin: 0,
  },
}
