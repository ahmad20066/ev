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
    images: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('images');

            // Return null if the value is undefined or null
            if (!rawValue) return null;

            // Return the parsed value if it's a valid JSON string
            try {
                return JSON.parse(rawValue);
            } catch (e) {
                console.error('Error parsing images:', e);
                return rawValue; // Return the raw value if parsing fails
            }
        },
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
