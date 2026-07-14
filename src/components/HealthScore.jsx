import { useFinance } from '../context/FinanceContext'
import { HeartPulse } from 'lucide-react'

const TONE_COLOR = {
  good: 'var(--color-success)',
  warn: 'var(--color-warning)',
  bad: 'var(--color-danger)',
}

export default function HealthScore() {
  const { healthScore } = useFinance()
  const { score, grade, tone, summary, breakdown, weakest, hasData } = healthScore

  const color = TONE_COLOR[tone] || 'var(--color-gold)'
  const R = 52
  const C = 2 * Math.PI * R
  const dash = hasData ? (score / 100) * C : 0

  return (
    <div className="card health-card">
      <div className="health-head">
        <span className="health-eyebrow"><HeartPulse size={15} /> Financial Health</span>
      </div>

      <div className="health-body">
        <div className="health-gauge" aria-label={`Financial health score ${score} out of 100`}>
          <svg viewBox="0 0 128 128" width="128" height="128">
            <circle cx="64" cy="64" r={R} fill="none" stroke="var(--color-border)" strokeWidth="10" />
            <circle
              cx="64" cy="64" r={R} fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={`${dash} ${C}`}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.16,1,0.3,1)' }}
            />
          </svg>
          <div className="health-gauge-center">
            <span className="health-number">{hasData ? score : '—'}</span>
            <span className="health-grade" style={{ color }}>{hasData ? grade : 'No data'}</span>
          </div>
        </div>

        <div className="health-detail">
          <p className="health-summary">{hasData ? summary : 'Add transactions to generate your score.'}</p>
          {hasData && breakdown.map((b) => (
            <div className="health-row" key={b.label}>
              <span className="health-row-label">{b.label}</span>
              <div className="health-row-track">
                <div className="health-row-fill" style={{ width: `${b.pct}%`, background: color }} />
              </div>
              <span className="health-row-val">{b.earned}/{b.weight}</span>
            </div>
          ))}
        </div>
      </div>

      {hasData && weakest && weakest.pct < 100 && (
        <div className="health-tip">
          <strong>Biggest opportunity:</strong> improve your {weakest.label.toLowerCase()} ({weakest.pct}%).
        </div>
      )}
    </div>
  )
}
