require("dotenv").config();
const csvToJson = require("convert-csv-to-json");

const Account = require("../models/account");
const Customer = require("../models/customer");
const EnterpriseProgram = require("../models/enterpriseProgram");

const transporter = require("../config/mailer");
const restrictiveList = require("../models/restrictiveList");
const {
  registerInFilesSentTable,
  registerInFilesDetails,
} = require("./functions/register.js");
const Payroll = require("../models/payroll");
const { isWrongStructure, validateDataEmployees } = require("./functions/utils");

////#######################################################################
////--------------------------- inicio functions utils --------------------
const isDaviplataAlreadyCreated = async (employees, company, companyNit) => {
  let usersDontExisting = [];
  let userinAnotherCompany = [];
  for (let index = 0; index < employees.length; index++) {
    const customerInfo = await Customer.findOne({
      where: {
        IDENTIFICATION_NUMBER: employees[index].numeroidentificacion,
      },
    });
    if (customerInfo) {
      if (customerInfo.NAME_ENTERPRISE === "") {
        customerInfo.NAME_ENTERPRISE = company;
        customerInfo.IDENTIFICATION_ENTERPRISE = companyNit;
        customerInfo.save();
        const employInfo = await Account.findOne({
          where: {
            PRODUCT: employees[index].numeroidentificacion,
            SUBPRODUCT: employees[index].numerocelular,
          },
        });
        employInfo.PAYROLL_ADVANCE = true;

        employInfo.save();
      } else {
        userinAnotherCompany.push(employees[index]);
      }
    } else {
      usersDontExisting.push(employees[index]);
    }
  }
  console.log(
    "----------------en otraaaaaaaa------------ ",
    userinAnotherCompany.length
  );
  console.log(
    "----------------no existe------------ ",
    usersDontExisting.length
  );

  return { usersDontExisting, userinAnotherCompany };
};

const altaCliente = async (
  identificationNumber,
  firstname2,
  firstname1,
  lastname1,
  lastname2,
  cellphone,
  correo,
  expedicion,
  company = "",
  companyNit = "",
  salario
) => {
  try {
    await Customer.create(
      {
        // CUSTOMER_ID: Math.floor(Math.random() * 1000),
        NAME: firstname1 + " " + lastname1,
        FIRST_NAME1: firstname1,
        LAST_NAME1: lastname1,
        FIRST_NAME2: firstname2,
        LAST_NAME2: lastname2,
        PERSON_TYPE: "natural",
        EMAIL: correo,
        IDENTIFICATION_TYPE: 106,
        IDENTIFICATION_NUMBER: identificationNumber,
        NAME_ENTERPRISE: company,
        IDENTIFICATION_ENTERPRISE: companyNit,
        SALARY: salario,
        LOCATION_DOCUMENT: expedicion,
        STATUS: 1,
        STATUS_DATE: Date.now(),
        ACCOUNTs: [
          {
            PRODUCT: identificationNumber,
            SUBPRODUCT: cellphone,
            CURRENCY: 3,
            BALANCE_TODAY: 0,
            PAYROLL_ADVANCE: true,
            // OPERATION_ID: Math.floor(Math.random() * 1000),
            CUSTOMER_OPERATION: {
              SUBPRODUCT: cellphone,
              TYPE: 2,
              STATUS: 1,
              STATUS_DATE: Date.UTC(2016, 0, 1),
              STAMP_USER: 2058,
              STAMP_DATE_TIME: Date.UTC(2016, 0, 1),
              ISO_PRODUCT: 1,
            },
          },
        ],
        PAYROLL: {
          AMOUNT: 0,
          CUSTOMER_IDENTIFICATION: identificationNumber,
          CUSTOMER_NUMBER: cellphone,
          USER_ENTERPRISE: company
        },
      },
      {
        include: [Account, Payroll],
      }
    );
    // sendMailNewUser(firstname1, lastname1, correo);
    return true;
  } catch (error) {
    console.log("fallo creandoooo");
    console.log(error);
  }
};

const sendMailNewUser = async (firstname1, lastname1, correo) => {
  await transporter.sendMail({
    from: '"Davivienda 👻" <davivienda@example.com>', // sender address
    to: `${correo}`, // list of receivers
    subject: "Finaliza tu registro para adelanto de nómina", // Subject line
    // html: '<div><table><thead><tr><th>NOMBRE</th><th>APELLIDO</th><th>DOCUMENTO</th><th>CELULAR</th></tr></thead><tbody>' + content + '</tbody></table></div>' // html body
    html: `<h1>Hola ${firstname1} ${lastname1}</h1><h3>Queremos informarte que tu empresa te ha inscrito en el programa adelanto de nómina pero hemos detectado que no tienes daviplata activo, por lo que debes completar tu registro para que puedas realizar adelantos de nómina fácil y rápido:<br/>Sigue el siguiente link para completar tu registro: <a href="//play.google.com/store/apps/details?id=com.davivienda.daviplataapp&hl=es_CO&gl=US">AppStore</a>`, // html body
  });
};

