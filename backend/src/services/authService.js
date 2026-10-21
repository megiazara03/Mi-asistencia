// Lógica de negocio de autenticación con soporte multi-tenant, SUPERADMIN y SSO Handoff.
const { Op } = require('sequelize');
const { Usuario, Inscripcion, Modulo, TokenRevocado, Tenant } = require('../models');
const { verificarPassword, crearToken, crearTokenHandoff, verificarToken } = require('../core/security');
const { errorHttp } = require('../core/errors');
const actividadService = require('./actividadService');

const MSG_CREDENCIALES = 'Credenciales incorrectas';
const MSG_NO_INSCRITO = 'No estás inscrito en el módulo activo';

async function rechazar(mensaje, identificador, usuario, ip, tenantId) {
  try {
    await actividadService.registrar(
      usuario ? usuario.id : null,
      'LOGIN_FALLIDO',
      { detalle: `identificador=${identificador}`, ip },
      tenantId
    );
  } catch (_) {}
  throw errorHttp(401, mensaje);
}

/**
 * Valida un ticket SSO de traspaso y entrega el token de sesión definitivo en el subdominio de destino.
 */
async function canjearTicketHandoff(ticket, tenant) {
  let payload;
  try {
    payload = verificarToken(ticket);
  } catch (e) {
    throw errorHttp(401, 'El ticket de acceso ha expirado o es inválido');
  }

  if (payload.tipo !== 'handoff') {
    throw errorHttp(401, 'Tipo de ticket inválido');
  }

  // Idempotencia: findOrCreate evita error de llave primaria duplicada si React invoca dos veces (StrictMode)
  const expiraEn = new Date(payload.exp * 1000);
  const [registro, creado] = await TokenRevocado.findOrCreate({
    where: { jti: payload.jti },
    defaults: { jti: payload.jti, expira_en: expiraEn },
  });

  // Si ya existía desde hace más de 5 segundos, rechazar (evita replay attack real pero tolera re-render de React)
  if (!creado) {
    // Si ya existe pero el token aún es válido en la ventana de gracia (React StrictMode), permitimos continuar
    const creadoHaceMs = Date.now() - (payload.iat * 1000);
    if (creadoHaceMs > 10000) {
      throw errorHttp(401, 'El ticket de acceso ya fue utilizado');
    }
  }

  const usuario = await Usuario.findByPk(Number(payload.sub));
  if (!usuario || !usuario.activo) {
    throw errorHttp(401, 'Usuario no válido o inactivo');
  }

  // Generar sesión normal para el subdominio
  const token = crearToken(usuario, tenant);
  return { token, usuario };
}

async function login({ identificador, password }, ip, tenant) {
  const tenantId = tenant ? tenant.id : null;

  // 1. SUPERADMIN global
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

  // 2. Buscar usuario en el tenant actual
  const whereUsuario = {
    [Op.or]: [{ email: identificador }, { codigo: identificador }],
  };

  if (tenantId) {
    whereUsuario.tenant_id = tenantId;
  }

  let usuario = await Usuario.findOne({ where: whereUsuario });

  // 3. SSO HANDOFF: Si entró por el portal central o subdominio equivocado,
  // validamos su contraseña aquí mismo y generamos un token temporal para entrar directo a su subdominio sin volver a pedir contraseña.
  if (!usuario && (!tenant || tenant.slug === 'default')) {
    const usuarioEncontrado = await Usuario.findOne({
      where: {
        [Op.or]: [{ email: identificador }, { codigo: identificador }],
        activo: true,
      },
      include: [{ model: Tenant, as: 'tenant' }],
    });

    if (usuarioEncontrado && usuarioEncontrado.tenant) {
      // Validar la contraseña antes de redirigir para asegurar que la credencial es correcta
      if (usuarioEncontrado.rol === 'ADMIN') {
        const ok = await verificarPassword(password, usuarioEncontrado.password_hash);
        if (!ok) {
          await rechazar(MSG_CREDENCIALES, identificador, usuarioEncontrado, ip, usuarioEncontrado.tenant_id);
        }
      }

      // Credencial válida -> Crear ticket de traspaso de sesión (SSO)
      const ticketHandoff = crearTokenHandoff(usuarioEncontrado, usuarioEncontrado.tenant);

      const err = errorHttp(409, `Redirigiendo a ${usuarioEncontrado.tenant.nombre}`);
      err.extra = {
        requiere_redireccion: true,
        tenant_slug: usuarioEncontrado.tenant.slug,
        tenant_nombre: usuarioEncontrado.tenant.nombre,
        sso_ticket: ticketHandoff, // Token para login automático instantáneo
      };
      throw err;
    }
  }

  if (!usuario || !usuario.activo) {
    await rechazar(MSG_CREDENCIALES, identificador, usuario, ip, tenantId);
  }

  if (usuario.rol === 'ADMIN') {
    const ok = await verificarPassword(password, usuario.password_hash);
    if (!ok) {
      await rechazar(MSG_CREDENCIALES, identificador, usuario, ip, tenantId);
    }
  } else {
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

  const token = crearToken(usuario, tenant);

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

module.exports = { login, logout, canjearTicketHandoff };
