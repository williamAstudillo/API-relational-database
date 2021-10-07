const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const restrictiveList = sequelize.define("RESTRICTIVE_LIST", {
  NIT: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = restrictiveList;
