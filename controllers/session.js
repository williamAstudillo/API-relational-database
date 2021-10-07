const Account = require("../models/account");
const Customer = require("../models/customer");
const CustomerOperation = require("../models/customerOperation");
const Payroll = require("../models/payroll");
const Session = require("../models/session");

const signIn = async (req, res) => {
  const { identificationNumber, password } = req.body;
  const loginUser = await Session.findOne({
    where: {
      IDENTIFICATION_NUMBER: identificationNumber,
    },
  });
  if (!loginUser) {
      await Session.create({
          IDENTIFICATION_NUMBER: identificationNumber,
          PASS: password
      })
      res.json({status: "ok"})
  }
  else {
      res.json({error: "Usuario ya existe"})
  }
} 

const login = async (req, res) => {
  const { identificationNumber, password } = req.body;
  const loginUser = await Session.findOne({
    where: {
      IDENTIFICATION_NUMBER: identificationNumber,
      PASS: password,
    },
  });
  if (loginUser) {
    const customerInfo = await Customer.findOne({
      where: {
        IDENTIFICATION_NUMBER: identificationNumber,
      },
    });
    const operationInfo = await CustomerOperation.findOne({
      where: {
        CUSTOMER_ID: customerInfo.CUSTOMER_ID,
      },
    });
    const accountInfo = await Account.findOne({
      where: {
        PRODUCT: identificationNumber,
        SUBPRODUCT: operationInfo.SUBPRODUCT,
      },
    });
    const payrollInfo = await Payroll.findOne({
      where: {
        CUSTOMER_IDENTIFICATION: identificationNumber,
        CUSTOMER_NUMBER: operationInfo.SUBPRODUCT,
      },
    });
    res.json({
      celular: operationInfo.SUBPRODUCT,
      disponible: accountInfo.AVAILABLE,
      adelantos: payrollInfo.AMOUNT + payrollInfo.TAXES,
      cupo: customerInfo.SALARY - payrollInfo.AMOUNT,
    });
  } else {
    res.json({ feedBack: "Usuario no existe" });
  }
};

module.exports = { login, signIn };
