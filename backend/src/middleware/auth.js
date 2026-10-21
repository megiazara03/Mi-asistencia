// Middlewares de autenticación y autorización por rol con validación de Tenant y SuperAdmin.
const { verificarToken } = require('../core/security');
const { errorHttp } = require('../core/errors');
const { Usuario, TokenRevocado } = require('../models');

// Verifica el token del header Authorization, comprueba que no esté revocado
// (logout), que el usuario exista y pertenezca al tenant del request (salvo que sea SUPERADMIN).
async function getCurrentUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [tipo, token] = header.split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw errorHttp(401, 'No autenticado');
    }

    let payload;
    try {
      payload = verificarToken(token);
    } catch (e) {
      throw errorHttp(401, 'Token inválido o expirado');
    }

    // ¿El token fue revocado por un logout?
    const revocado = await TokenRevocado.findByPk(payload.jti);
    if (revocado) {
      throw errorHttp(401, 'La sesión fue cerrada');
    }

    const usuario = await Usuario.findByPk(Number(payload.sub));
    if (!usuario || !usuario.activo) {
      throw errorHttp(401, 'Usuario no válido o inactivo');
    }

    // Si es SUPERADMIN, tiene acceso global a todos los tenants y a la plataforma central
    if (usuario.rol === 'SUPERADMIN') {
      req.usuario = usuario;
      req.jwt = payload;
      return next();
    }

    // Aislamiento Multi-tenant para usuarios normales (ADMIN y ESTUDIANTE)
    if (req.tenant && usuario.tenant_id && usuario.tenant_id !== req.tenant.id) {
      throw errorHttp(403, 'Acceso denegado: este usuario no pertenece a la organización actual');
    }

    req.usuario = usuario;
    req.jwt = payload;
    next();
  } catch (e) {
    next(e);
  }
}

// Exige que el usuario autenticado sea SUPERADMIN (dueño de la plataforma SaaS).
function requireSuperAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'SUPERADMIN') {
    return next(errorHttp(403, 'Requiere permisos de Super Administrador'));
  }
  next();
}

// Exige que el usuario autenticado sea ADMIN de su instituto o SUPERADMIN global.
function requireAdmin(req, res, next) {
  if (!req.usuario || (req.usuario.rol !== 'ADMIN' && req.usuario.rol !== 'SUPERADMIN')) {
    return next(errorHttp(403, 'Requiere permisos de administrador'));
  }
  next();
}

// Exige que el usuario autenticado sea ESTUDIANTE.
function requireEstudiante(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'ESTUDIANTE') {
    return next(errorHttp(403, 'Requiere ser estudiante'));
  }
  next();
}

module.exports = { getCurrentUser, requireSuperAdmin, requireAdmin, requireEstudiante };
