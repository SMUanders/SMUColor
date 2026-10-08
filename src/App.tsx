import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout, RequireRedaktoer } from './components/Layout'
import { useAuth } from './context/AuthContext'
import { Spinner } from './components/common'
import Login from './pages/Login'
import Home from './pages/Home'
import ColorDetail from './pages/ColorDetail'
import RalDetail from './pages/RalDetail'
import RalBibliotek from './pages/RalBibliotek'
import FolieDetail from './pages/FolieDetail'
import RelationNy from './pages/RelationNy'
import PaletteSerie from './pages/PaletteSerie'
import Produktion from './pages/Produktion'
import OpskriftNy from './pages/OpskriftNy'
import OpskriftDetail from './pages/OpskriftDetail'
import OpskriftEdit from './pages/OpskriftEdit'
import MatchDetail from './pages/MatchDetail'
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
        {/* V1.4 — RAL Classic referencebibliotek */}
        <Route path="/ral" element={<RalBibliotek />} />
        <Route path="/ral/:refId" element={<RalDetail />} />
        {/* V1.2 — palette-neutralt flow */}
        <Route path="/folie/:variantId" element={<FolieDetail />} />
        <Route
          path="/relation/ny"
          element={
            <RequireRedaktoer>
              <RelationNy />
            </RequireRedaktoer>
          }
        />
        {/* V1.3 — palette-browsing + produktion */}
        <Route path="/bibliotek/:serie" element={<PaletteSerie />} />
        <Route path="/produktion" element={<Produktion />} />
        <Route
          path="/opskrift/ny"
          element={
            <RequireRedaktoer>
              <OpskriftNy />
            </RequireRedaktoer>
          }
        />
        {/* V1.4.1 — genåbning af printopskrifter */}
        {/* Detalje: læsbar for alle med Color-adgang (RLS: har_app_adgang). */}
        <Route path="/opskrift/:id" element={<OpskriftDetail />} />
        <Route
          path="/opskrift/:id/rediger"
          element={
            <RequireRedaktoer>
              <OpskriftEdit />
            </RequireRedaktoer>
          }
        />
        <Route
          path="/match/ny"
          element={
            <RequireRedaktoer>
              <MatchEdit />
            </RequireRedaktoer>
          }
        />
        <Route
          path="/match/:matchId/rediger"
          element={
            <RequireRedaktoer>
              <MatchEdit />
            </RequireRedaktoer>
          }
        />
        {/* Read-only matchdetalje — alle brugere med aktiv Color-adgang (RLS: har_app_adgang). */}
        <Route path="/match/:matchId" element={<MatchDetail />} />
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
