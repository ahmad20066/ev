const { DataTypes } = require('sequelize');
const sequelize = require('../index');
const Type = require('./type');
const Ingredient = require('./ingredient');

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
    protein: {
        type: DataTypes.DOUBLE
    },
    fats: {
        type: DataTypes.DOUBLE
    },
    fiber: {
        type: DataTypes.DOUBLE
    },
    carb: {
        type: DataTypes.DOUBLE
    }
}, {
    defaultScope: {
        include: [
            {
                model: Type,
                as: 'types',
                through: { attributes: [] },
            },
            {
                model: Ingredient,
                as: "ingredients",
                through: { attributes: [] },
            }
        ],
    },
}
);

module.exports = Meal;
