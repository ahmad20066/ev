const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Type = require('./type');

const Meal = sequelize.define('Meal', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    calories: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    defaultScope: {
        include: [
            {
                model: Type,
                as: 'types',
                through: { attributes: [] },
            },
        ],
    },
}
);

module.exports = Meal;
