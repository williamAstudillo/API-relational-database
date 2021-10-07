const csvToJson = require("convert-csv-to-json");
const moment = require('moment')
const { Op } = require('sequelize')

// const transporter = require("../config/mailer");

const Account = require("../models/account");
const Customer = require("../models/customer");

const EnterpriseProgram = require("../models/enterpriseProgram");
const Loan = require("../models/loan");
const Payment = require("../models/payments");
const Payroll = require("../models/payroll");
const {
  registerInFilesDetails,
  registerInFilesSentTable,
} = require("./functions/register");
const { isWrongStructure, isEmpty, isNotNumber } = require("./functions/utils");
const { isDaviplataAlreadyCreated, altaCliente } = require("./register");

//---------------------------utils functions---------------------------
const checkDaviplata = async (employee, enterprise) => {
  const existAccountEmployee = await Account.findOne({
    where: {
      PRODUCT: employee.numeroidentificacion,
      SUBPRODUCT: employee.numerocelular,
    },
  });
  if (!existAccountEmployee) {
    console.log(
      "el funcionario " + employee.numerocelular + " no tiene daviplata"
    );
    await altaCliente(
      employee.numeroidentificacion,
      "",
      "",
      "",
      "",
      employee.numerocelular,
      "",
      enterprise.NAME,
      enterprise.NIT,
      0
    );
    return 1;
  } else {
    return 0;
  }
};
//select * from FILES_SENTs join FILES_DETAILs on FILES_SENTs.FILE_ID = FILES_DETAILs.FILE_ID;
const verifyData = async (
  employees,
  totalEmployees,
  totalAmount,
  enterprise
) => {
  let sum = 0;
  let employeesWithoutDaviplata = 0;
  for (let i = 0; i < employees.length; i++) {
    sum = parseFloat(employees[i].monto) + sum;
    employeesWithoutDaviplata += await checkDaviplata(employees[i], enterprise);
  }
  if (
    sum === parseFloat(totalAmount) &&
    parseInt(totalEmployees) === employees.length
  ) {
    console.log("verificacion correcta---------------");
    return [true, employeesWithoutDaviplata];
  }
  console.log("verificacion FALLIDA---------------");

  return [false, employeesWithoutDaviplata];
};

/**
 * Realiza los pagos de nomina a un empleado por parte de la empresa
 * @param {Object} employeeInfo
 * @param {number} mon
 * @returns objeto con la informacion ed la cuenta
 */
