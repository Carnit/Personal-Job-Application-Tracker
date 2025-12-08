import { useEffect, useState } from 'react'
import { analyticsAPI } from '../lib/api'
import type { AnalyticsOverview } from '../lib/api'

type PageType = 'dashboard' | 'applications' | 'detail' | 'analytics' | 'add'

interface DashboardProps {
  onNavigate: (page: PageType, appId?: number) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsAPI.getOverview()
        setAnalytics(data)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error loading dashboard</div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Total Applications',
      value: analytics.total_applications,
      color: 'bg-blue-600',
    },
    {
      label: 'Active Applications',
      value: analytics.active_applications,
      color: 'bg-green-600',
    },
    {
      label: 'Rejection Rate',
      value: `${analytics.rejection_rate}%`,
      color: 'bg-red-600',
    },
    {
      label: 'Interview Rate',
      value: `${analytics.interview_conversion_rate}%`,
      color: 'bg-purple-600',
    },
    {
      label: 'Offers Received',
      value: analytics.offers_received,
      color: 'bg-yellow-600',
    },
    {
      label: 'Avg Response Time',
      value: `${analytics.average_response_time_days} days`,
      color: 'bg-indigo-600',
    },
  ]

  return (
    <div className="w-full space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 mt-2">Welcome to your job application tracker</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-slate-700 bg-slate-800 p-6"
          >
            <div className={`inline-block rounded-lg ${metric.color} p-3 text-white mb-3`}>
              <span className="text-xl font-bold">{metric.value}</span>
            </div>
            <p className="text-slate-400 text-sm">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Applications by Stage */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Applications by Stage</h3>
          <div className="space-y-3">
            {Object.entries(analytics.applications_by_stage).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-slate-300 capitalize">{stage.replace(/_/g, ' ')}</span>
                <span className="font-bold text-blue-400">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Applications by Source</h3>
          <div className="space-y-3">
            {Object.entries(analytics.applications_by_source).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-slate-300 capitalize">{source.replace(/_/g, ' ')}</span>
                <span className="font-bold text-green-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Rejecting Companies */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Rejecting Companies</h3>
        <div className="space-y-2">
          {analytics.top_rejecting_companies.length > 0 ? (
            analytics.top_rejecting_companies.map((item) => (
              <div key={item.company} className="flex items-center justify-between py-2">
                <span className="text-slate-300">{item.company}</span>
                <span className="inline-block bg-red-900 text-red-200 px-2 py-1 rounded text-sm">
                  {item.rejections} rejections
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-400">No rejection data available</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => onNavigate('applications')}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          View All Applications
        </button>
        <button
          onClick={() => onNavigate('analytics')}
          className="rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 transition-colors"
        >
          View Analytics
        </button>
      </div>
    </div>
  )
}
