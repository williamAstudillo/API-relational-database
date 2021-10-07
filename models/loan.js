const { DataTypes } = require('sequelize')

const sequelize = require('../database/connection')
const Payment = require('./payments')


const Loan = sequelize.define('LOAN', {
    LOAN_ID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
    // fecha de inicio del préstamo
    BEGIN_DATE: {
        type: DataTypes.DATE
    },
    // fecha de vencimiento del préstamo
    EXPIRY_DATE: {
        type: DataTypes.DATE
    },
    // fecha de pago del préstamo
    CLOSED_DATE: {
        type: DataTypes.DATE
    },
    // pago realizado
    LO_CURRENT_PAYMENT_AMOUNT: {
        type: DataTypes.FLOAT
    },
    // valor de la deuda 
    LO_PRINCIPAL_AMOUNT: {
        type: DataTypes.FLOAT
    },
    // tipo de prestamo 3-adelanto de nomina
    LOAN_TYPE: {
        type: DataTypes.INTEGER,
        values: [1,2,3]
    },
    LO_PAYMENT_DUE_DATE: {
        type: DataTypes.DATE
    },
    LO_OPENING_DATE: {
        type: DataTypes.DATE
    },
    // numero daviplata
    STAMP_USER: {
        type: DataTypes.STRING
    }
},{
    timestamps: false
})


module.exports = Loan