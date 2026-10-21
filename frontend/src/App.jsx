import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import HomeGlobal from './pages/HomeGlobal';
import Login from './pages/Login';
import RegistroInstituto from './pages/RegistroInstituto';
import SuperAdminTenants from './pages/admin/SuperAdminTenants';
import InicioEstudiante from './pages/estudiante/Inicio';
import Calendario from './pages/estudiante/Calendario';
import InicioAdmin from './pages/admin/Inicio';
import Modulos from './pages/admin/Modulos';
import ModuloGestion, { RedirigirDatos } from './pages/admin/ModuloGestion';
import Estudiantes from './pages/admin/Estudiantes';
import Asistencias from './pages/admin/Asistencias';
import Actividades from './pages/admin/Actividades';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'var(--font)', fontSize: '14px' } }} />
      <BrowserRouter>
        <Routes>
          {/* Home Global para la plataforma SaaS */}
          <Route path="/" element={<HomeGlobal />} />

          {/* Rutas de autenticación y registro de institutos */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro-instituto" element={<RegistroInstituto />} />

          {/* Rutas exclusivas del SUPERADMIN (Dueño del SaaS) */}
          <Route
            element={
              <ProtectedRoute rol="SUPERADMIN">
                <SuperAdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/superadmin" element={<SuperAdminTenants />} />
          </Route>

          {/* Rutas de Estudiante */}
          <Route
            element={
              <ProtectedRoute rol="ESTUDIANTE">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/estudiante" element={<InicioEstudiante />} />
            <Route path="/estudiante/calendario" element={<Calendario />} />
          </Route>

          {/* Rutas de Administrador de Instituto */}
          <Route
            element={
              <ProtectedRoute roles={['ADMIN', 'SUPERADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin" element={<InicioAdmin />} />
            <Route path="/admin/asistencias" element={<Asistencias />} />
            <Route path="/admin/modulos" element={<Modulos />} />
            <Route path="/admin/modulos/:id" element={<ModuloGestion />} />
            <Route path="/admin/modulos/:id/datos" element={<RedirigirDatos />} />
            <Route path="/admin/estudiantes" element={<Estudiantes />} />
            <Route path="/admin/actividades" element={<Actividades />} />
            <Route path="/admin/tenants" element={<SuperAdminTenants />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
