const { DataTypes } = require('sequelize');

const sequelize = require('../database/connection');
const Account = require('./account');
const CustomerOperation = require('./customerOperation');
const Loan = require('./loan');

const Customer = sequelize.define(
  'CUSTOMER',
  {
    CUSTOMER_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    NAME: {
      type: DataTypes.STRING,
    },
    FIRST_NAME1: {
      type: DataTypes.STRING,
    },
    LAST_NAME1: {
      type: DataTypes.STRING,
    },
    FIRST_NAME2: {
      type: DataTypes.STRING,
    },
    LAST_NAME2: {
      type: DataTypes.STRING,
    },
    PERSON_TYPE: {
      type: DataTypes.STRING,
      allowNull: false,
      value: ['natural', 'juridica'],
    },
    LOCATION_DOCUMENT: {
      type: DataTypes.STRING
    },
    EMAIL: {
      type: DataTypes.STRING
    },
    IDENTIFICATION_ENTERPRISE: {
      type: DataTypes.STRING,
    },
    NAME_ENTERPRISE: {
      type: DataTypes.STRING,
    },
    SALARY: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    IDENTIFICATION_TYPE: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    IDENTIFICATION_NUMBER: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    STATUS: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    STATUS_DATE: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  { timestamps: false }
);

Customer.belongsToMany(Account, {
  through: CustomerOperation,
  foreignKey: 'CUSTOMER_ID',
});
Account.belongsToMany(Customer, {
  through: CustomerOperation,
  foreignKey: 'OPERATION_ID',
});
// Customer.belongsToMany(Loan, {
//   through: CustomerOperation,
//   foreignKey: 'CUSTOMER_ID',
// });
// Loan.belongsToMany(Customer, {
//   through: CustomerOperation,
//   foreignKey: 'LOAN_ID'
// })

module.exports = Customer;
