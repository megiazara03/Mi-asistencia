// Semilla SaaS Multi-Tenant para pruebas completas de aislamiento por subdominios.
// Sincroniza automáticamente las columnas y modelos antes de sembrar.
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const {
  sequelize,
  Tenant,
  Usuario,
  Modulo,
  Inscripcion,
  SesionClase,
  Asistencia,
  AsistenciaCambio,
  Actividad,
  Importacion,
  TokenRevocado,
} = require('./models');
const { hoyLaPaz } = require('./services/estadoAsistencia');
const { hashearPassword } = require('./core/security');
const env = require('./config/env');

function desplazar(fecha, dias) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function asegurarEstructura() {
  console.log('🛠️ Verificando y sincronizando estructura SaaS en MySQL...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

  // 1. Crear tabla tenant si no existe
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS \`tenant\` (
      \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      \`nombre\` VARCHAR(120) NOT NULL,
      \`slug\` VARCHAR(60) NOT NULL UNIQUE,
      \`activo\` TINYINT(1) NOT NULL DEFAULT 1,
      \`config\` JSON NULL,
      \`creado_en\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`actualizado_en\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // 2. Modificar rol en usuario
  try {
    await sequelize.query("ALTER TABLE `usuario` MODIFY `rol` ENUM('SUPERADMIN', 'ADMIN', 'ESTUDIANTE') NOT NULL DEFAULT 'ESTUDIANTE';");
  } catch (_) {}

  // 3. Agregar tenant_id a usuario si no existe
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `usuario` LIKE 'tenant_id';");
    if (!cols || cols.length === 0) {
      await sequelize.query("ALTER TABLE `usuario` ADD COLUMN `tenant_id` INT NULL REFERENCES `tenant`(`id`) ON DELETE CASCADE;");
      console.log('   -> Agregada columna tenant_id a usuario');
    }
  } catch (e) {
    console.log('   -> Nota usuario.tenant_id:', e.message);
  }

  // 4. Agregar tenant_id a modulo si no existe
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `modulo` LIKE 'tenant_id';");
    if (!cols || cols.length === 0) {
      await sequelize.query("ALTER TABLE `modulo` ADD COLUMN `tenant_id` INT NOT NULL DEFAULT 1 REFERENCES `tenant`(`id`) ON DELETE CASCADE;");
      console.log('   -> Agregada columna tenant_id a modulo');
    }
  } catch (e) {
    console.log('   -> Nota modulo.tenant_id:', e.message);
  }

  // 5. Eliminar restricción de un único módulo activo global
  try {
    await sequelize.query('ALTER TABLE `modulo` DROP INDEX `uq_modulo_activo`;');
  } catch (_) {}

  // 6. Agregar tenant_id a actividad si no existe
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `actividad` LIKE 'tenant_id';");
    if (!cols || cols.length === 0) {
      await sequelize.query("ALTER TABLE `actividad` ADD COLUMN `tenant_id` INT NULL REFERENCES `tenant`(`id`) ON DELETE SET NULL;");
    }
  } catch (_) {}

  // 7. Agregar tenant_id a importacion si no existe
  try {
    const [cols] = await sequelize.query("SHOW COLUMNS FROM `importacion` LIKE 'tenant_id';");
    if (!cols || cols.length === 0) {
      await sequelize.query("ALTER TABLE `importacion` ADD COLUMN `tenant_id` INT NULL REFERENCES `tenant`(`id`) ON DELETE SET NULL;");
    }
  } catch (_) {}

  // 8. Registrar en SequelizeMeta para mantener coherencia
  await sequelize.query(`
    INSERT IGNORE INTO \`SequelizeMeta\` (\`name\`) 
    VALUES ('20261021000001-saas-multitenant-subdominios.js');
  `);

  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
}

