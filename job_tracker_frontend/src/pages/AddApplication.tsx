import { useState } from 'react'
import { applicationAPI } from '../lib/api'
import type { JobApplication } from '../lib/api'

interface AddApplicationProps {
  onSuccess: () => void
}

export default function AddApplication({ onSuccess }: AddApplicationProps) {
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    company: '',
    position_title: '',
    current_stage: 'resume_screening',
    status: 'pending',
    application_date: new Date().toISOString().slice(0, 10),
    location: '',
    job_url: '',
    notes: '',
    salary_min: undefined,
    salary_max: undefined,
    application_source: 'other',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target

    if (name === 'salary_min' || name === 'salary_max') {
      setFormData({
        ...formData,
        [name]: value ? parseFloat(value) : undefined,
      })
    } else if (name === 'application_date') {
      setFormData({
        ...formData,
        [name]: value ? new Date(value).toISOString() : value,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.company || !formData.position_title) {
        throw new Error('Company and Position Title are required')
      }

      await applicationAPI.create(formData as any)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold text-white">Add Application</h2>
        <p className="text-slate-400 mt-2">Record a new job application</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company & Position */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Google, Microsoft"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Position Title *
                </label>
                <input
                  type="text"
                  name="position_title"
                  value={formData.position_title || ''}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Job URL</label>
                <input
                  type="url"
                  name="job_url"
                  value={formData.job_url || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  placeholder="https://example.com/job"
                />
              </div>
            </div>
          </div>

          {/* Stage & Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status & Stage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Current Stage</label>
                <select
                  name="current_stage"
                  value={formData.current_stage || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
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
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Application Source
                </label>
                <select
                  name="application_source"
                  value={formData.application_source || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="company_site">Company Site</option>
                  <option value="referral">Referral</option>
                  <option value="job_board">Job Board</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Application Date</label>
                <input
                  type="date"
                  name="application_date"
                  value={formData.application_date?.slice(0, 10) || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Compensation</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Salary Range Min</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min || ''}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., 80000"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Salary Range Max</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max || ''}
                onChange={handleChange}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="e.g., 120000"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Add any notes about this application..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating...' : 'Create Application'}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-lg bg-slate-700 px-6 py-2 text-white hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