const sendEmail = async (users, employees, email) => {
  // var content = users.reduce(function (a, b) {
  //   return (
  //     a +
  //     '<tr><td>' +
  //     b.nombres +
  //     '</a></td><td>' +
  //     b.apellidos +
  //     '</td><td>' +
  //     b.numerocelular +
  //     '</td><td>' +
  //     b.numeroidentificacion +
  //     '</td></tr>'
  //   );
  // }, '');

  await transporter.sendMail({
    from: '"Davivienda 👻" <davivienda@example.com>', // sender address
    to: `${email}`, // list of receivers
    subject: "Reporte final registro avance de nómina", // Subject line
    // html: '<div><table><thead><tr><th>NOMBRE</th><th>APELLIDO</th><th>DOCUMENTO</th><th>CELULAR</th></tr></thead><tbody>' + content + '</tbody></table></div>' // html body
    html: `<h1>Hola</h1><h3>Este es tu reporte final del registro de adelanto de nomina:<br/> Total de funcionarios recibidos: ${
      employees.length
    }<br/> Funcionarios con daviplata: ${
      employees.length - users.length
    }<br/>Funcionarios sin daviplata: ${
      users.length
    }<br/><br/><b>Nota: Se envió un correo electrónico indicando los pasos a seguir a cada uno de los funcionarios.</b></h3>`, // html body
  });
};

const sendEmailFailed = async (email) => {
  await transporter.sendMail({
    from: '"Davivienda 👻" <davivienda@example.com>', // sender address
    to: `${email}`, //"test-dav@mailinator.com", // list of receivers
    subject: "Reporte fallido avance de nómina", // Subject line
    html: "<h1>Hola</h1><h2>Tu registro no ha sido completado, estás en listas restrictivas</h2>", // html body
  });
};
////--------------------------- fin functions utils -----------------------
////#######################################################################

const createUser = async (req, res) => {
  const {
    identificationNumber,
    firstname2,
    firstname1,
    lastname1,
    lastname2,
    cellphone,
  } = req.body;
  altaCliente(
    identificationNumber,
    firstname2,
    firstname1,
    lastname1,
    lastname2,
    cellphone
  ).then((newClient) => {
    if (!newClient) {
      res.json({
        error: "usuario no creado",
      });
    } else {
      res.json({ message: "usuario creado" });
    }
  });
};

const registerInProgram = async (req, res) => {
  const {
    nit,
    name,
    address,
    nitLegalRepresentative,
    nameLegalRepresentative,
    lastLegalRepresentative,
    email,
  } = req.body;
  if (
    nit &&
    name &&
    address &&
    nitLegalRepresentative &&
    nameLegalRepresentative &&
    lastLegalRepresentative &&
    email
  ) {
    const legalRepIsInRestrictive = await restrictiveList.findOne({
      NIT: nitLegalRepresentative,
    });
    const isInResctrictiveList = await restrictiveList.findOne({
      where: {
        NIT: nit,
      },
    });
    if (isInResctrictiveList) {
      sendEmailFailed(email);
      res.json({ error: "Empresa en listas restrictivas" });
    } else if (legalRepIsInRestrictive) {
      res.json({ error: "Representante legal en listas restrictivas" });
    } else {
      const enterprise = await EnterpriseProgram.findOne({
        where: {
          NIT: nit,
        },
      });
      if (!enterprise) {
        console.log("----------------empresda no existe------------");
        const newEnterprise = await EnterpriseProgram.create({
          NIT: nit,
          NAME: name,
          ADDRESS: address,
          NAME_LEGAL_REPRESENTATIVE: nameLegalRepresentative,
          LAST_NAME_LEGAL_REPRESENTATIVE: lastLegalRepresentative,
          NIT_LEGAL_REPRESENTATIVE: nitLegalRepresentative,
          EMAIL: email,
        });
        await Account.create({
          PRODUCT: "654321",
          SUBPRODUCT: nit,
          CURRENCY: 1,
          BALANCE_TODAY: 10000000,
          AVAILABLE: 10000000,
          PAYROLL_ADVANCE: true,
        });
        res.json("ok");
      } else {
        res.json({ error: "Compañia ya existe" });
      }
    }
  }
};

