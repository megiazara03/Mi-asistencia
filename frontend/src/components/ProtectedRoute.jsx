import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protege una ruta: exige sesión y, opcionalmente, un rol o conjunto de roles.
// Si el rol no coincide, redirige al inicio que le corresponde al usuario.
export default function ProtectedRoute({ rol, roles, children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <div className="pad" aria-busy="true"><div className="skeleton" style={{ width: "40%" }} /></div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Soporta prop 'rol' (string) o prop 'roles' (array)
  const permitidos = roles || (rol ? [rol] : null);

  if (permitidos && !permitidos.includes(usuario.rol)) {
    let destino = '/estudiante';
    if (usuario.rol === 'SUPERADMIN') destino = '/superadmin';
    else if (usuario.rol === 'ADMIN') destino = '/admin';

    return <Navigate to={destino} replace />;
  }

  return children;
}
