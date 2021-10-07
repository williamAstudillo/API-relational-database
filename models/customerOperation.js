const { DataTypes } = require('sequelize');

const sequelize = require('../database/connection');

const CustomerOperation = sequelize.define(
  'CUSTOMER_OPERATION',
  {
    OPERATION_ID: {
      type: DataTypes.INTEGER,
      // allowNull: false,
    },
    LOAN_ID: {
      type: DataTypes.INTEGER,
      // allowNull: false,
    },
    CUSTOMER_ID: {
      type: DataTypes.INTEGER,
      // allowNull: false,
    },
    SUBPRODUCT: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    TYPE: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    STATUS: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    STATUS_DATE: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    STAMP_USER: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    STAMP_DATE_TIME: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ISO_PRODUCT: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = CustomerOperation;
