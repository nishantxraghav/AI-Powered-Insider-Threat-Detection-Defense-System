import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import AlertsPage from './pages/AlertsPage'
import MonitoringPage from './pages/MonitoringPage'
import ScenariosPage from './pages/ScenariosPage'
import InsightsPage from './pages/InsightsPage'
import CSVUploadPage from './pages/CSVUploadPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
            <Route path="scenarios" element={<ScenariosPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="csv-upload" element={<CSVUploadPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
