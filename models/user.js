const Sequelize = require("sequelize");
const sequelize = require("./index");
const Sport = require("./sport");


const User = sequelize.define("User", {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    role: {
        type: Sequelize.ENUM("consumer", "admin", "kitchen_staff", "coach"),
        allowNull: false,
    },
    gender: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    sport_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
            model: Sport,
            key: "id",
        }
    },
    goal: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    training_location: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    sport_duration: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    age: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            isInt: true,
        },
    },
    height: {
        type: Sequelize.FLOAT,
        allowNull: true,
        validate: {
            min: 0,
        },
    },


    dietary_preferences: {
        type: Sequelize.STRING,
        allowNull: true, // Example: keto, vegan, etc.
    },
    is_set_up: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    // is_verified: {
    //     type: Sequelize.BOOLEAN,
    //     defaultValue: false
    // },
    is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    deactivated_at: {
        type: Sequelize.DATE,
        allowNull: true,
    }
}, {
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        withPassword: { attributes: {} }
    },
    tableName: "users"
});



module.exports = User;