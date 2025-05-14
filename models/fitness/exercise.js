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
            if (!rawValue) return null;
            if (typeof rawValue === 'object') return rawValue;
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue;
                }
            }
            return rawValue;
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
            if (!rawValue) return null;
            if (typeof rawValue === 'object') return rawValue;
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue;
                }
            }
            return rawValue;
        },
    },
    notes_ar: {
        type: DataTypes.JSON,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('notes_ar');
            if (!rawValue) return null;
            if (typeof rawValue === 'object') return rawValue;
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue;
                }
            }
            return rawValue;
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
