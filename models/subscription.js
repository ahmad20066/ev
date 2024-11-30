const Sequelize = require('sequelize');
const sequelize = require('./index');
const User = require('./user')
const Package = require('./package');
const PricingModel = require('./pricing_model');
const DeliveryTime = require('./meals/delivery_time');

const Subscription = sequelize.define("Subscription", {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: "id",
        },
        allowNull: false,
    },
    package_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Package,
            key: "id",
        },
        allowNull: false,
    },
    pricing_id: {
        type: Sequelize.INTEGER,
        references: {
            model: PricingModel,
            key: "id"
        },
        allowNull: false,
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    end_date: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    days_left: {
        type: Sequelize.VIRTUAL,
        get() {
            const currentDate = new Date();
            const endDate = new Date(this.end_date);
            const timeDiff = endDate.getTime() - currentDate.getTime();
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays;
        }
    },


}, {
    tableName: "subscriptions",
    timestamps: true,
});




module.exports = Subscription;