async function sembrar() {
  console.log('🔄 Conectando a la base de datos...');
  await sequelize.authenticate();

  await asegurarEstructura();

  console.log('🧹 Limpiando datos anteriores para reiniciar desde cero...');
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
  await AsistenciaCambio.destroy({ where: {}, truncate: true });
  await Asistencia.destroy({ where: {}, truncate: true });
  await SesionClase.destroy({ where: {}, truncate: true });
  await Inscripcion.destroy({ where: {}, truncate: true });
  await Actividad.destroy({ where: {}, truncate: true });
  await Importacion.destroy({ where: {}, truncate: true });
  await TokenRevocado.destroy({ where: {}, truncate: true });
  await Modulo.destroy({ where: {}, truncate: true });
  await Usuario.destroy({ where: {}, truncate: true });
  await Tenant.destroy({ where: {}, truncate: true });
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

  const hoy = hoyLaPaz();
  const fechasClase = [desplazar(hoy, -1), hoy, desplazar(hoy, 1)];

  // =========================================================================
  // 1. SUPERADMIN GLOBAL DE LA PLATAFORMA SAAS (Dueño general)
  // =========================================================================
  console.log('\n👑 Creando SuperAdmin de la plataforma...');
  await Usuario.create({
    tenant_id: null,
    nombre: 'Super Administrador SaaS',
    email: 'superadmin@plataforma.com',
    rol: 'SUPERADMIN',
    password_hash: await hashearPassword('SuperAdmin123!'),
    activo: true,
  });

  // =========================================================================
  // 2. TENANT 1: "Colegio San Martín" (slug: sanmartin)
  //    URL de acceso: http://sanmartin.localhost:5173
  // =========================================================================
  console.log('🏫 Creando Tenant 1: Colegio San Martín (subdominio: sanmartin)...');
  const tenant1 = await Tenant.create({
    nombre: 'Colegio San Martín',
    slug: 'sanmartin',
    activo: true,
  });

  const admin1 = await Usuario.create({
    tenant_id: tenant1.id,
    nombre: 'Prof. Roberto Gómez',
    email: 'admin@sanmartin.com',
    rol: 'ADMIN',
    password_hash: await hashearPassword('AdminSanMartin123!'),
    activo: true,
  });

  const modulo1 = await Modulo.create({
    tenant_id: tenant1.id,
    nombre: 'Matemáticas Avanzadas',
    gestion: '2-2026',
    activo: true,
    activado_en: new Date(),
    creado_por: admin1.id,
  });

  const est1_1 = await Usuario.create({
    tenant_id: tenant1.id,
    codigo: 'SM-101',
    nombre: 'Carlos Mendoza',
    email: 'carlos@sanmartin.com',
    rol: 'ESTUDIANTE',
    activo: true,
  });

  const est1_2 = await Usuario.create({
    tenant_id: tenant1.id,
    codigo: 'SM-102',
    nombre: 'Lucía Fernández',
    email: 'lucia@sanmartin.com',
    rol: 'ESTUDIANTE',
    activo: true,
  });

  await Inscripcion.create({ modulo_id: modulo1.id, estudiante_id: est1_1.id });
  await Inscripcion.create({ modulo_id: modulo1.id, estudiante_id: est1_2.id });

  for (const fecha of fechasClase) {
    await SesionClase.create({
      modulo_id: modulo1.id,
      fecha,
      hora_inicio: '08:00:00',
      hora_fin: '10:00:00',
    });
  }

  // =========================================================================
  // 3. TENANT 2: "Instituto Tecnológico Alfa" (slug: alfa)
  //    URL de acceso: http://alfa.localhost:5173
  // =========================================================================
  console.log('🔬 Creando Tenant 2: Instituto Tecnológico Alfa (subdominio: alfa)...');
  const tenant2 = await Tenant.create({
    nombre: 'Instituto Tecnológico Alfa',
    slug: 'alfa',
    activo: true,
  });

  const admin2 = await Usuario.create({
    tenant_id: tenant2.id,
    nombre: 'Ing. Mariana Rios',
    email: 'admin@alfa.edu',
    rol: 'ADMIN',
    password_hash: await hashearPassword('AdminAlfa123!'),
    activo: true,
  });

  const modulo2 = await Modulo.create({
    tenant_id: tenant2.id,
    nombre: 'Programación Web Fullstack',
    gestion: '2-2026',
    activo: true,
    activado_en: new Date(),
    creado_por: admin2.id,
  });

  const est2_1 = await Usuario.create({
    tenant_id: tenant2.id,
    codigo: 'ALFA-01',
    nombre: 'Mateo Suarez',
    email: 'mateo@alfa.edu',
    rol: 'ESTUDIANTE',
    activo: true,
  });

  const est2_2 = await Usuario.create({
    tenant_id: tenant2.id,
    codigo: 'ALFA-02',
    nombre: 'Valentina Torrez',
    email: 'valentina@alfa.edu',
    rol: 'ESTUDIANTE',
    activo: true,
  });

  await Inscripcion.create({ modulo_id: modulo2.id, estudiante_id: est2_1.id });
  await Inscripcion.create({ modulo_id: modulo2.id, estudiante_id: est2_2.id });

  for (const fecha of fechasClase) {
    await SesionClase.create({
      modulo_id: modulo2.id,
      fecha,
      hora_inicio: '18:30:00',
      hora_fin: '21:30:00',
    });
  }

  // =========================================================================
  // 4. TENANT POR DEFECTO: (slug: default)
  // =========================================================================
  console.log('🏢 Creando Tenant Principal por defecto (slug: default)...');
  const tenantDefault = await Tenant.create({
    nombre: 'Organización Principal',
    slug: 'default',
    activo: true,
  });

  const adminDefault = await Usuario.create({
    tenant_id: tenantDefault.id,
    nombre: 'Administrador Principal',
    email: env.admin?.email || 'admin@ejemplo.com',
    rol: 'ADMIN',
    password_hash: await hashearPassword(env.admin?.password || 'Admin1234'),
    activo: true,
  });

  await Modulo.create({
    tenant_id: tenantDefault.id,
    nombre: 'Módulo Introductorio',
    gestion: '2-2026',
    activo: true,
    activado_en: new Date(),
    creado_por: adminDefault.id,
  });

  console.log('\n=============================================================');
  console.log('🎉 ¡SEMILLA SAAS MULTI-TENANT SEMBRADA CON ÉXITO!');
  console.log('=============================================================');
  console.log('\n1️⃣ SUPERADMIN CENTRAL (Gestor de todos los institutos):');
  console.log('   - URL:   http://localhost:5173/login');
  console.log('   - Email: superadmin@plataforma.com');
  console.log('   - Clave: SuperAdmin123!');
  console.log('   - Panel: http://localhost:5173/admin/tenants');

  console.log('\n2️⃣ INSTITUTO 1: Colegio San Martín:');
  console.log('   - URL:         http://sanmartin.localhost:5173/login');
  console.log('   - Admin Email: admin@sanmartin.com');
  console.log('   - Admin Clave: AdminSanMartin123!');
  console.log('   - Materia:     Matemáticas Avanzadas');
  console.log('   - Estudiantes: SM-101 (carlos@sanmartin.com), SM-102 (lucia@sanmartin.com)');

  console.log('\n3️⃣ INSTITUTO 2: Instituto Tecnológico Alfa:');
  console.log('   - URL:         http://alfa.localhost:5173/login');
  console.log('   - Admin Email: admin@alfa.edu');
  console.log('   - Admin Clave: AdminAlfa123!');
  console.log('   - Materia:     Programación Web Fullstack');
  console.log('   - Estudiantes: ALFA-01 (mateo@alfa.edu), ALFA-02 (valentina@alfa.edu)');

  console.log('\n4️⃣ REGISTRO PÚBLICO DE NUEVOS INSTITUTOS:');
  console.log('   - URL:   http://localhost:5173/registro-instituto');
  console.log('=============================================================\n');

  await sequelize.close();
}

sembrar().catch((e) => {
  console.error('❌ Error al aplicar la semilla SaaS:', e);
  process.exit(1);
});
