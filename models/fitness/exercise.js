const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Exercise = sequelize.define('Exercise', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('image_urls');
            return rawValue ? JSON.parse(rawValue) : null;
        }
    },
    target_muscles_image: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    notes: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            // Decode the JSON data when accessing 'notes'
            const rawValue = this.getDataValue('notes');
            return rawValue ? JSON.parse(rawValue) : null;
        },
    },
    video_url: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'exercises'
});

module.exports = Exercise;
