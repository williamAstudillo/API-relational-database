const { DataTypes } = require('sequelize');

const sequelize = require('../database/connection');

const EnterpriseProgram = sequelize.define(
  'ENTERPRISE_PROGRAM',
  {
    NIT: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    NAME: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ADDRESS: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    NIT_LEGAL_REPRESENTATIVE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    NAME_LEGAL_REPRESENTATIVE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    LAST_NAME_LEGAL_REPRESENTATIVE: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    EMAIL: {
      type: DataTypes.STRING,
      allowNull:false
    },
  },
  { timestamps: false }
);

module.exports = EnterpriseProgram;
