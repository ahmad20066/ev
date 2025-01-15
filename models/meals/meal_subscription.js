const Sequelize = require("sequelize")
const sequelize = require("../index")
const User = require("../user")
const MealPlan = require("./meal_plan")
const DeliveryTime = require("./delivery_time")
const Address = require("./address")
const MealSubscription = sequelize.define("MealSubscription", {
    type: {
        type: Sequelize.ENUM("weekly", "monthly"),
        allowNull: false,
    },
    meal_plan_id: {
        type: Sequelize.INTEGER,
        references: {
            model: MealPlan,
            key: "id"
        }
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: User,
            key: "id"
        }
    },
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    start_date: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    end_date: {
        type: Sequelize.DATE,
        allowNull: false,
    },
    delivery_time_id: {
        type: Sequelize.INTEGER,
        references: {
            model: DeliveryTime,
            key: "id"
        },
        allowNull: false
    },
    address_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Address,
            key: "id"
        },
        allowNull: false
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
    defaultScope: {
        include: [
            {
                model: MealPlan,
                as: "meal_plan"
            },
            {
                model: Address,
                as: "address",
            },
            {
                model: DeliveryTime,
                as: "delivery_time"
            }
        ]
    },
    timestamps: true
})
module.exports = MealSubscription