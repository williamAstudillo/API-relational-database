const FilesSent = require("../../models/filesSent");
const FilesDetails = require("../../models/filesDetails");
const Customer = require("../../models/customer");
const moment = require("moment");

const registerInFilesSentTable = async (
  company,
  companyNit,
  typeFile,
  fileId,
  numberOfRegisters
) => {
  await FilesSent.create({
    COMPANY_NAME: company,
    NIT: companyNit,
    TYPE: typeFile,
    DATE: moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss"),
    FILE_ID: fileId,
    NUMBER_OF_REGISTERS: numberOfRegisters,
    RECEIVING_DATE: moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss"),
  });
};
const registerInFilesDetails = async (
  numeroidentificacion,
  fileId,
  typeFile,
  status
) => {
  const currentCustomer = await Customer.findOne({
    where: {
      IDENTIFICATION_NUMBER: numeroidentificacion,
      IDENTIFICATION_TYPE: 106,
    },
  });
  if (currentCustomer) {
    FilesDetails.create({
      CUSTOMER_ID: currentCustomer.CUSTOMER_ID,
      STATUS: status,
      FILE_ID: fileId,
      TYPE: typeFile,
      PROCESSING_TIME: moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss"),
    });
  } else {
    FilesDetails.create({
      CUSTOMER_ID: "usuario no existe",
      STATUS: status,
      FILE_ID: fileId,
      TYPE: typeFile,
      PROCESSING_TIME: moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss"),
    });
  }
};
module.exports = { registerInFilesSentTable, registerInFilesDetails };
