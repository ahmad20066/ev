const Sequelize = require("sequelize")
const sequelize = require("../index")
const User = require("../user")
const MealPlan = require("./meal_plan")
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
    }
})
module.exports = MealSubscription