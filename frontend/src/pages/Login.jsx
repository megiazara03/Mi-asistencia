import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Building2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Button, Logo } from '../components/ui';
import { usePageTitle } from '../utils/format';
import { getSubdomain, buildTenantUrl } from '../utils/tenant';

// Página de login con soporte SSO Handoff Token protegido contra doble ejecución.
export default function Login() {
  const { login, canjearTicket } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  usePageTitle('Iniciar sesión');

  const [pestana, setPestana] = useState('estudiante'); // 'estudiante' | 'admin'
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [conError, setConError] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [canjeandoSSO, setCanjeandoSSO] = useState(false);
  const [moduloActivo, setModuloActivo] = useState(null);
  const [tenantActual, setTenantActual] = useState(null);

  const subdominio = getSubdomain();
  const ticketSSO = searchParams.get('ticket');
  const ticketCanjeadoRef = useRef(false);

  // 1. Canje automático con protección contra React StrictMode (ejecutar solo 1 vez)
  useEffect(() => {
    if (ticketSSO && !ticketCanjeadoRef.current) {
      ticketCanjeadoRef.current = true;
      setCanjeandoSSO(true);

      canjearTicket(ticketSSO)
        .then((u) => {
          toast.success(`¡Bienvenido! Sesión iniciada con éxito.`);
          const destino = u.rol === 'SUPERADMIN' ? '/superadmin' : u.rol === 'ADMIN' ? '/admin' : '/estudiante';
          navigate(destino, { replace: true });
        })
        .catch((err) => {
          setCanjeandoSSO(false);
          toast.error(err.response?.data?.detalle || 'El ticket de acceso expiró. Ingresa tus datos.');
        });
    }
  }, [ticketSSO]);

  // 2. Información del tenant y módulo activo
  useEffect(() => {
    client
      .get('/tenants/actual')
      .then((res) => setTenantActual(res.data))
      .catch(() => setTenantActual(null));

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

      // REDIRECCIÓN INTELIGENTE CON SSO HANDOFF (Cero reingreso de contraseña)
      if (data?.requiere_redireccion && data?.tenant_slug) {
        toast.loading(`Accediendo a ${data.tenant_nombre}...`);
        
        setTimeout(() => {
          const urlDestino = buildTenantUrl(data.tenant_slug, `/login?ticket=${encodeURIComponent(data.sso_ticket)}`);
          window.location.href = urlDestino;
        }, 800);
        return;
      }

      toast.error(data?.detalle || 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (canjeandoSSO) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: '#f8fafc' }}>
        <Loader2 size={36} className="anim-girar" color="#0284c7" />
        <p style={{ color: '#475569', fontWeight: '500' }}>Iniciando sesión en tu institución...</p>
      </div>
    );
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
