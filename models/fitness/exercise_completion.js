const Sequelize = require("sequelize");
const sequelize = require("../index");
const Exercise = require("./exercise");

const ExerciseCompletion = sequelize.define("ExerciseCompletion", {
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: "users",
            key: "id",
        },
    },
    exercise_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Exercise,
            key: "id",
        },
    },
    stats: {
        type: Sequelize.JSON,
        validate: {
            isValidFormat(value) {
                if (!Array.isArray(value)) {
                    throw new Error("Stats must be an array of objects with the structure: { set: number, reps: number, weight: number }");
                }
                value.forEach((item) => {
                    if (
                        typeof item !== 'object' ||
                        typeof item.set !== 'number' ||
                        typeof item.reps !== 'number' ||
                        typeof item.weight !== 'number'
                    ) {
                        throw new Error("Each stat entry must be an object with the structure: { set: number, reps: number, weight: number }");
                    }
                });
            },
        },
    },
});

module.exports = ExerciseCompletion;
