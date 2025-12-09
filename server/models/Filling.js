const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Filling = sequelize.define('Filling', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isPaid: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True si el relleno tiene costo extra'
    },
    suboptions: {
        type: DataTypes.JSON,
        defaultValue: [],
        comment: 'Lista de sub-opciones (ej. nuez, coco) como array de strings'
    },
    forNormalCakes: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Por simplicidad para la migración, asumiremos que todos los rellenos base están disponibles,
    // y la lógica de "Especiales" en frontend podría filtrar si es necesario, pero por ahora lo dejamos genérico.
}, {
    timestamps: false
});

module.exports = Filling;
