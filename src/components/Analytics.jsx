import { useMemo } from 'react'
import { ChartPie, BarChart3, TrendingUp, LineChart as LineIcon } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, AreaChart, Area, Legend,
} from 'recharts'
import { useFinance } from '../context/FinanceContext'
import { fmtMoney, fmtMoneyCompact, fmtMonth, monthKey, currentMonthKey } from '../utils/format'
import { EXPENSE_CATEGORIES, categoryById } from '../utils/constants'
import { ChartTooltip, EmptyState } from './ui'

export default function Analytics() {
  const { transactions, trend, monthCategorySpend, thisMonth } = useFinance()

  const trendData = useMemo(() => trend.map((t) => ({ ...t, label: fmtMonth(t.ym) })), [trend])

  const donutData = useMemo(() =>
    EXPENSE_CATEGORIES
      .map((c) => ({ name: c.label, value: Math.round((monthCategorySpend.get(c.id) || 0) * 100) / 100, color: c.color }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [monthCategorySpend])

  // Average spend by weekday (last 90 days)
  const weekdayData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const totals = Array(7).fill(0)
    const counts = Array(7).fill(0)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 90)
    const cutoffISO = cutoff.toISOString().slice(0, 10)
    const seen = new Set()
    for (const t of transactions) {
      if (t.type !== 'expense' || t.date < cutoffISO) continue
      const dow = new Date(t.date + 'T00:00:00').getDay()
      totals[dow] += t.amount
      if (!seen.has(t.date)) { seen.add(t.date); counts[dow]++ }
    }
    return days.map((d, i) => ({
      day: d,
      avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
    }))
  }, [transactions])

  // Per-category trend across last 6 months for the top 4 categories
  const catTrend = useMemo(() => {
    const nowKey = currentMonthKey()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const catTotals = new Map()
    const table = new Map(months.map((m) => [m, {}]))
    for (const t of transactions) {
      if (t.type !== 'expense') continue
      const ym = monthKey(t.date)
      if (!table.has(ym)) continue
      const row = table.get(ym)
      row[t.category] = (row[t.category] || 0) + t.amount
      catTotals.set(t.category, (catTotals.get(t.category) || 0) + t.amount)
    }
    const top = [...catTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id)
    const data = months.map((m) => {
      const row = { label: fmtMonth(m), isCurrent: m === nowKey }
      for (const id of top) row[id] = Math.round(table.get(m)[id] || 0)
      return row
    })
    return { data, top }
  }, [transactions])

  if (transactions.length === 0) {
    return (
      <div className="card">
        <EmptyState
          icon={ChartPie}
          title="No data to analyze"
          sub="Add transactions and this page will fill with charts, trends, and patterns."
        />
      </div>
    )
  }

  return (
    <div className="section-gap">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">Where your money moves — and why.</p>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card card-hover">
          <h2 className="card-title"><ChartPie size={17} /> Expense Breakdown · this month</h2>
          {donutData.length === 0 ? (
            <EmptyState icon={ChartPie} title="No expenses this month" sub="Spending will be broken down by category here." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={2} strokeWidth={0}>
                    {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ textAlign: 'center', marginTop: -140, marginBottom: 106, pointerEvents: 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Total</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 19 }}>{fmtMoney(thisMonth.expense)}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {donutData.map((d) => (
                  <span className="chip" key={d.name}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card card-hover">
          <h2 className="card-title"><TrendingUp size={17} /> Income vs Spending · 12 months</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="aIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-7)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-7)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtMoneyCompact} width={58} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
              <Area type="monotone" dataKey="income" name="Income" stroke="var(--chart-3)" strokeWidth={2} fill="url(#aIncome)" />
              <Area type="monotone" dataKey="expense" name="Spending" stroke="var(--chart-7)" strokeWidth={2} fill="url(#aExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card card-hover">
          <h2 className="card-title"><BarChart3 size={17} /> Net Cash Flow · monthly</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trendData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtMoneyCompact} width={58} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-hover)' }} />
              <Bar dataKey="net" name="Net" radius={[6, 6, 0, 0]} maxBarSize={34}>
                {trendData.map((d) => (
                  <Cell key={d.ym} fill={d.net >= 0 ? 'var(--chart-3)' : 'var(--chart-7)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card card-hover">
          <h2 className="card-title"><BarChart3 size={17} /> Average Spend by Weekday · 90 days</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekdayData} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtMoneyCompact} width={58} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--color-hover)' }} />
              <Bar dataKey="avg" name="Avg daily spend" fill="var(--chart-2)" radius={[6, 6, 0, 0]} maxBarSize={38} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {catTrend.top.length > 0 && (
        <div className="card card-hover">
          <h2 className="card-title"><LineIcon size={17} /> Category Trends · 6 months</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={catTrend.data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} tickFormatter={fmtMoneyCompact} width={58} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13 }} />
              {catTrend.top.map((id) => {
                const cat = categoryById(id)
                return (
                  <Area key={id} type="monotone" dataKey={id} name={cat.label}
                    stroke={cat.color} strokeWidth={2} fill="transparent" />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
