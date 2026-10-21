import React from 'react';
import { Building2, ArrowRight, ShieldCheck, Users, CalendarCheck, Sparkles } from 'lucide-react';
import { getSubdomain } from '../utils/tenant';

export default function HomeGlobal() {
  const subdominio = getSubdomain();

  // Si el usuario ya está dentro de un subdominio específico (ej. colegio.localhost:5173),
  // se le invita a ingresar al login de su institución.
  if (subdominio) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '56px', height: '56px', background: '#e0f2fe', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#0284c7' }}>
            <Building2 size={28} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 8px', color: '#0f172a' }}>
            Portal del Instituto
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px' }}>
            Estás accediendo al espacio exclusivo de <strong>{subdominio}</strong>.
          </p>
          <a
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              background: '#0284c7',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              boxSizing: 'border-box',
            }}
          >
            Iniciar Sesión <ArrowRight size={18} />
          </a>
        </div>
      </div>
    );
  }

  // Vista Global / Landing Page para la raíz (localhost:5173 o midominio.com)
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Barra de navegación superior */}
      <header style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#0284c7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <CalendarCheck size={22} />
            </div>
            <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
              MiAsistencia <span style={{ color: '#0284c7' }}>SaaS</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a
              href="/login"
              style={{
                padding: '8px 18px',
                color: '#475569',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                borderRadius: '6px',
              }}
            >
              Ingresar
            </a>
            <a
              href="/registro-instituto"
              style={{
                padding: '8px 18px',
                background: '#0284c7',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '14px',
                borderRadius: '6px',
              }}
            >
              Registrar Instituto
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '64px 24px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', marginBottom: '24px' }}>
          <Sparkles size={16} /> Plataforma Multi-Tenant para Institutos y Universidades
        </div>
        <h1 style={{ fontSize: '46px', fontWeight: '800', lineHeight: '1.2', margin: '0 auto 20px', maxWidth: '780px', letterSpacing: '-1px' }}>
          Control de asistencia estudiantil para tu institución, en tu propio subdominio
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '620px', margin: '0 auto 36px', lineHeight: '1.6' }}>
          Crea un espacio exclusivo y aislado para tu instituto. Gestiona módulos, docentes, sesiones y el registro de asistencia sin instalaciones complejas.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href="/registro-instituto"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: '#0284c7',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
            }}
          >
            Crear mi Instituto Ahora <ArrowRight size={18} />
          </a>
          <a
            href="/login"
            style={{
              padding: '14px 24px',
              background: '#fff',
              color: '#334155',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              border: '1px solid #cbd5e1',
            }}
          >
            Acceder al Sistema
          </a>
        </div>

        {/* Tarjetas de características */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '72px', textAlign: 'left' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', background: '#f0fdf4', color: '#16a34a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Subdominio Propio y Aislado</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Cada colegio tiene su propia dirección web (ej: <code>colegio.tuplataforma.com</code>). Tus datos jamás se mezclarán con otras organizaciones.
            </p>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', background: '#eff6ff', color: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Gestión de Estudiantes</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Importación ágil de listas por CSV, registro de códigos de estudiante y asignación de materias en pocos clics.
            </p>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', background: '#fdf4ff', color: '#c026d3', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Alta Inmediata (Self-Service)</h3>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0, lineHeight: '1.5' }}>
              Crea tu cuenta institucional en menos de 1 minuto sin esperas ni aprobaciones manuales.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
