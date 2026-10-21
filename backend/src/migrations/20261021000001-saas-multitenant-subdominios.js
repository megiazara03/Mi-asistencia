'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla tenant
    await queryInterface.createTable('tenant', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      nombre: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true,
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      config: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      creado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      actualizado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // 2. Modificar rol en usuario para incluir 'SUPERADMIN'
    await queryInterface.sequelize.query(
      "ALTER TABLE `usuario` MODIFY `rol` ENUM('SUPERADMIN', 'ADMIN', 'ESTUDIANTE') NOT NULL DEFAULT 'ESTUDIANTE';"
    );

    // 3. Agregar columna tenant_id a usuario (nullable para superadmin)
    await queryInterface.addColumn('usuario', 'tenant_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'tenant',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 4. Agregar columna tenant_id a modulo
    await queryInterface.addColumn('modulo', 'tenant_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'tenant',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });

    // 5. Eliminar restricción de un solo módulo activo global para permitir uno por tenant
    try {
      await queryInterface.sequelize.query('ALTER TABLE `modulo` DROP INDEX `uq_modulo_activo`;');
    } catch (_) {}

    // 6. Agregar columna tenant_id a actividad
    await queryInterface.addColumn('actividad', 'tenant_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      references: {
        model: 'tenant',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // 7. Agregar columna tenant_id a importacion
    await queryInterface.addColumn('importacion', 'tenant_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      references: {
        model: 'tenant',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('importacion', 'tenant_id');
    await queryInterface.removeColumn('actividad', 'tenant_id');
    await queryInterface.removeColumn('modulo', 'tenant_id');
    await queryInterface.removeColumn('usuario', 'tenant_id');
    await queryInterface.sequelize.query(
      "ALTER TABLE `usuario` MODIFY `rol` ENUM('ADMIN', 'ESTUDIANTE') NOT NULL DEFAULT 'ESTUDIANTE';"
    );
    await queryInterface.dropTable('tenant');
  },
};
