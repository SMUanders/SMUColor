import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout, RequireRedaktoer } from './components/Layout'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/common'
import Login from './pages/Login'
import Home from './pages/Home'
import ColorDetail from './pages/ColorDetail'
import MatchEdit from './pages/MatchEdit'
import Admin from './pages/Admin'

export default function App() {
  const { user, loading, requiresLogin } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <Spinner label="Indlæser…" />
      </div>
    )
  }

  if (requiresLogin && !user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/farve/:refId" element={<ColorDetail />} />
        <Route
          path="/match/ny"
          element={
            <RequireRedaktoer>
              <MatchEdit />
            </RequireRedaktoer>
          }
        />
        <Route
          path="/match/:matchId"
          element={
            <RequireRedaktoer>
              <MatchEdit />
            </RequireRedaktoer>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRedaktoer>
              <Admin />
            </RequireRedaktoer>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
