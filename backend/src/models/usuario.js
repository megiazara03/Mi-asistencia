// Tabla usuario: administradores, estudiantes y superadministradores de la plataforma SaaS.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Usuario',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Nullable para el rol SUPERADMIN (dueño de la plataforma)
        defaultValue: 1,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Número de registro del estudiante (los admin no tienen).
      codigo: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      rol: {
        type: DataTypes.ENUM('SUPERADMIN', 'ADMIN', 'ESTUDIANTE'),
        allowNull: false,
        defaultValue: 'ESTUDIANTE',
      },
      // ADMIN y SUPERADMIN tienen contraseña; el estudiante entra sin ella.
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'usuario',
      timestamps: true,
      createdAt: 'creado_en',
      updatedAt: 'actualizado_en',
      indexes: [
        {
          unique: true,
          fields: ['tenant_id', 'email'],
          name: 'usuario_tenant_email_unique',
        },
        {
          unique: true,
          fields: ['tenant_id', 'codigo'],
          name: 'usuario_tenant_codigo_unique',
        },
      ],
    }
  );