const readFile = async (req, res) => {
  var fileId = Math.floor(Math.random() * 100000);
  const { company, companyNit, email } = req.body;

  const isInResctrictiveList = await restrictiveList.findOne({
    where: {
      NIT: companyNit,
    },
  });
  if (isInResctrictiveList) {
    sendEmailFailed(email);
    return res.json({ error: "empresa en listas restrictivas" });
  }

  let uploadPath;
  const dataAccepted = [
    "nombres",
    "apellidos",
    "tipoidentificacion",
    "numeroidentificacion",
    "fechaexpedicion",
    "lugarexpedicion",
    "correo",
    "numerocelular",
    "politicamenteexpuesta",
    "salario",
  ];

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "falta el archivo" });
  }

  funcionarios = req.files.funcionarios;
  uploadPath = "./static/" + funcionarios.name;

  let errors = [];

  await funcionarios.mv(uploadPath, (err) => {
    if (err) {
      console.log(err);
    }
    const employees = csvToJson.getJsonFromCsv(uploadPath);

    if (employees.length === 0) {
      // res.json({Error})
      res.status(400).json({ error: "Archivo vacio" });
      return;
    }

    Object.keys(employees[0]).forEach((key) => {
      if (!dataAccepted.includes(key)) {
        errors.push(key);
      }
    });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors });
    } else {
      registerInFilesSentTable(
        company,
        companyNit,
        "register",
        fileId,
        employees.length
      );
      isDaviplataAlreadyCreated(employees, company, companyNit).then(
        (users) => {
          if (users.usersDontExisting.length > 0) {
            // sendEmail(users, employees, email);
            for (let i = 0; i < users.usersDontExisting.length; i++) {
              altaCliente(
                users.usersDontExisting[i].numeroidentificacion,
                users.usersDontExisting[i].nombres.split(" ")[0],
                users.usersDontExisting[i].nombres.split(" ")[1],
                users.usersDontExisting[i].apellidos.split(" ")[0],
                users.usersDontExisting[i].apellidos.split(" ")[1],
                users.usersDontExisting[i].numerocelular,
                users.usersDontExisting[i].correo,
                users.usersDontExisting[i].lugarexpedicion,
                company,
                companyNit,
                users.usersDontExisting[i].salario
              ).then((userCreated) => {
                registerInFilesDetails(
                  users.usersDontExisting[i].numeroidentificacion,
                  fileId,
                  "register",
                  "ok"
                );
                if (userCreated) {
                  console.log("usuario creado");
                }
              });
            }
          }
          if (users.userinAnotherCompany.length > 0) {
            console.log(
              "usuarios en otra compañia: ",
              users.userinAnotherCompany.length
            );
            return res.json({ feedBack: users.userinAnotherCompany });
          } else {
            return res.json({ status: "ok" });
          }
        }
      );
    }
  });
};

const validateFile = async (req, res) => {
  const { companyNit, company, email } = req.body;
  let uploadPath;
  const dataAccepted = [
    "nombres",
    "apellidos",
    "tipoidentificacion",
    "numeroidentificacion",
    "fechaexpedicion",
    "lugarexpedicion",
    "correo",
    "numerocelular",
    "politicamenteexpuesta",
    "salario",
  ];

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.json({ feedBack: ["falta el archivo"] });
  }

  funcionarios = req.files.funcionarios;
  uploadPath = "./static/" + funcionarios.name;

  let errors = [];
  if (!funcionarios) {
    return;
  }

  await funcionarios.mv(uploadPath, async (err) => {
    const employees = csvToJson.getJsonFromCsv(uploadPath);
    const wrongStructure = isWrongStructure(employees[0], dataAccepted)
    if(wrongStructure) {
      res.json({ feedBack: ["Estructura incorrecta"] });
      return;
    }
    const validateData = await validateDataEmployees(employees);
    const usersinOther = await isDaviplataAlreadyCreated(
      employees,
      company,
      companyNit
    );

    if (employees.length === 0) {
      res.json({ feedBack: ["Archivo vacio"] });
      return;
    }
    else if (validateData) {
      errors.push("Datos incorrectos")
    }
    else if (usersinOther.userinAnotherCompany.length > 0) {
      errors.push("funcionarios ya registrados")
    }

    if (errors.length > 0) {
      return res.json({ feedBack: errors });
    } else {
      res.json({
        feedBack: [
          'Verificación de archivo e información exitosa'
        ],
      });
    }
  });
};

module.exports = {
  createUser,
  registerInProgram,
  readFile,
  validateFile,
  isDaviplataAlreadyCreated,
  altaCliente,
};