const checkLocked = async (employeeInfo, mon) => {
  const monto = parseFloat(mon);
  let newAmount;
  const cutomerData = await Customer.findOne({
    where: {
      IDENTIFICATION_NUMBER: employeeInfo.PRODUCT,
    },
  });
  const payrollData = await Payroll.findOne({
    where: {
      CUSTOMER_NUMBER: employeeInfo.SUBPRODUCT,
    },
  });
  // registrar en la base de datos los creditos(loans) que se cancelaron INVESTIGAR
  // https://stackoverflow.com/questions/49643047/update-multiple-rows-in-sequelize-with-different-conditions
  // https://sequelize.org/master/manual/model-querying-basics.html#operators

  if (employeeInfo.LOCKED > 0) {
    console.log(
      "el funcionario realizo adelantos-----------------------------------------------------------------"
    );
    newAmount = monto - payrollData.AMOUNT - payrollData.TAXES;
    if (newAmount >= 0) {

      console.log("pago toda la deuda");
      employeeInfo.BALANCE_TODAY = employeeInfo.BALANCE_TODAY + newAmount;
      employeeInfo.AVAILABLE = employeeInfo.AVAILABLE + newAmount;
      employeeInfo.LOCKED = 0;
      employeeInfo.save();
      payrollData.AMOUNT = 0;
      payrollData.TAXES = 0;
      payrollData.COUNTER = 0;
      payrollData.save();

      const loanData =  await Loan.findAll(
      {
        where: {
          STAMP_USER: employeeInfo.SUBPRODUCT,
          LOAN_TYPE: 3,
          CLOSED_DATE: null
        }
      })
      for (let j = 0; j < loanData.length; j++) {
        loanData[j].LO_CURRENT_PAYMENT_AMOUNT = loanData[j].LO_PRINCIPAL_AMOUNT
        loanData[j].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
        loanData[j].save()
      }
    } else {
      console.log("pago parcial de la deuda");
      employeeInfo.LOCKED = employeeInfo.LOCKED - monto;
      employeeInfo.save();
      payrollData.AMOUNT = payrollData.AMOUNT - monto;
      // payrollData.CURRENT_PAYMENT_AMOUNT = payrollData.CURRENT_PAYMENT_AMOUNT + monto
      payrollData.save();
      const loansData = await Loan.findAll({
        where: {
          STAMP_USER: employeeInfo.SUBPRODUCT,
          LOAN_TYPE: 3,
          CLOSED_DATE: null
        }
      })
      let amountPayed = monto
      let i = 0
      while (amountPayed > 0) {
        console.log("registrando pago en loan")
        if (loansData[i].LO_PRINCIPAL_AMOUNT <= amountPayed) {
          console.log("puede pagar toda la deuuda de ", loansData[i].LO_PRINCIPAL_AMOUNT)
          if (loansData[i].LO_CURRENT_PAYMENT_AMOUNT) { // si ya se han realizado pagos a esa deuda
            let amountToPay = loansData[i].LO_PRINCIPAL_AMOUNT - loansData[i].LO_CURRENT_PAYMENT_AMOUNT
            loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_PRINCIPAL_AMOUNT
            loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
            amountPayed = amountPayed - amountToPay
          }
          else {
            loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_PRINCIPAL_AMOUNT
            amountPayed = amountPayed - loansData[i].LO_PRINCIPAL_AMOUNT
          }
        }
        else {
          console.log("puede parcialmente la deuuda de ", loansData[i].LO_PRINCIPAL_AMOUNT)

          loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_CURRENT_PAYMENT_AMOUNT + amountPayed
          if (loansData[i].LO_CURRENT_PAYMENT_AMOUNT == loansData[i].LO_PRINCIPAL_AMOUNT) {
            console.log("CLOSED--------------------")
            loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
          }
          amountPayed = 0
        }
        loansData[i].save()
        i++
      }
    }
  } else {
    console.log("no tiene adelantos########");
    employeeInfo.BALANCE_TODAY = employeeInfo.BALANCE_TODAY + monto;
    employeeInfo.AVAILABLE = employeeInfo.AVAILABLE + monto;
    employeeInfo.save();
  }
  return {
    celular: employeeInfo.SUBPRODUCT,
    disponible: employeeInfo.AVAILABLE,
    adelantos: payrollData.AMOUNT + payrollData.TAXES,
    cupo: cutomerData.SALARY - payrollData.AMOUNT,
  };
};

/**
 * realiza depositos por pago de nomina a empleados
 * @param {Object} employee
 *
 */
const makeDepositToEmployment = async (employee) => {
  const employeeInfo = await Account.findOne({
    where: {
      PRODUCT: employee.numeroidentificacion,
      SUBPRODUCT: employee.numerocelular,
    },
  });
  if (employeeInfo) {
    await checkLocked(employeeInfo, employee.monto);
  }
};
// const sendFinalMail = async (enterpriseInfo, usersToHold, employees) => {
//   console.log("hold users -------", usersToHold);
//   console.log("email: :::::::::::", enterpriseInfo.EMAIL);
//   await transporter.sendMail({
//     from: '"Davivienda 👻" <davivienda@example.com>', // sender address
//     to: `${enterpriseInfo.EMAIL}`, // list of receivers
//     subject: "Reporte final pago de nómina", // Subject line
//     // html: '<div><table><thead><tr><th>NOMBRE</th><th>APELLIDO</th><th>DOCUMENTO</th><th>CELULAR</th></tr></thead><tbody>' + content + '</tbody></table></div>' // html body
//     html: `<h1>Hola</h1><h3>Este es tu reporte final de pago de nomina:<br/> Total de funcionarios recibidos: ${
//       employees.length
//     }<br/> Funcionarios con daviplata: ${
//       employees.length - usersToHold
//     }<br/>Funcionarios sin daviplata: ${usersToHold}<br/><br/><b>Nota: Se envió un correo electrónico indicando los pasos a seguir a cada uno de los funcionarios.</b></h3>`, // html body
//   });
// };
// const sendReportMailInsuficientFunds = async (enterpriseInfo) => {
//   console.log("email: :::::::::::", enterpriseInfo.EMAIL);

