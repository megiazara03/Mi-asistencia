import React, { useState } from 'react';
import client from '../api/client';

export default function RegistroInstituto() {
  const [form, setForm] = useState({
    nombre: '',
    slug: '',
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'slug') {
      // Limpiar subdominio en tiempo real
      setForm((prev) => ({
        ...prev,
        slug: value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const res = await client.post('/tenants/registro', form);
      setExito(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detalle ||
          'Ocurrió un error al intentar registrar el instituto'
      );
    } finally {
      setCargando(false);
    }
  };

  if (exito) {
    const dominioBase = window.location.host.includes('localhost')
      ? `${exito.tenant.slug}.localhost:5173`
      : `${exito.tenant.slug}.${window.location.host.split('.').slice(-2).join('.')}`;
    const urlInstituto = `${window.location.protocol}//${dominioBase}`;

    return (
      <div style={{ maxWidth: '520px', margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2e7d32' }}>🎉 ¡Instituto registrado con éxito!</h2>
        <p>Tu organización <strong>{exito.tenant.nombre}</strong> está lista para operar.</p>
        <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', margin: '20px 0' }}>
          <p style={{ margin: '0 0 8px 0' }}><strong>Subdominio asignado:</strong> {exito.tenant.slug}</p>
          <p style={{ margin: '0 0 8px 0' }}><strong>Administrador:</strong> {exito.admin.email}</p>
          <p style={{ margin: 0 }}>
            <strong>URL de acceso:</strong>{' '}
            <a href={urlInstituto} style={{ color: '#1976d2', fontWeight: 'bold' }}>
              {urlInstituto}
            </a>
          </p>
        </div>
        <a
          href={urlInstituto}
          style={{
            display: 'inline-block',
            padding: '10px 16px',
            background: '#1976d2',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '4px',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          Ir al Login de mi Instituto
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '30px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Crea tu Instituto (SaaS)</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>
        Registra tu institución y obtén un espacio y subdominio exclusivo
      </p>

      {error && (
        <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nombre del Instituto:</label>
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej: Instituto Tecnológico Central"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Subdominio deseado:</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="mi-instituto"
              required
              style={{ flex: 1, padding: '8px', borderRadius: '4px 0 0 4px', border: '1px solid #ccc' }}
            />
            <span style={{ background: '#eee', padding: '8px 12px', border: '1px solid #ccc', borderLeft: 'none', borderRadius: '0 4px 4px 0', color: '#555' }}>
              .tuplataforma.com
            </span>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '8px 0' }} />

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Nombre del Administrador:</label>
          <input
            type="text"
            name="admin_nombre"
            value={form.admin_nombre}
            onChange={handleChange}
            placeholder="Ej: Lic. Carlos Pérez"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Correo Electrónico (Login Admin):</label>
          <input
            type="email"
            name="admin_email"
            value={form.admin_email}
            onChange={handleChange}
            placeholder="admin@miinstituto.com"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Contraseña:</label>
          <input
            type="password"
            name="admin_password"
            value={form.admin_password}
            onChange={handleChange}
            placeholder="••••••••"
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          style={{
            marginTop: '8px',
            padding: '12px',
            background: cargando ? '#90caf9' : '#1976d2',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
          }}
        >
          {cargando ? 'Registrando...' : 'Crear Instituto y Empezar'}
        </button>
      </form>
    </div>
  );
}
