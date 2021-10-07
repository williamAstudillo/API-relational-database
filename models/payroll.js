const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection')
const Customer = require('./customer')


const Payroll = sequelize.define('PAYROLL', {
    PAYROLL_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
    // fecha de inicio del préstamo
    AMOUNT: {
        type: DataTypes.FLOAT
    },
    CUSTOMER_IDENTIFICATION: {
        type: DataTypes.STRING
    },
    USER_ENTERPRISE: {
        type: DataTypes.STRING
    },
    // numero daviplata
    CUSTOMER_NUMBER: {
        type: DataTypes.STRING
    },
    COUNTER: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    TAXES: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
},{
    timestamps: false
})

Customer.hasOne(Payroll)
Payroll.belongsTo(Customer)

module.exports = Payroll