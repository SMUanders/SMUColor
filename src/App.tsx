import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout, RequireRedaktoer } from './components/Layout'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/common'
import Login from './pages/Login'
import Home from './pages/Home'
import ColorDetail from './pages/ColorDetail'
import MatchDetail from './pages/MatchDetail'
import MatchEdit from './pages/MatchEdit'
import Admin from './pages/Admin'
import Observations from './pages/Observations'
import ObservationReview from './pages/ObservationReview'
import ReferenceSheet from './pages/ReferenceSheet'

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
      {/* Referenceark uden for Layout → rent print (ingen topbar) */}
      <Route path="/match/:matchId/ark" element={<ReferenceSheet />} />
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
        {/* Read-only matchdetalje — alle autentificerede (også medarbejdere) */}
        <Route path="/match/:matchId" element={<MatchDetail />} />
        {/* Redigering/verifikation — kun redaktør */}
        <Route
          path="/match/:matchId/rediger"
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
        <Route
          path="/observationer"
          element={
            <RequireRedaktoer>
              <Observations />
            </RequireRedaktoer>
          }
        />
        <Route
          path="/observationer/:obsId"
          element={
            <RequireRedaktoer>
              <ObservationReview />
            </RequireRedaktoer>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
