const EnterpriseProgram = require('../models/enterpriseProgram');
const getEnterpriseData = async (req, res) => {
  const { nit } = req.params;
  if(nit){
    const enterprise = await EnterpriseProgram.findOne({
      where: {
        NIT: nit,
      },
    });
    res.send(enterprise);
  }
};

module.exports = { getEnterpriseData };
