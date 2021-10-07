const { Op } = require("sequelize");
const Customer = require("../models/customer");
const moment = require('moment')
const Loan = require("../models/loan");
const Payment = require("../models/payments");
const sequelize = require("../database/connection");
const Payroll = require("../models/payroll");
const Account = require("../models/account");


const logsLoans = async (req, res) => {

    const { date } = req.body
    const dateRequest = new Date(date)
    console.log("YearMonthDay", dateRequest)

    const actualUtc = dateRequest.getTime() + dateRequest.getTimezoneOffset() * 60000;
    const utcCorrected = new Date(actualUtc);
    // utcCorrected.setHours(0)
    const fecha2 = new Date(utcCorrected)
    fecha2.setDate(fecha2.getDate() + 1)
    console.log("original: ",utcCorrected.toISOString())
    console.log("nueva: ", fecha2)

    console.log(new Date(`${utcCorrected.toISOString().slice(0,11)}00:00:00.000Z`))
    // const payments = await Payment.findAll({
    //     where: {
    //         PAYMENT_DATE: {
    //             [Op.between] : [new Date(`${utcCorrected.toISOString().slice(0,11)}00:00:00.000Z`), fecha2]
    //         }
    //     }
    // })
    // console.log(payments)
    // // console.log("pagos", payments)
    const loans = await Loan.findAll({
        where:{
            BEGIN_DATE: {
                [Op.between] : [new Date(`${utcCorrected.toISOString().slice(0,11)}00:00:00.000Z`), new Date(`${fecha2.toISOString().slice(0,11)}00:00:00.000Z`)]
            }
        },
        attributes: [
            'STAMP_USER',
            [sequelize.fn('sum', sequelize.col('LO_PRINCIPAL_AMOUNT')), 'total_amount'],
        ],
        group: ['STAMP_USER']
    })
    let responseData = []
    for (let j = 0; j < loans.length; j++) {
        console.log(loans[j].dataValues.total_amount)
        const payrollInfo = await Payroll.findOne({where:{CUSTOMER_NUMBER:loans[j].STAMP_USER}})
        const customerInfo = await Customer.findOne({where:{IDENTIFICATION_NUMBER: payrollInfo.CUSTOMER_IDENTIFICATION}})
        responseData.push({
            cellphone: loans[j].STAMP_USER,
            total_amount: loans[j].dataValues.total_amount,
            name: `${customerInfo.NAME}`
        })
    }

    res.json(responseData)
    
}

const logsPayments = async (req, res) => {
    const { date } = req.body
    const dateRequest = new Date(date)
    console.log("YearMonthDay", dateRequest)

    const actualUtc = dateRequest.getTime() + dateRequest.getTimezoneOffset() * 60000;

    const utcCorrected = new Date(actualUtc);
    // utcCorrected.setHours(0)
    const fecha2 = new Date(utcCorrected)
    fecha2.setDate(fecha2.getDate() + 1)
    console.log("original: ",utcCorrected.toISOString())
    console.log("nueva: ", fecha2)
    const payments = await Payment.findAll({
        where: {
            PAYMENT_DATE: {
                [Op.between] : [new Date(`${utcCorrected.toISOString().slice(0,11)}00:00:00.000Z`), new Date(`${fecha2.toISOString().slice(0,11)}00:00:00.000Z`)]
            }
        },
        attributes: [
            'STAMP_USER',
            [sequelize.fn('sum', sequelize.col('AMOUNT')), 'total_amount'],
        ],
        group: ['STAMP_USER']
    })
    let responseData = []
    for (let j = 0; j < payments.length; j++) {
        console.log(payments[j].dataValues.total_amount)
        const payrollInfo = await Payroll.findOne({where:{CUSTOMER_NUMBER:payments[j].STAMP_USER}})
        const customerInfo = await Customer.findOne({where:{IDENTIFICATION_NUMBER: payrollInfo.CUSTOMER_IDENTIFICATION}})
        responseData.push({
            cellphone: payments[j].STAMP_USER,
            total_amount: payments[j].dataValues.total_amount,
            name: `${customerInfo.NAME}`
        })
    }

    res.json(responseData)
}


const dailyReport = async (req, res) => {
    // const { date } = req.body
    // const dateRequest = new Date(date)
    // console.log("YearMonthDay", dateRequest)

    // const actualUtc = dateRequest.getTime() + dateRequest.getTimezoneOffset() * 60000;

    // const utcCorrected = new Date(actualUtc);
    // // utcCorrected.setHours(0)
    // const fecha2 = new Date(utcCorrected)
    // fecha2.setDate(fecha2.getDate() + 1)
    // console.log("original: ",utcCorrected.toISOString())
    // console.log("nueva: ", fecha2)

    const loans = await Loan.findAll({
        // where: {
        //     EXPIRY_DATE: {
        //         [Op.between] : [new Date(`${utcCorrected.toISOString().slice(0,11)}00:00:00.000Z`), new Date(`${fecha2.toISOString().slice(0,11)}00:00:00.000Z`)]
        //     }
        // },
        attributes: [
            'STAMP_USER',
            [sequelize.fn('sum', sequelize.col('LO_PRINCIPAL_AMOUNT')), 'total_doubt'],
            [sequelize.fn('sum', sequelize.col('LO_CURRENT_PAYMENT_AMOUNT')), 'total_payments']
        ],
        group: ['STAMP_USER']
    })
    let responseData = []
    for (let i = 0; i < loans.length; i++) {
        const payrollInfo = await Payroll.findOne({where:{CUSTOMER_NUMBER:loans[i].STAMP_USER}})
        const customerInfo = await Customer.findOne({where:{IDENTIFICATION_NUMBER: payrollInfo.CUSTOMER_IDENTIFICATION}})
        responseData.push({
            cellphone: loans[i].STAMP_USER,
            total_doubt: loans[i].dataValues.total_doubt,
            total_payments: loans[i].dataValues.total_payments,
            name: `${customerInfo.NAME}`
        })
    }

    res.json(responseData)
}
module.exports = {logsPayments, logsLoans, dailyReport}
