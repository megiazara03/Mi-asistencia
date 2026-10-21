// Middleware para extraer y validar el tenant a partir del subdominio o encabezado.
const { errorHttp } = require('../core/errors');
const { Tenant } = require('../models');

// Caché en memoria para evitar consultas repetitivas constantes a la BD por cada request
const tenantCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto

/**
 * Extrae el slug del subdominio o fallback de headers.
 * Ejemplos:
 *  - "instituto-a.miapp.com" -> "instituto-a"
 *  - "colegio.localhost:3000" -> "colegio"
 *  - "localhost" o IP -> slug por defecto o header 'x-tenant-id' / 'x-tenant-slug'
 */
function extraerSlug(req) {
  // 1. Header explícito (muy útil para desarrollo local, mobile apps o tests de API)
  const headerTenant = req.headers['x-tenant-slug'] || req.headers['x-tenant-id'];
  if (headerTenant) {
    return String(headerTenant).trim().toLowerCase();
  }

  // 2. Extraer del hostname / Host header
  const host = (req.headers['x-forwarded-host'] || req.headers.host || req.hostname || '').split(':')[0].toLowerCase();
  
  // Ignorar localhost e IPs directas a menos que tengan prefijo de subdominio (ej: tenant.localhost)
  const partes = host.split('.');
  
  if (host.endsWith('.localhost') && partes.length >= 2) {
    return partes[0];
  }

  // Para dominios normales tipo: tenant.dominio.com -> subdominio = tenant
  if (partes.length > 2) {
    // Si no es www
    if (partes[0] !== 'www') {
      return partes[0];
    }
  }

  // Si no se detecta subdominio o se entra directo por IP/localhost sin subdominio:
  return process.env.DEFAULT_TENANT_SLUG || 'default';
}

async function resolverTenant(req, res, next) {
  try {
    const slug = extraerSlug(req);

    // Revisar caché
    const ahora = Date.now();
    const cacheado = tenantCache.get(slug);
    if (cacheado && cacheado.expira > ahora) {
      req.tenant = cacheado.tenant;
      return next();
    }

    // Buscar en BD
    let tenant = await Tenant.findOne({ where: { slug } });

    // Si es el slug por defecto y aún no existe (ej. primera ejecución), lo creamos o usamos fallback
    if (!tenant && slug === 'default') {
      tenant = await Tenant.findOrCreate({
        where: { slug: 'default' },
        defaults: {
          nombre: 'Organización Principal',
          slug: 'default',
          activo: true,
        },
      }).then(([t]) => t);
    }

    if (!tenant) {
      throw errorHttp(404, `Organización o subdominio "${slug}" no encontrado`);
    }

    if (!tenant.activo) {
      throw errorHttp(403, `La organización "${tenant.nombre}" se encuentra inactiva`);
    }

    // Guardar en caché
    tenantCache.set(slug, { tenant, expira: ahora + CACHE_TTL_MS });

    req.tenant = tenant;
    next();
  } catch (error) {
    next(error);
  }
}

// Invalida la caché de un tenant cuando se actualiza
function invalidarCacheTenant(slug) {
  if (slug) {
    tenantCache.delete(slug.toLowerCase());
  } else {
    tenantCache.clear();
  }
}

module.exports = {
  resolverTenant,
  extraerSlug,
  invalidarCacheTenant,
};
