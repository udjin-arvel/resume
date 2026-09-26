import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { fetchStatsOverview } from './api'

export function AnalyticsOverviewPage() {
  const overviewQuery = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: fetchStatsOverview,
  })

  if (overviewQuery.isLoading) {
    return <p className="muted">Загрузка метрик…</p>
  }

  if (overviewQuery.isError) {
    return <p className="text-danger">Не удалось загрузить обзор аналитики.</p>
  }

  const data = overviewQuery.data
  if (!data) {
    return null
  }

  const funnel = [
    { name: 'Paywall', value: data.paywallShownLast30d },
    { name: 'Покупка', value: data.purchaseSuccessLast30d },
  ]

  const activity = [
    { name: 'DAU', value: data.dau },
    { name: 'WAU', value: data.wau },
    { name: 'MAU', value: data.mau },
  ]

  return (
    <div className="stack">
      <section className="panel">
        <h2>Пользователи и активность</h2>
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Всего пользователей</span>
            <strong className="kpi-value">{data.totalUsers}</strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Premium сейчас</span>
            <strong className="kpi-value">{data.premiumUsers}</strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Доля premium</span>
            <strong className="kpi-value">
              {(data.premiumConversionRate * 100).toFixed(1)}%
            </strong>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Cache hit (продукт)</span>
            <strong className="kpi-value">
              {(data.productCacheHitRate * 100).toFixed(1)}%
            </strong>
          </div>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00796b" name="Пользователи" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2>Сканы по дням (14 дней)</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.scansLast14Days}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" angle={-35} textAnchor="end" height={70} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#26a69a" name="Сканы" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <h2>Воронка подписки (30 дней)</h2>
        <p className="muted">
          Конверсия: {(data.purchaseConversionRate * 100).toFixed(1)}% от показов paywall
        </p>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#00897b" name="События" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
