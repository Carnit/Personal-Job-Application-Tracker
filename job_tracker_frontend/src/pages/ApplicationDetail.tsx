import { useEffect, useState } from 'react'
import { applicationAPI } from '../lib/api'
import type { JobApplication } from '../lib/api'

type PageType = 'dashboard' | 'applications' | 'detail' | 'analytics' | 'add'

interface ApplicationDetailProps {
  applicationId: number
  onNavigate: (page: PageType, appId?: number) => void
}

export default function ApplicationDetail({ applicationId, onNavigate }: ApplicationDetailProps) {
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<JobApplication>>({})

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const data = await applicationAPI.getById(applicationId)
        setApplication(data)
        setEditData(data)
      } catch (error) {
        console.error('Error fetching application:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId])

  const handleUpdate = async () => {
    try {
      const updated = await applicationAPI.update(applicationId, editData)
      setApplication(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating application:', error)
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (!application) {
    return <div className="text-red-400">Application not found</div>
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">{application.company}</h2>
          <p className="text-slate-400">{application.position_title}</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={() => onNavigate('applications')}
            className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600"
          >
            Back
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Company</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.company || ''}
                  onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">{application.company}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Position</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.position_title || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, position_title: e.target.value })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">{application.position_title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">{application.location || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Applied On</label>
              <p className="text-white">
                {new Date(application.application_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Status & Stage */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status & Stage</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Current Stage</label>
              {isEditing ? (
                <select
                  value={editData.current_stage || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, current_stage: e.target.value as string })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                >
                  <option value="resume_screening">Resume Screening</option>
                  <option value="phone_screen">Phone Screen</option>
                  <option value="technical_round">Technical Round</option>
                  <option value="onsite">Onsite</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              ) : (
                <p className="text-white capitalize">{application.current_stage}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Status</label>
              {isEditing ? (
                <select
                  value={editData.status || ''}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as string })}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              ) : (
                <p className="text-white capitalize">{application.status}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Application Source</label>
              {isEditing ? (
                <select
                  value={editData.application_source || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, application_source: e.target.value as string })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="company_site">Company Site</option>
                  <option value="referral">Referral</option>
                  <option value="job_board">Job Board</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <p className="text-white capitalize">{application.application_source}</p>
              )}
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Salary Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Salary Min</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.salary_min || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, salary_min: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">${application.salary_min || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Salary Max</label>
              {isEditing ? (
                <input
                  type="number"
                  value={editData.salary_max || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, salary_max: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">${application.salary_max || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Links & Follow-up */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Links & Follow-up</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Job URL</label>
              {isEditing ? (
                <input
                  type="url"
                  value={editData.job_url || ''}
                  onChange={(e) => setEditData({ ...editData, job_url: e.target.value })}
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  {application.job_url || 'N/A'}
                </a>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Follow-up Date</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  value={editData.follow_up_date?.slice(0, 10) || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, follow_up_date: new Date(e.target.value).toISOString() })
                  }
                  className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
                />
              ) : (
                <p className="text-white">
                  {application.follow_up_date
                    ? new Date(application.follow_up_date).toLocaleDateString()
                    : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
        {isEditing ? (
          <textarea
            value={editData.notes || ''}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={4}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
          />
        ) : (
          <p className="text-slate-300">{application.notes || 'No notes'}</p>
        )}
      </div>

      {/* Rejection Reason (if applicable) */}
      {application.status === 'rejected' && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Rejection Reason</h3>
          {isEditing ? (
            <textarea
              value={editData.rejection_reason || ''}
              onChange={(e) =>
                setEditData({ ...editData, rejection_reason: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2"
            />
          ) : (
            <p className="text-slate-300">{application.rejection_reason || 'No reason provided'}</p>
          )}
        </div>
      )}

      {/* Save Button */}
      {isEditing && (
        <div className="flex gap-4">
          <button
            onClick={handleUpdate}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            Save Changes
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg bg-slate-700 px-6 py-2 text-white hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
