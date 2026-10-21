import React, { useState, useEffect } from 'react';
import client from '../../api/client';

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({
    nombre: '',
    slug: '',
    admin_nombre: '',
    admin_email: '',
    admin_password: '',
  });
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarTenants = async () => {
    try {
      setCargando(true);
      const res = await client.get('/tenants');
      setTenants(res.data.tenants || []);
    } catch (err) {
      setError(err.response?.data?.detalle || 'Error al cargar los institutos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTenants();
  }, []);

  const toggleEstado = async (id, estadoActual) => {
    try {
      await client.patch(`/tenants/${id}/estado`, { activo: !estadoActual });
      cargarTenants();
    } catch (err) {
      alert(err.response?.data?.detalle || 'Error al cambiar estado');
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      await client.post('/tenants', nuevo);
      setMostrarModal(false);
      setNuevo({
        nombre: '',
        slug: '',
        admin_nombre: '',
        admin_email: '',
        admin_password: '',
      });
      cargarTenants();
    } catch (err) {
      alert(err.response?.data?.detalle || 'Error al crear instituto');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Gestión Central de Institutos (SuperAdmin)</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Administra los institutos/tenants y sus estados en la plataforma SaaS</p>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          style={{
            padding: '10px 16px',
            background: '#2e7d32',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          + Nuevo Instituto
        </button>
      </div>

      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '12px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}

      {cargando ? (
        <p>Cargando institutos...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#f5f5f5', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th style={{ padding: '12px 16px' }}>ID</th>
              <th style={{ padding: '12px 16px' }}>Instituto</th>
              <th style={{ padding: '12px 16px' }}>Subdominio</th>
              <th style={{ padding: '12px 16px' }}>Admin Asignado</th>
              <th style={{ padding: '12px 16px' }}>Estado</th>
              <th style={{ padding: '12px 16px' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px 16px' }}>{t.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{t.nombre}</td>
                <td style={{ padding: '12px 16px' }}>
                  <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px' }}>{t.slug}</code>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {t.usuarios && t.usuarios.length > 0 ? t.usuarios[0].email : <span style={{ color: '#999' }}>Sin admin</span>}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: t.activo ? '#e8f5e9' : '#ffebee',
                      color: t.activo ? '#2e7d32' : '#c62828',
                    }}
                  >
                    {t.activo ? 'ACTIVO' : 'SUSPENDIDO'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={() => toggleEstado(t.id, t.activo)}
                    style={{
                      padding: '6px 12px',
                      background: t.activo ? '#d32f2f' : '#388e3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    {t.activo ? 'Suspender' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal Crear */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
            <h3>Dar de alta un nuevo Instituto</h3>
            <form onSubmit={handleCrear} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                placeholder="Nombre del instituto"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                required
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                placeholder="Subdominio (slug)"
                value={nuevo.slug}
                onChange={(e) => setNuevo({ ...nuevo, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                placeholder="Nombre del Administrador"
                value={nuevo.admin_nombre}
                onChange={(e) => setNuevo({ ...nuevo, admin_nombre: e.target.value })}
                required
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                placeholder="Email del Administrador"
                type="email"
                value={nuevo.admin_email}
                onChange={(e) => setNuevo({ ...nuevo, admin_email: e.target.value })}
                required
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                placeholder="Contraseña inicial"
                type="password"
                value={nuevo.admin_password}
                onChange={(e) => setNuevo({ ...nuevo, admin_password: e.target.value })}
                required
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setMostrarModal(false)} style={{ padding: '8px 14px', border: 'none', background: '#ccc', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ padding: '8px 14px', border: 'none', background: '#1976d2', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
