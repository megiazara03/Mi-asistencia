// Router de gestión de tenants/organizaciones (Público + SuperAdmin)
const express = require('express');
const { Tenant, Usuario } = require('../models');
const { errorHttp } = require('../core/errors');
const { hashearPassword } = require('../core/security');
const { getCurrentUser, requireSuperAdmin } = require('../middleware/auth');
const { invalidarCacheTenant } = require('../middleware/tenant');

const router = express.Router();

// ----------------------------------------------------
// 1. RUTAS PÚBLICAS (Para usuarios y registro libre)
// ----------------------------------------------------

// GET /api/tenants/actual - Información del tenant resuelto en el subdominio actual
router.get('/actual', (req, res) => {
  if (!req.tenant) {
    return res.status(404).json({ detalle: 'No se identificó ninguna organización' });
  }
  res.json({
    id: req.tenant.id,
    nombre: req.tenant.nombre,
    slug: req.tenant.slug,
    activo: req.tenant.activo,
    config: req.tenant.config,
  });
});

// POST /api/tenants/registro - Flujo Self-Service: Un nuevo instituto se da de alta solo
router.post('/registro', async (req, res, next) => {
  try {
    const { nombre, slug, admin_nombre, admin_email, admin_password } = req.body;

    if (!nombre || !slug || !admin_email || !admin_password) {
      throw errorHttp(400, 'nombre, slug, admin_email y admin_password son obligatorios');
    }

    const slugLimpio = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slugLimpio || slugLimpio.length < 3) {
      throw errorHttp(400, 'El subdominio (slug) debe tener al menos 3 caracteres alfanuméricos o guiones');
    }

    // Reservar ciertos subdominios especiales
    const reservados = ['admin', 'api', 'app', 'superadmin', 'mail', 'www', 'dashboard', 'central'];
    if (reservados.includes(slugLimpio)) {
      throw errorHttp(400, `El subdominio "${slugLimpio}" está reservado para el sistema`);
    }

    const existente = await Tenant.findOne({ where: { slug: slugLimpio } });
    if (existente) {
      throw errorHttp(409, `El subdominio "${slugLimpio}" ya se encuentra registrado por otro instituto`);
    }

    // Crear Tenant
    const nuevoTenant = await Tenant.create({
      nombre,
      slug: slugLimpio,
      activo: true,
    });

    // Crear Administrador principal para ese tenant
    const password_hash = await hashearPassword(admin_password);
    const nuevoAdmin = await Usuario.create({
      tenant_id: nuevoTenant.id,
      nombre: admin_nombre || 'Administrador',
      email: admin_email.toLowerCase().trim(),
      rol: 'ADMIN',
      password_hash,
      activo: true,
    });

    invalidarCacheTenant(slugLimpio);

    res.status(201).json({
      detalle: 'Instituto registrado exitosamente',
      tenant: {
        id: nuevoTenant.id,
        nombre: nuevoTenant.nombre,
        slug: nuevoTenant.slug,
        url_sugerida: `http://${nuevoTenant.slug}.localhost:5173`,
      },
      admin: {
        id: nuevoAdmin.id,
        nombre: nuevoAdmin.nombre,
        email: nuevoAdmin.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------
// 2. RUTAS PROTEGIDAS PARA SUPERADMIN (Gestión Central)
// ----------------------------------------------------

// GET /api/tenants - Listar todos los institutos registrados
router.get('/', getCurrentUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: Usuario,
          as: 'usuarios',
          where: { rol: 'ADMIN' },
          required: false,
          attributes: ['id', 'nombre', 'email', 'activo'],
        },
      ],
    });
    res.json({ tenants });
  } catch (error) {
    next(error);
  }
});

// POST /api/tenants - Crear instituto manualmente desde el panel de SuperAdmin
router.post('/', getCurrentUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const { nombre, slug, admin_nombre, admin_email, admin_password } = req.body;

    if (!nombre || !slug || !admin_email || !admin_password) {
      throw errorHttp(400, 'nombre, slug, admin_email y admin_password son obligatorios');
    }

    const slugLimpio = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const existente = await Tenant.findOne({ where: { slug: slugLimpio } });
    if (existente) {
      throw errorHttp(409, `El subdominio "${slugLimpio}" ya existe`);
    }

    const nuevoTenant = await Tenant.create({
      nombre,
      slug: slugLimpio,
      activo: true,
    });

    const password_hash = await hashearPassword(admin_password);
    const nuevoAdmin = await Usuario.create({
      tenant_id: nuevoTenant.id,
      nombre: admin_nombre || 'Administrador',
      email: admin_email.toLowerCase().trim(),
      rol: 'ADMIN',
      password_hash,
      activo: true,
    });

    invalidarCacheTenant(slugLimpio);

    res.status(201).json({
      detalle: 'Instituto creado correctamente por SuperAdmin',
      tenant: nuevoTenant,
      admin: {
        id: nuevoAdmin.id,
        nombre: nuevoAdmin.nombre,
        email: nuevoAdmin.email,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tenants/:id/estado - Activar o suspender un instituto
router.patch('/:id/estado', getCurrentUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      throw errorHttp(404, 'Instituto no encontrado');
    }

    tenant.activo = Boolean(activo);
    await tenant.save();

    invalidarCacheTenant(tenant.slug);

    res.json({
      detalle: `El instituto "${tenant.nombre}" ahora está ${tenant.activo ? 'activo' : 'suspendido'}`,
      tenant,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
