import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<InvestingView />} />
          <Route path="trading" element={<TradingView />} />
          <Route path="portfolio" element={<PortfolioView />} />
          <Route path="insights" element={<InsightsView />} />
          <Route path="alerts" element={<AlertsView />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="profile" element={<ProfileView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
