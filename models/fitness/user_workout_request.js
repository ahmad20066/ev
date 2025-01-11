const Sequelize = require("sequelize")
const sequelize = require("../index")
const Package = require("../package")
const WorkoutRequest = sequelize.define("WorkoutRequest", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
    },
    package_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Package,
            key: "id"
        }
    }
})
module.exports = WorkoutRequest