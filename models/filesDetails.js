const { DataTypes } = require('sequelize');
const sequelize = require('../database/connection');

const FilesDetails = sequelize.define(
  'FILES_DETAILS',
  {
    CUSTOMER_ID: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    STATUS: {
      type: DataTypes.ENUM,
      values: ['ok', 'rejected'],
    },
    FILE_ID: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    PROCESSING_TIME: {
      type: DataTypes.DATE
    },
    TYPE: {
      type: DataTypes.STRING
    }
  },
  { timestamps: false }
);

module.exports = FilesDetails;
