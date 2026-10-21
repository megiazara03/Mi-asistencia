import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Button, Logo } from '../components/ui';
import { usePageTitle } from '../utils/format';
import { getSubdomain, buildTenantUrl } from '../utils/tenant';

// Página de login híbrida con autodetección de instituto y soporte de subdominios.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  usePageTitle('Iniciar sesión');

  const [pestana, setPestana] = useState('estudiante'); // 'estudiante' | 'admin'
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [conError, setConError] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [tenantActual, setTenantActual] = useState(null);

  const subdominio = getSubdomain();

  // 1. Obtener información del tenant actual si estamos en un subdominio
  useEffect(() => {
    client
      .get('/tenants/actual')
      .then((res) => setTenantActual(res.data))
      .catch(() => setTenantActual(null));

    // Módulo activo
    client
      .get('/modulos/activo/resumen')
      .then((res) => setModuloActivo(res.status === 200 && res.data?.nombre ? res.data : null))
      .catch(() => setModuloActivo(null));
  }, []);

  function cambiarPestana(nueva) {
    setPestana(nueva);
    setConError(false);
    setPassword('');
  }

  async function enviar(e) {
    e.preventDefault();
    setConError(false);
    setEnviando(true);
    try {
      const u = await login(identificador, pestana === 'admin' ? password : null);
      const destino = u.rol === 'SUPERADMIN' ? '/superadmin' : u.rol === 'ADMIN' ? '/admin' : '/estudiante';
      navigate(destino, { replace: true });
    } catch (err) {
      setConError(true);
      const data = err.response?.data;

      // REDIRECCIÓN INTELIGENTE HÍBRIDA:
      // Si el usuario intentó loguearse en el login central pero pertenece a un subdominio específico
      if (data?.requiere_redireccion && data?.tenant_slug) {
        toast((t) => (
          <div>
            <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>
              Redirigiendo a tu institución: {data.tenant_nombre}
            </p>
            <small style={{ color: '#666' }}>Te llevaremos a tu portal en unos segundos...</small>
          </div>
        ), { icon: '🏫', duration: 4000 });

        setTimeout(() => {
          window.location.href = buildTenantUrl(data.tenant_slug);
        }, 1500);
        return;
      }

      toast.error(data?.detalle || 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  const clase = `input${conError ? ' invalido' : ''}`;

  return (
    <div className="login">
      <aside className="login-panel">
        <Logo />
        <div>
          <h2>Tu asistencia, registrada en un clic.</h2>
          <p>Marca tu presencia el día de clase y revisa tu historial del módulo en cualquier momento.</p>
          <div className="login-datos">
            <div>
              <strong>1 clic</strong>
              <span>para marcar</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>trazable</span>
            </div>
            <div>
              <strong>Excel</strong>
              <span>importa y exporta</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="login-form-lado">
        <form onSubmit={enviar} className="login-form">
          <div>
            {tenantActual ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                <Building2 size={15} /> {tenantActual.nombre}
              </div>
            ) : (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '500', marginBottom: '8px' }}>
                🌐 Portal Central MiAsistencia
              </div>
            )}
            <h1>Iniciar sesión</h1>
            <p className="texto-muted">
              {tenantActual
                ? `Ingresa con tus credenciales de ${tenantActual.nombre}.`
                : 'Ingresa tu usuario. Te conectaremos a tu institución.'}
            </p>
          </div>

          <div className="segmentado" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'estudiante'}
              className={pestana === 'estudiante' ? 'activa' : ''}
              onClick={() => cambiarPestana('estudiante')}
            >
              Estudiante
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pestana === 'admin'}
              className={pestana === 'admin' ? 'activa' : ''}
              onClick={() => cambiarPestana('admin')}
            >
              Administrador
            </button>
          </div>

          {pestana === 'estudiante' ? (
            <label className="field">
              Correo o número de registro
              <span className="input-wrap">
                <User size={18} aria-hidden="true" />
                <input
                  className={clase}
                  type="text"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  placeholder="ej. 220001 o est1@ejemplo.com"
                  autoFocus
                  required
                />
              </span>
              <span className="hint">Debes estar inscrito en el módulo activo.</span>
            </label>
          ) : (
            <>
              <label className="field">
                Correo
                <span className="input-wrap">
                  <Mail size={18} aria-hidden="true" />
                  <input
                    className={clase}
                    type="email"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="admin@ejemplo.com"
                    autoFocus
                    required
                  />
                </span>
              </label>
              <label className="field">
                Contraseña
                <span className="input-wrap">
                  <Lock size={18} aria-hidden="true" />
                  <input
                    className={clase}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </span>
              </label>
            </>
          )}

          <Button type="submit" size="lg" block loading={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
            {!enviando && <ArrowRight size={18} aria-hidden="true" />}
          </Button>

          {moduloActivo && (
            <p className="login-pie">
              Módulo activo:{' '}
              <strong>
                {moduloActivo.nombre}
                {moduloActivo.gestion ? ` · ${moduloActivo.gestion}` : ''}
              </strong>
            </p>
          )}

          {!subdominio && (
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px' }}>
              <a href="/registro-instituto" style={{ color: '#0284c7', textDecoration: 'none' }}>
                ¿Quieres registrar una nueva institución? Haz clic aquí
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
