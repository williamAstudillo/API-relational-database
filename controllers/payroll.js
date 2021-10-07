const Loan = require("../models/loan");
const moment = require("moment");
const Account = require("../models/account");
const Customer = require("../models/customer");
const Payroll = require("../models/payroll");

const newPayroll = async (req, res) => {
  const { identificationNumber, cellphone, amount, fecha } = req.body;
  console.log("fechaaa frontal", new Date(fecha))
  console.log("fecha backend", new Date())
  const actualUtc = new Date(fecha).getTime() + new Date(fecha).getTimezoneOffset() * 60000;
  const utcCorrected = new Date(actualUtc);
  // console.log("fechaaaaaa ", new Date(parseInt(fecha)))
  console.log("celular###", cellphone)
  const accountInfo = await Account.findOne({
    where: {
      PRODUCT: identificationNumber,
      SUBPRODUCT: cellphone,
    },
  });
  if (accountInfo) {
    const customerInfo = await Customer.findOne({
      where: {
        IDENTIFICATION_NUMBER: identificationNumber,
      },
    });
    const payrollInfo = await Payroll.findOne({
      where: {
        CUSTOMER_NUMBER: cellphone,
        CUSTOMER_IDENTIFICATION: identificationNumber,
      },
    });

    if (customerInfo.SALARY > payrollInfo.AMOUNT + amount) {
      await Loan.create({
        STAMP_USER: cellphone,
        ACCOUNTOPERATIONID: accountInfo.OPERATION_ID,
        LOAN_TYPE: 3,
        LO_PRINCIPAL_AMOUNT: amount + 10000,
        BEGIN_DATE:utcCorrected,
        LO_OPENING_DATE: utcCorrected,
        EXPIRY_DATE: new Date(2021, 8, 30)
      });
      payrollInfo.AMOUNT = payrollInfo.AMOUNT + amount
      payrollInfo.COUNTER = payrollInfo.COUNTER + 1;
      payrollInfo.TAXES = payrollInfo.TAXES + 10000;
      payrollInfo.save();
      accountInfo.AVAILABLE = accountInfo.AVAILABLE + amount;
      accountInfo.BALANCE_TODAY = accountInfo.BALANCE_TODAY + amount;
      accountInfo.LOCKED = accountInfo.LOCKED + amount + 10000;
      accountInfo.save();
      res.json({
        celular: accountInfo.SUBPRODUCT,
        disponible: accountInfo.AVAILABLE,
        adelantos: payrollInfo.AMOUNT + payrollInfo.TAXES,
        cupo: customerInfo.SALARY - payrollInfo.AMOUNT,
      });
    } else {
      res.json({
        feedBack: `No tienes cupo para realizar tu adelanto de nómina`,
      });
    }
  }
};

module.exports = { newPayroll };
