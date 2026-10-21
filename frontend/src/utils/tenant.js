/**
 * Extrae el subdominio actual desde window.location.hostname.
 * Ejemplos:
 *   - "colegio.miapp.com" -> "colegio"
 *   - "colegio.localhost" -> "colegio"
 *   - "localhost" o IP -> null (usa tenant por defecto)
 */
export function getSubdomain() {
  if (typeof window === 'undefined') return null;

  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split('.');

  // Caso: tenant.localhost
  if (hostname.endsWith('.localhost') && parts.length >= 2) {
    return parts[0];
  }

  // Caso producción: subdominio.dominio.com
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }

  return null;
}

/**
 * Genera la URL completa para acceder a un subdominio específico.
 * Ejemplo:
 *   slug: "gatorop" -> "http://gatorop.localhost:5173"
 */
export function buildTenantUrl(slug, path = '/login') {
  if (typeof window === 'undefined') return path;

  const protocol = window.location.protocol;
  const host = window.location.host;

  // Si estamos en entorno localhost (ej: localhost:5173 o tenant.localhost:5173)
  if (host.includes('localhost')) {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${slug}.localhost${port}${path}`;
  }

  // Si estamos en producción (ej: tudominio.com o sub.tudominio.com)
  const hostParts = window.location.hostname.split('.');
  const baseDomain = hostParts.length > 2 ? hostParts.slice(-2).join('.') : hostParts.join('.');
  const port = window.location.port ? `:${window.location.port}` : '';

  return `${protocol}//${slug}.${baseDomain}${port}${path}`;
}
