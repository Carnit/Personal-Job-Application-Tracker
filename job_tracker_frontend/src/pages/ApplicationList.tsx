import { useEffect, useState } from 'react'
import { applicationAPI } from '../lib/api'
import type { JobApplication } from '../lib/api'

type PageType = 'dashboard' | 'applications' | 'detail' | 'analytics' | 'add'

interface ApplicationListProps {
  onNavigate: (page: PageType, appId?: number) => void
}

export default function ApplicationList({ onNavigate }: ApplicationListProps) {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    company: '',
    stage: '',
    status: '',
  })

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true)
        const params: Record<string, string | number | undefined> = {
          skip: 0,
          limit: 50,
        }

        if (filters.company) params.company = filters.company
        if (filters.stage) params.stage = filters.stage
        if (filters.status) params.status = filters.status

        const data = await applicationAPI.getAll(params)
        setApplications(data)
      } catch (error) {
        console.error('Error fetching applications:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplications()
  }, [filters])

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this application?')) {
      try {
        await applicationAPI.delete(id)
        setApplications((apps) => apps.filter((app) => app.id !== id))
      } catch (error) {
        console.error('Error deleting application:', error)
      }
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-white">Applications</h2>
        <p className="text-slate-400 mt-2">View and manage all your job applications</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2">Company</label>
            <input
              type="text"
              placeholder="Search by company..."
              value={filters.company}
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Stage</label>
            <select
              value={filters.stage}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Stages</option>
              <option value="resume_screening">Resume Screening</option>
              <option value="phone_screen">Phone Screen</option>
              <option value="technical_round">Technical Round</option>
              <option value="onsite">Onsite</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="text-center text-slate-400">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="text-center text-slate-400">No applications found</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-300">
                  Applied
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-6 py-3 text-white font-medium">{app.company}</td>
                  <td className="px-6 py-3 text-slate-300">{app.position_title}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-sm">
                      {app.current_stage.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm ${
                        app.status === 'accepted'
                          ? 'bg-green-900/30 text-green-300'
                          : app.status === 'rejected'
                            ? 'bg-red-900/30 text-red-300'
                            : 'bg-yellow-900/30 text-yellow-300'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-300 text-sm">
                    {new Date(app.application_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-right space-x-2">
                    <button
                      onClick={() => onNavigate('detail', app.id)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
