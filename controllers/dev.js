const restrictiveList = require("../models/restrictiveList");
const Account = require("../models/account");
const insertInrestrictiveList = async (req, res) => {
  await restrictiveList.create({
    NIT: req.body.nit,
  });
  res.json({ ok: "true" });
};

const createAccountEnterprise = async (req, res) => {
  const { accountNumber, nit, amount } = req.body;
  await Account.create({
    PRODUCT: accountNumber,
    SUBPRODUCT: nit,
    CURRENCY: 1,
    BALANCE_TODAY: amount,
    AVAILABLE: amount,
    PAYROLL_ADVANCE: true,
  });
  res.json({ created: "ok" });
};
module.exports = { insertInrestrictiveList, createAccountEnterprise };
