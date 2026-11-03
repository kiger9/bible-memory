import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import TabBar from './components/TabBar'
import Splash from './components/Splash'
import Today from './pages/Today'
import Verses from './pages/Verses'
import AddVerse from './pages/AddVerse'
import Practice from './pages/Practice'
import Quiz from './pages/Quiz'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import PlanDetail from './pages/PlanDetail'
import { requestPersistence } from './lib/db'
import { syncOnLaunch } from './lib/sync'
import { refreshLicensedText } from './lib/refresh'

export default function App() {
  useEffect(() => { requestPersistence(); syncOnLaunch().then(refreshLicensedText) }, [])
  return (
    <div className="app">
      <Splash />
      <main className="screen">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/verses" element={<Verses />} />
          <Route path="/verses/new" element={<AddVerse />} />
          <Route path="/practice/:id" element={<Practice />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/plans/:id" element={<PlanDetail />} />
          <Route path="/logbook" element={<Navigate to="/settings" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}
