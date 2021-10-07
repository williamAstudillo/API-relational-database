const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection')


const Session = sequelize.define('SESSION', {
    IDENTIFICATION_NUMBER: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,

      },
    // fecha de inicio del préstamo
    PASS: {
        type: DataTypes.STRING
    },
},{
    timestamps: false
})


module.exports = Session