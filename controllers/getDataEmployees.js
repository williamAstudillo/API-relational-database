const Customer = require('../models/customer');
const Account = require('../models/account');
const Loan = require('../models/loan');

const getDataEmployees = async (req, res) => {
  const customerData = await Customer.findAll({
    include: {
      model: Account,
    },
    order: ['LAST_NAME1'],
  });
  res.json(customerData);
};

const getDataEmploy = async (req, res) => {
  const { identificationNumber, cellphone } = req.body
  const customerData = await Customer.findOne({
    where: {
      IDENTIFICATION_NUMBER: identificationNumber
    },
    include: {
      model: Account,
      where: {SUBPRODUCT: cellphone}
    }
  })
  const loanData =  await Loan.findAll({
    where: {
      STAMP_USER: cellphone
    }
  })
  res.json({customerData, loanData})
}

module.exports = {getDataEmployees, getDataEmploy};
