// Tabla modulo: periodo/materia por tenant.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Modulo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenant_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        references: {
          model: 'tenant',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nombre: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      gestion: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      activado_en: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      creado_por: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'modulo',
      timestamps: true,
      createdAt: 'creado_en',
      updatedAt: false,
      indexes: [
        {
          fields: ['tenant_id'],
        },
      ],
    }
  );