//   await transporter.sendMail({
//     from: '"Davivienda 👻" <davivienda@example.com>', // sender address
//     to: `${enterpriseInfo.EMAIL}`, // list of receivers
//     subject: "Reporte final de pago de nómina Fallido", // Subject line
//     // html: '<div><table><thead><tr><th>NOMBRE</th><th>APELLIDO</th><th>DOCUMENTO</th><th>CELULAR</th></tr></thead><tbody>' + content + '</tbody></table></div>' // html body
//     html: `<h1>Hola</h1><h3>te informamos que la operación de pago de nómina no fue llevaba a cabo debido a que la cuenta que proporcionaste no cuenta con los fondos suficientes.`, // html body
//   });
// };

const validatepaymentFileData = (employees) => {
  for (let i = 0; i < employees.length; i++) {
    if (isEmpty(employees[i])) {
      return true;
    }
    if (
      isNotNumber(employees[i].numerocelular) ||
      isNotNumber(employees[i].numeroidentificacion) ||
      isNaN(employees[i].monto)
    ) {
      return true;
    }
  }
};

/**
 * Revisa la validez de los datos del formulario
 * @param {Object} employees
 * @param {Object} req
 * @returns return un string indicando el error o undefined en caso de no encontrar errores
 */
const validateFormData = async (employees, req) => {
  const { nit, companyAccountNumber, totalAmount } = req.body;
  console.log("total amount: ", totalAmount);
  let sumTotalMonto = 0;

  const enterpriseInfo = await EnterpriseProgram.findOne({
    where: {
      NIT: nit,
    },
  });
  if (!enterpriseInfo) {
    return "Datos incorrectos";
  }
  const enterpriseAccountInfo = await Account.findOne({
    where: {
      PRODUCT: companyAccountNumber,
    },
  });
  if (!enterpriseAccountInfo) {
    return "Cuenta no existe";
  }

  for (let i = 0; i < employees.length; i++) {
    sumTotalMonto += parseFloat(employees[i].monto);
    if (sumTotalMonto > enterpriseAccountInfo.AVAILABLE) {
      return "Fondos insuficientes";
    }
    // const accountSent = await Account.findOne({
    //   where: {
    //     PRODUCT: employees[i].numeroidentificacion,
    //     SUBPRODUCT: employees[i].numerocelular,
    //   },
    // });

    const customerSent = await Customer.findOne({
      where: {
        IDENTIFICATION_NUMBER: employees[i].numeroidentificacion,
        IDENTIFICATION_ENTERPRISE: nit,
      },
    });
    if (!customerSent) {
      return "Funcionarios no registrados en la empresa";
    }
  }
  console.log("suma total: ", parseFloat(sumTotalMonto.toFixed(2)));
  console.log("pasrse total: ", parseFloat(totalAmount));
  if (parseFloat(sumTotalMonto.toFixed(2)) !== parseFloat(totalAmount)) {
    return "Datos incorrectos";
  }
  return undefined;
};

// -----------------------fin utils functions -----------------------

const payments = async (req, res) => {
  console.log(req.body, "-------------------------------");
  const { nit, totalEmployees, companyAccountNumber, totalAmount } = req.body;

  if (nit && totalEmployees && companyAccountNumber && totalAmount) {
    var fileId = Math.floor(Math.random() * 100000);

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: "falta el archivo" });
    }
    let uploadPath;
    const dataAccepted = ["numerocelular", "numeroidentificacion", "monto"];
    funcionarios = req.files.pagos;
    uploadPath = "./static/" + funcionarios.name;

    let errors = [];

    try {
      const enterpriseAccountInfo = await Account.findOne({
        where: {
          PRODUCT: companyAccountNumber,
          SUBPRODUCT: nit,
        },
      });
      const enterpriseInfo = await EnterpriseProgram.findOne({
        where: {
          NIT: nit,
        },
      });

      if (enterpriseAccountInfo.BALANCE_TODAY > totalAmount) {
        enterpriseAccountInfo.BALANCE_TODAY =
          enterpriseAccountInfo.BALANCE_TODAY - totalAmount;
        enterpriseAccountInfo.AVAILABLE =
          enterpriseAccountInfo.AVAILABLE - totalAmount;
        enterpriseAccountInfo.save();

        await funcionarios.mv(uploadPath, (err) => {
          if (err) {
            console.log(err);
          }
          const employees = csvToJson.getJsonFromCsv(uploadPath);

          if (employees.length === 0) {
            res.status(400).json({ error: "Archivo vacio" });
            return;
          }

          Object.keys(employees[0]).forEach((key) => {
            if (!dataAccepted.includes(key)) {
              errors.push(key);
            }
          });
          if (errors.length > 0) {
            console.log(errors, "----------------");
            return res.status(400).json({ error: errors });
          } else {
            registerInFilesSentTable(
              enterpriseInfo.NAME,
              nit,
              "payment",
              fileId,
              employees.length
            );
            for (let i = 0; i < employees.length; i++) {
              makeDepositToEmployment(employees[i]);
              registerInFilesDetails(
                employees[i].numeroidentificacion,
                fileId,
                "payment",
                "ok"
              );
            }
            // sendFinalMail(enterpriseInfo, verifyResponse[1], employees);
          }
        });
      } else {
        sendReportMailInsuficientFunds(enterpriseInfo);
        return res.json({ error: "cuenta sin fondos suficientes" });
      }
    } catch (error) {
      console.log(error);
      return res.json(error);
    }
  }
};

