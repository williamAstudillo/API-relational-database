const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');
const Loan = require('./loan');

const Account = sequelize.define(
  'ACCOUNT',
  {
    OPERATION_ID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    PRODUCT: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    SUBPRODUCT: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CURRENCY: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // saldo en cuenta
    BALANCE_TODAY: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // saldo total en bolsillos
    BALANCE_WALLET: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    //Valor exonerado acumulado del mes (total de retiros mensuales)
    ACCUMULATED_EXONERATED_AMOUNT: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // saldo bloqueados (se añaden las pignoraciones)
    LOCKED: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    // Saldo diponible
    AVAILABLE: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    WITHOUT_GMF: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    GMF: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    // saldos pendientes por deudas (pignoraciones que se deben)
    PENDING: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    PAYROLL_ADVANCE: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { timestamps: false }
);

Account.hasMany(Loan)
Loan.belongsTo(Account)
module.exports = Account;
