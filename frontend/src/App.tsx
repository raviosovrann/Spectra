import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import DashboardLayout from './components/layout/DashboardLayout'
import InvestingView from './pages/InvestingView'
import TradingView from './pages/TradingView'
import PortfolioView from './pages/PortfolioView'
import InsightsView from './pages/InsightsView'
import AlertsView from './pages/AlertsView'
import HistoryView from './pages/HistoryView'
import ProfileView from './pages/ProfileView'
import Settings from './pages/Settings'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<InvestingView />} />
            <Route path="trading" element={<TradingView />} />
            <Route path="portfolio" element={<PortfolioView />} />
            <Route path="insights" element={<InsightsView />} />
            <Route path="alerts" element={<AlertsView />} />
            <Route path="history" element={<HistoryView />} />
            <Route path="profile" element={<ProfileView />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
