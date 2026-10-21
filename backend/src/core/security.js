// Core security: hash de passwords (bcrypt), tokens JWT y tokens de traspaso SSO entre subdominios.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

const BCRYPT_ROUNDS = 10;

function hashearPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function verificarPassword(plain, hash) {
  if (!plain || !hash) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}

function crearToken(usuario, tenant) {
  const payload = {
    sub: String(usuario.id),
    rol: usuario.rol,
    email: usuario.email,
    tenant_id: tenant ? tenant.id : usuario.tenant_id,
    tenant_slug: tenant ? tenant.slug : undefined,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: `${env.jwt.minutos}m` });
}

// Token temporal de un solo uso (30 segundos) para traspasar la sesión entre subdominios sin volver a pedir contraseña
function crearTokenHandoff(usuario, tenant) {
  const payload = {
    sub: String(usuario.id),
    rol: usuario.rol,
    email: usuario.email,
    tenant_id: tenant ? tenant.id : usuario.tenant_id,
    tenant_slug: tenant ? tenant.slug : undefined,
    tipo: 'handoff',
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.jwt.secret, { expiresIn: '60s' });
}

function verificarToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = {
  hashearPassword,
  verificarPassword,
  crearToken,
  crearTokenHandoff,
  verificarToken,
};
