const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const FilesSent = sequelize.define(
  'FILES_SENT',
  {
    COMPANY_NAME: {
      type: DataTypes.STRING,
    },
    NIT: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TYPE: {
      type: DataTypes.ENUM,
      values: ['register', 'novelties new employees', 'novelties fired', 'novelties update', 'payment'],
      allowNull: false,
    },
    RECEIVING_DATE: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    FILE_ID: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    NUMBER_OF_REGISTERS: {
      type: DataTypes.INTEGER,
    },
  },
  { timestamps: false }
);

module.exports = FilesSent;
