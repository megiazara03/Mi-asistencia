// Punto de entrada del backend: crea la app Express, configura CORS,
// monta los routers bajo /api y expone el healthcheck con soporte Multi-Tenant.
const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { resolverTenant } = require('./middleware/tenant');

// Routers
const authRouter = require('./routers/auth');
const modulosRouter = require('./routers/modulos');
const gestionModuloRouter = require('./routers/gestionModulo');
const importacionRouter = require('./routers/importacion');
const asistenciaRouter = require('./routers/asistencia');
const adminRouter = require('./routers/admin');
const actividadesRouter = require('./routers/actividades');
const tenantsRouter = require('./routers/tenants');

const app = express();

// Necesario para leer la IP y los hosts reales del cliente detrás del proxy de nginx.
app.set('trust proxy', true);

// Configuración dinámica de CORS para aceptar subdominios wildcard en producción o dominios configurados
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como apps móviles, curl, o servidores locales)
      if (!origin) return callback(null, true);
      // Permitir si coincide con la lista de orígenes en env
      if (Array.isArray(env.corsOrigins) && env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Permitir cualquier subdominio localhost o dominios de desarrollo
      if (/^http:\/\/[a-z0-9-]+\.localhost(:\d+)?$/i.test(origin) || origin.endsWith('.localhost')) {
        return callback(null, true);
      }
      // Permitir por defecto o según configuración
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Healthcheck simple: verifica que el backend responde (libre de tenant).
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Resolver Tenant automáticamente para todas las rutas de la API
app.use(resolverTenant);

// Routers de la aplicación (todos bajo /api).
app.use('/api/tenants', tenantsRouter);
app.use('/api/auth', authRouter);
app.use('/api/modulos', modulosRouter);
app.use('/api/modulos', gestionModuloRouter);
app.use('/api/importacion', importacionRouter);
app.use('/api/asistencia', asistenciaRouter);
app.use('/api/admin', adminRouter);
app.use('/api/actividades', actividadesRouter);

// Ruta no encontrada.
app.use((req, res) => {
  res.status(404).json({ detalle: 'Recurso no encontrado' });
});

// Manejador de errores general: responde en español y en formato JSON uniforme.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const detalle =
    status === 500 ? 'Error interno del servidor' : err.message || 'Error';
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ detalle, ...(status !== 500 ? err.extra : undefined) });
});

// Solo levanta el servidor si se ejecuta directamente (no al importarlo en tests).
if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Backend escuchando en el puerto ${env.port}`);
  });
}

module.exports = app;
