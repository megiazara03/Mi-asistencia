// Modelo Tenant para arquitectura SaaS multi-inquilino.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'tenant',
      timestamps: true,
      createdAt: 'creado_en',
      updatedAt: 'actualizado_en',
    }
  );
