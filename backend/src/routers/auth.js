// Router de autenticación: login, logout, me y detección de tenant (Híbrido).
const express = require('express');
const { loginSchema } = require('../schemas/auth');
const { validar } = require('../schemas/validar');
const { usuarioPublico } = require('../schemas/usuario');
const { getCurrentUser } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

function ipDe(req) {
  return req.ip || (req.socket && req.socket.remoteAddress) || null;
}

// POST /api/auth/detectar-instituto - Permite buscar a qué instituto pertenece un correo antes o durante el login
router.post('/detectar-instituto', async (req, res, next) => {
  try {
    const { identificador } = req.body;
    if (!identificador) {
      return res.status(400).json({ detalle: 'Identificador requerido' });
    }
    const info = await authService.detectarTenantPorIdentificador(identificador);
    if (!info) {
      return res.status(404).json({ detalle: 'No se encontró ninguna institución asociada' });
    }
    res.json(info);
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login  -> { access_token, token_type, usuario, tenant }
router.post('/login', async (req, res, next) => {
  try {
    const datos = validar(loginSchema, req.body);
    const { token, usuario } = await authService.login(datos, ipDe(req), req.tenant);
    res.json({
      access_token: token,
      token_type: 'bearer',
      usuario: usuarioPublico(usuario),
      tenant: req.tenant ? { id: req.tenant.id, nombre: req.tenant.nombre, slug: req.tenant.slug } : null,
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/logout  (requiere token) -> revoca el token actual
router.post('/logout', getCurrentUser, async (req, res, next) => {
  try {
    await authService.logout(req.usuario, req.jwt, ipDe(req), req.tenant ? req.tenant.id : null);
    res.json({ detalle: 'Sesión cerrada correctamente' });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/me  (requiere token) -> usuario del token y datos del tenant
router.get('/me', getCurrentUser, (req, res) => {
  res.json({
    usuario: usuarioPublico(req.usuario),
    tenant: req.tenant ? { id: req.tenant.id, nombre: req.tenant.nombre, slug: req.tenant.slug } : null,
  });
});

module.exports = router;
