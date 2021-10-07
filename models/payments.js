const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection')


const Payment = sequelize.define('PAYMENT', {
    PAYMENT_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
    // fecha de pago
    PAYMENT_DATE: {
        type: DataTypes.DATE
    },
    // id del prestamo llave foranea
    USER_ENTERPRISE: {
        type: DataTypes.STRING
    },
    // valor de la deuda 
    LO_PRINCIPAL_AMOUNT: {
        type: DataTypes.FLOAT
    },
    AMOUNT: {
        type: DataTypes.FLOAT
    },
    // numero daviplata
    STAMP_USER: {
        type: DataTypes.STRING
    }
},{
    timestamps: false
})


module.exports = Payment