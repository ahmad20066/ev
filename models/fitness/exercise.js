const { DataTypes } = require('sequelize');
const sequelize = require('../index');

const Exercise = sequelize.define('Exercise', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    name_ar: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    description_ar: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    image_urls: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('image_urls');
            if (rawValue) {
                return JSON.parse(rawValue)
            } else {
                return null
            }
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
            const rawValue = this.getDataValue('notes');

            if (rawValue) {
                return JSON.parse(rawValue)
            } else {
                return null
            }

        },
    },
    notes_ar: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('notes_ar');
            if (rawValue) {
                return JSON.parse(rawValue)
            } else {
                return null
            }
        },
    },
    cooling_time: {
        type: DataTypes.DOUBLE,

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
