import { useState, lazy, Suspense } from 'react'
import './App.css'

// Lazy load page components
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ApplicationList = lazy(() => import('./pages/ApplicationList'))
const ApplicationDetail = lazy(() => import('./pages/ApplicationDetail'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AddApplication = lazy(() => import('./pages/AddApplication'))

type Page = 'dashboard' | 'applications' | 'detail' | 'analytics' | 'add'

interface AppState {
  currentPage: Page
  selectedApplicationId: number | null
}

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
)

function App() {
  const [appState, setAppState] = useState<AppState>({
    currentPage: 'dashboard',
    selectedApplicationId: null,
  })

  const handleNavigate = (page: Page, appId?: number) => {
    setAppState({
      currentPage: page,
      selectedApplicationId: appId || null,
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
        <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="text-white font-bold">JT</span>
              </div>
              <h1 className="text-xl font-bold text-white">Job Tracker</h1>
            </div>
            <nav className="hidden gap-1 md:flex">
              <button
                onClick={() => handleNavigate('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  appState.currentPage === 'dashboard'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavigate('applications')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  appState.currentPage === 'applications'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => handleNavigate('analytics')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  appState.currentPage === 'analytics'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                Analytics
              </button>
            </nav>
            <button
              onClick={() => handleNavigate('add')}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Add Application
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<LoadingSpinner />}>
          {appState.currentPage === 'dashboard' && (
            <Dashboard onNavigate={handleNavigate} />
          )}
          {appState.currentPage === 'applications' && (
            <ApplicationList onNavigate={handleNavigate} />
          )}
          {appState.currentPage === 'detail' && appState.selectedApplicationId && (
            <ApplicationDetail
              applicationId={appState.selectedApplicationId}
              onNavigate={handleNavigate}
            />
          )}
          {appState.currentPage === 'analytics' && (
            <Analytics />
          )}
          {appState.currentPage === 'add' && (
            <AddApplication onSuccess={() => handleNavigate('applications')} />
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-900 py-4 w-full">
        <div className="w-full px-4 text-center text-sm text-slate-400">
          <p>&copy; 2025 Job Application Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
