import { useEffect, useState } from 'react'
import { analyticsAPI } from '../lib/api'
import type { AnalyticsOverview, RejectionAnalysis, TimeSeriesData } from '../lib/api'

export default function Analytics() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [rejectionAnalysis, setRejectionAnalysis] = useState<RejectionAnalysis | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const [overviewData, rejectionData, timeSeriesData] = await Promise.all([
          analyticsAPI.getOverview(),
          analyticsAPI.getRejectionAnalysis(),
          analyticsAPI.getTimeSeries(90),
        ])

        setOverview(overviewData)
        setRejectionAnalysis(rejectionData)
        setTimeSeries(timeSeriesData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return <div className="text-white text-center">Loading analytics...</div>
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-white">Analytics Dashboard</h2>
        <p className="text-slate-400 mt-2">Comprehensive insights into your job search pipeline</p>
      </div>

      {/* Key Metrics Grid */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Total Applications"
            value={overview.total_applications}
            change="+12%"
            color="blue"
          />
          <MetricCard
            label="Active Applications"
            value={overview.active_applications}
            change="+8%"
            color="green"
          />
          <MetricCard
            label="Rejection Rate"
            value={`${overview.rejection_rate}%`}
            change="-3%"
            color="red"
          />
          <MetricCard
            label="Interview Rate"
            value={`${overview.interview_conversion_rate}%`}
            change="+15%"
            color="purple"
          />
          <MetricCard
            label="Offers"
            value={overview.offers_received}
            change="+100%"
            color="yellow"
          />
          <MetricCard
            label="Avg Response"
            value={`${overview.average_response_time_days} days`}
            change="-2 days"
            color="indigo"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Applications by Stage */}
        {overview && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Applications by Stage</h3>
            <div className="space-y-3">
              {Object.entries(overview.applications_by_stage).map(([stage, count]) => (
                <div key={stage}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm capitalize">
                      {stage.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          ((count as number) /
                            (Math.max(
                              ...Object.values(overview.applications_by_stage as Record<string, number>)
                            ) || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications by Source */}
        {overview && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Applications by Source</h3>
            <div className="space-y-3">
              {Object.entries(overview.applications_by_source).map(([source, count]) => (
                <div key={source}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-300 text-sm capitalize">
                      {source.replace(/_/g, ' ')}
                    </span>
                    <span className="text-white font-semibold">{count}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          ((count as number) /
                            (Math.max(
                              ...Object.values(overview.applications_by_source as Record<string, number>)
                            ) || 1)) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection Analysis */}
      {rejectionAnalysis && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Rejections by Stage</h3>
            <div className="space-y-2">
              {Object.entries(rejectionAnalysis.rejections_by_stage).map(([stage, count]) => (
                <div key={stage} className="flex justify-between text-slate-300">
                  <span className="capitalize">{stage.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-red-400">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Rejecting Companies</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(rejectionAnalysis.rejections_by_company)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 10)
                .map(([company, count]) => (
                  <div key={company} className="flex justify-between text-slate-300">
                    <span>{company}</span>
                    <span className="font-semibold text-red-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Series Chart (Simple representation) */}
      {timeSeries && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Applications Over Time (Last 90 Days)</h3>
          <div className="space-y-4">
            <div className="h-64 flex items-end gap-1 px-2 py-4 bg-slate-700/30 rounded">
              {timeSeries.data.map((point, idx) => {
                const maxApps = Math.max(...timeSeries.data.map((p) => p.applications))
                const height = maxApps > 0 ? (point.applications / maxApps) * 100 : 0

                return (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 rounded-t transition-colors"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${point.date}: ${point.applications} applications, ${point.rejections} rejections`}
                  ></div>
                )
              })}
            </div>
            <div className="flex justify-between text-sm text-slate-400">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      {rejectionAnalysis && overview && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-slate-300 text-sm">Total Rejections</p>
              <p className="text-2xl font-bold text-red-400">
                {rejectionAnalysis.total_rejections}
              </p>
            </div>
            <div>
              <p className="text-slate-300 text-sm">Rejection Rate (30d)</p>
              <p className="text-2xl font-bold text-orange-400">
                {rejectionAnalysis.rejection_rate}%
              </p>
            </div>
            <div>
              <p className="text-slate-300 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-400">
                {(100 - (overview.rejection_rate || 0)).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-slate-300 text-sm">Interview Rate</p>
              <p className="text-2xl font-bold text-purple-400">
                {overview.interview_conversion_rate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Insights & Recommendations</h3>
        <ul className="space-y-2 text-slate-300">
          <li className="flex gap-2">
            <span className="text-blue-400">•</span>
            <span>Focus on application sources with higher success rates</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-400">•</span>
            <span>Follow up on applications within 1-2 weeks for better results</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400">•</span>
            <span>Consider refining your resume for stages with high rejection rates</span>
          </li>
          <li className="flex gap-2">
            <span className="text-purple-400">•</span>
            <span>Track which companies have better success rates and focus on similar ones</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  change: string
  color: string
}

function MetricCard({ label, value, change, color }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-600',
    indigo: 'bg-indigo-600',
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          <p className="text-green-400 text-sm mt-2">{change} this month</p>
        </div>
        <div className={`${colorClasses[color]} h-12 w-12 rounded-lg opacity-20`}></div>
      </div>
    </div>
  )
}
