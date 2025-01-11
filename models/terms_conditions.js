const { DataTypes } = require("sequelize");
const sequelize = require("./index");

const TermsAndConditions = sequelize.define("TermsAndConditions", {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: "terms_and_conditions",
});

module.exports = TermsAndConditions;
