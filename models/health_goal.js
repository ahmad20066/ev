const { DataTypes } = require('sequelize');
const sequelize = require('./index')

const HealthGoal = sequelize.define('HealthGoal', {

    goal_name: {
        type: DataTypes.STRING,
        allowNull: false,  // Health goal like 'weight loss', 'muscle gain', etc.
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'Health_Goal',  // Matches the table name in your schema
    timestamps: false,  // Disables Sequelize's default timestamps
});

module.exports = HealthGoal;