const deposits = async (req, res) => {
  const { cellphone, amount } = req.body;
  let monto = parseFloat(amount)
  console.log("ceunta apagar: ", cellphone)
  const actualDate = new Date();

  const actualUtc = actualDate.getTime() + actualDate.getTimezoneOffset() * 60000;
  const utcCorrected = new Date(actualUtc);
  console.log("monto que se va a pagar: ", monto)
  // const monto = parsei(amount)
  const accountInfo = await Account.findOne({
    where: {
      SUBPRODUCT: cellphone,
    },
  });
  const cutomerData = await Customer.findOne({
    where: {
      IDENTIFICATION_NUMBER: accountInfo.PRODUCT,
    },
  });
  const payrollData = await Payroll.findOne({
    where: {
      CUSTOMER_NUMBER: accountInfo.SUBPRODUCT,
    },
  });
  if (accountInfo.LOCKED > 0) {
    console.log("disponible: ", accountInfo.AVAILABLE)
    if (monto >= payrollData.AMOUNT + payrollData.TAXES) {
      if (accountInfo.AVAILABLE >= monto) {
        console.log("fondos para pagar TODO")
        accountInfo.AVAILABLE = accountInfo.AVAILABLE - monto
        accountInfo.BALANCE_TODAY = accountInfo.BALANCE_TODAY - monto
        accountInfo.LOCKED = 0
        accountInfo.save()
        payrollData.AMOUNT = 0;
        payrollData.TAXES = 0;
        payrollData.COUNTER = 0;
        payrollData.save();
        
        const loanData =  await Loan.findAll(
          {
            where: {
              STAMP_USER: accountInfo.SUBPRODUCT,
              LOAN_TYPE: 3,
              CLOSED_DATE: null
            }
          })
          for (let j = 0; j < loanData.length; j++) {
            loanData[j].LO_CURRENT_PAYMENT_AMOUNT = loanData[j].LO_PRINCIPAL_AMOUNT
            loanData[j].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
            loanData[j].save()
          }
      }
      else {
        console.log("fondos insuficientesssssssdd")
      }
    }
    else {
      console.log("fondos para pagar PARCIALMENTE")
      accountInfo.AVAILABLE = accountInfo.AVAILABLE - monto
      accountInfo.BALANCE_TODAY = accountInfo.BALANCE_TODAY - monto
      accountInfo.LOCKED = accountInfo.LOCKED - monto
      accountInfo.save()
      payrollData.AMOUNT = payrollData.AMOUNT - monto
      // payrollData.CURRENT_PAYMENT_AMOUNT = parseFloat(payrollData.CURRENT_PAYMENT_AMOUNT) + monto
      payrollData.save()
      const loansData = await Loan.findAll({
        where: {
          STAMP_USER: accountInfo.SUBPRODUCT,
          LOAN_TYPE: 3,
          CLOSED_DATE: null
        }
      })
      let amountPayed = monto
      let i = 0
      while (amountPayed > 0) {
        console.log("registrando pago en loan")
        if (loansData[i].LO_PRINCIPAL_AMOUNT <= amountPayed) {
          console.log("puede pagar toda la deuuda de ", loansData[i].LO_PRINCIPAL_AMOUNT)
          if (loansData[i].LO_CURRENT_PAYMENT_AMOUNT) { // si ya se han realizado pagos a esa deuda
            let amountToPay = loansData[i].LO_PRINCIPAL_AMOUNT - loansData[i].LO_CURRENT_PAYMENT_AMOUNT
            loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_PRINCIPAL_AMOUNT
            loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
            amountPayed = amountPayed - amountToPay
          }
          else {
            loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_PRINCIPAL_AMOUNT
            loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
            amountPayed = amountPayed - loansData[i].LO_PRINCIPAL_AMOUNT
          }
        }
        else { // si el monto que se desea pagar es inferior a la deuda actual
          console.log("puede parcialmente la deuuda de ", loansData[i].LO_PRINCIPAL_AMOUNT)
          if (loansData[i].LO_CURRENT_PAYMENT_AMOUNT) {
            let newAmount = (loansData[i].LO_CURRENT_PAYMENT_AMOUNT + amountPayed) - loansData[i].LO_PRINCIPAL_AMOUNT
            if (newAmount >= 0) {
              console.log("closeeedd uno..............")
              loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_PRINCIPAL_AMOUNT
              loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
              amountPayed = newAmount
            }
            else {
              console.log("newAmount negativo")
              loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_CURRENT_PAYMENT_AMOUNT + amountPayed
              amountPayed = 0
            }
          }
          else {
            loansData[i].LO_CURRENT_PAYMENT_AMOUNT = loansData[i].LO_CURRENT_PAYMENT_AMOUNT + amountPayed
            amountPayed = 0
          }
          console.log("pagado actualmente: ", loansData[i].LO_CURRENT_PAYMENT_AMOUNT)
          console.log("deuda total: ", loansData[i].LO_PRINCIPAL_AMOUNT)
          if (loansData[i].LO_CURRENT_PAYMENT_AMOUNT == loansData[i].LO_PRINCIPAL_AMOUNT) {
            console.log("CLOSED 2--------------------")
            loansData[i].CLOSED_DATE = moment(Date.now()).utc().format("YYYY-MM-DD HH:mm:ss")
          }
        }
        loansData[i].save()
        i++
      }
    }

    await Payment.create({
      PAYMENT_DATE: utcCorrected,
      USER_ENTERPRISE: cutomerData.NAME_ENTERPRISE,
      AMOUNT: monto,
      STAMP_USER: accountInfo.SUBPRODUCT
    })
  }
  res.json({
    celular: accountInfo.SUBPRODUCT,
    disponible: accountInfo.AVAILABLE,
    adelantos: payrollData.AMOUNT + payrollData.TAXES,
    cupo: cutomerData.SALARY - payrollData.AMOUNT,
  })
};

