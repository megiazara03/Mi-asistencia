import { useCallback, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, Shield, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Logo } from '../components/ui';

export default function SuperAdminLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);

  async function cerrarSesion() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div>
      <div className={`scrim${menu ? ' abierta' : ''}`} onClick={() => setMenu(false)} />
      <aside className={`sidebar${menu ? ' abierta' : ''}`}>
        <Logo />
        <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Portal SuperAdmin
        </div>
        <nav className="nav" aria-label="SuperAdmin">
          <NavLink to="/superadmin" end>
            <Building2 size={20} aria-hidden="true" /> Institutos SaaS
          </NavLink>
        </nav>
        <div className="sidebar-pie">
          <Avatar nombre={usuario?.nombre} large />
          <div className="quien">
            {usuario?.nombre}
            <small style={{ color: '#0284c7', fontWeight: 'bold' }}>SUPERADMIN</small>
          </div>
          <button className="icon-btn" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={cerrarSesion}>
            <LogOut size={20} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <div className="topbar-izq">
            <button className="icon-btn hamburguesa" aria-label="Abrir menú" onClick={() => setMenu(true)}>
              <Menu size={22} aria-hidden="true" />
            </button>
            <div>
              <div className="crumb" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={14} color="#0284c7" /> Plataforma Multi-Tenant SaaS
              </div>
              <h1 style={{ margin: '4px 0 0 0' }}>Panel Central de Institutos</h1>
            </div>
          </div>
        </header>
        <main className="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
