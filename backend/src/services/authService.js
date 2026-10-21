// Lógica de negocio de autenticación (RF-01, RF-02) con soporte multi-tenant, SUPERADMIN y detección híbrida.
const { Op } = require('sequelize');
const { Usuario, Inscripcion, Modulo, TokenRevocado, Tenant } = require('../models');
const { verificarPassword, crearToken } = require('../core/security');
const { errorHttp } = require('../core/errors');
const actividadService = require('./actividadService');

// Mismo mensaje genérico para no revelar si el usuario existe.
const MSG_CREDENCIALES = 'Credenciales incorrectas';
const MSG_NO_INSCRITO = 'No estás inscrito en el módulo activo';

// Registra un intento fallido en el historial y lanza el error.
async function rechazar(mensaje, identificador, usuario, ip, tenantId) {
  try {
    await actividadService.registrar(
      usuario ? usuario.id : null,
      'LOGIN_FALLIDO',
      { detalle: `identificador=${identificador}`, ip },
      tenantId
    );
  } catch (_) {
    // Evita romper si ocurre un fallo al auditar
  }
  throw errorHttp(401, mensaje);
}

/**
 * Resuelve la institución de un identificador cuando se accede desde el login global.
 */
async function detectarTenantPorIdentificador(identificador) {
  const usuario = await Usuario.findOne({
    where: {
      [Op.or]: [{ email: identificador }, { codigo: identificador }],
      activo: true,
    },
    include: [{ model: Tenant, as: 'tenant' }],
  });

  if (!usuario) return null;
  if (usuario.rol === 'SUPERADMIN') return { rol: 'SUPERADMIN' };

  return usuario.tenant ? { rol: usuario.rol, tenant: usuario.tenant } : null;
}

async function login({ identificador, password }, ip, tenant) {
  const tenantId = tenant ? tenant.id : null;

  // 1. Verificar si se trata de un SUPERADMIN global
  const posibleSuperAdmin = await Usuario.findOne({
    where: {
      rol: 'SUPERADMIN',
      [Op.or]: [{ email: identificador }, { codigo: identificador }],
    },
  });

  if (posibleSuperAdmin) {
    if (!posibleSuperAdmin.activo) {
      await rechazar(MSG_CREDENCIALES, identificador, posibleSuperAdmin, ip, null);
    }
    const ok = await verificarPassword(password, posibleSuperAdmin.password_hash);
    if (!ok) {
      await rechazar(MSG_CREDENCIALES, identificador, posibleSuperAdmin, ip, null);
    }
    const token = crearToken(posibleSuperAdmin, tenant);
    return { token, usuario: posibleSuperAdmin };
  }

  // 2. Búsqueda de usuario dentro del tenant del subdominio actual
  const whereUsuario = {
    [Op.or]: [{ email: identificador }, { codigo: identificador }],
  };

  if (tenantId) {
    whereUsuario.tenant_id = tenantId;
  }

  let usuario = await Usuario.findOne({ where: whereUsuario });

  // 3. ENFOQUE HÍBRIDO: Si el usuario no fue encontrado en el tenant actual (ej. entró por localhost sin subdominio),
  // buscamos globalmente si el usuario pertenece a algún otro tenant para guiarlo o redirigirlo automáticamente.
  if (!usuario && (!tenant || tenant.slug === 'default')) {
    const usuarioEncontrado = await Usuario.findOne({
      where: {
        [Op.or]: [{ email: identificador }, { codigo: identificador }],
        activo: true,
      },
      include: [{ model: Tenant, as: 'tenant' }],
    });

    if (usuarioEncontrado && usuarioEncontrado.tenant) {
      const err = errorHttp(409, `Tu cuenta pertenece al instituto "${usuarioEncontrado.tenant.nombre}"`);
      err.extra = {
        requiere_redireccion: true,
        tenant_slug: usuarioEncontrado.tenant.slug,
        tenant_nombre: usuarioEncontrado.tenant.nombre,
      };
      throw err;
    }
  }

  if (!usuario || !usuario.activo) {
    await rechazar(MSG_CREDENCIALES, identificador, usuario, ip, tenantId);
  }

  if (usuario.rol === 'ADMIN') {
    // ADMIN: la contraseña es obligatoria y se verifica con bcrypt.
    const ok = await verificarPassword(password, usuario.password_hash);
    if (!ok) {
      await rechazar(MSG_CREDENCIALES, identificador, usuario, ip, tenantId);
    }
  } else {
    // ESTUDIANTE: entra sin contraseña, pero debe estar inscrito en el módulo activo del tenant.
    const whereModulo = { activo: true };
    if (tenantId) {
      whereModulo.tenant_id = tenantId;
    }
    const moduloActivo = await Modulo.findOne({ where: whereModulo });
    if (!moduloActivo) {
      await rechazar(MSG_NO_INSCRITO, identificador, usuario, ip, tenantId);
    }
    const inscrito = await Inscripcion.findOne({
      where: { modulo_id: moduloActivo.id, estudiante_id: usuario.id },
    });
    if (!inscrito) {
      await rechazar(MSG_NO_INSCRITO, identificador, usuario, ip, tenantId);
    }
  }

  // Generar token JWT incorporando información del tenant
  const token = crearToken(usuario, tenant);

  // Registrar login exitoso
  try {
    await actividadService.registrar(usuario.id, 'LOGIN_EXITOSO', { ip }, tenantId);
  } catch (_) {}

  return { token, usuario };
}

async function logout(usuario, jwtPayload, ip, tenantId) {
  const jti = jwtPayload.jti || jwtPayload.id;
  if (jti) {
    const expiraEn = jwtPayload.exp ? new Date(jwtPayload.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    await TokenRevocado.create({ jti, expira_en: expiraEn });
  }
  try {
    await actividadService.registrar(usuario.id, 'LOGOUT', { ip }, tenantId || usuario.tenant_id);
  } catch (_) {}
}

module.exports = { login, logout, detectarTenantPorIdentificador };