const validateFile = async (req, res) => {
  let uploadPath;
  const dataAccepted = ["numerocelular", "numeroidentificacion", "monto"];

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.json({ feedBack: ["falta el archivo"] });
  }

  funcionarios = req.files.pagos;
  uploadPath = "./static/" + funcionarios.name;

  if (!funcionarios) {
    return;
  }
  let errors = [];

  await funcionarios.mv(uploadPath, async (err) => {
    const employees = csvToJson.getJsonFromCsv(uploadPath);

    if (employees.length === 0) {
      res.json({ feedBack: ["Archivo vacio"] });
      return;
    }
    const wrongData = isWrongStructure(employees[0], dataAccepted);
    if (wrongData) {
      res.json({ feedBack: ["Estructura incorrecta"] });
      return;
    }

    const validateData = validatepaymentFileData(employees);
    if (validateData) {
      errors.push("Datos incorrectos en el archivo");
    }
    const validateValues = await validateFormData(employees, req);
    if (validateValues) {
      errors.push(validateValues);
    }
    Object.keys(employees[0]).forEach((key) => {
      if (!dataAccepted.includes(key)) {
        errors.push(key);
      }
    });

    if (errors.length > 0) {
      return res.json({ feedBack: [errors[0]] });
    } else {
      res.json({
        feedBack: ["Verificación de archivo e información exitosa"],
      });
    }
  });
};

module.exports = { payments, validateFile, deposits };
